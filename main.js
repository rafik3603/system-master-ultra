import Chart from 'chart.js/auto';

const API_BASE = 'http://localhost:3010/api';
let charts = {};
let allApps = [];
let activeCategory = 'all';

// Escape HTML to prevent XSS from untrusted desktop-file data
function esc(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// 1. Navigation — collapsible sidebar groups (accordion)
// ==========================================
function setGroupOpen(group, open) {
    group.classList.toggle('collapsed', !open);
}

function openGroup(group) {
    // Accordion: close all others, open this one
    document.querySelectorAll('.nav-group').forEach(g => setGroupOpen(g, g === group));
}

document.querySelectorAll('.nav-group-title').forEach(title => {
    title.addEventListener('click', (e) => {
        const group = title.parentElement;
        if (group.classList.contains('collapsed')) {
            openGroup(group);
        } else {
            setGroupOpen(group, false);
        }
        e.stopPropagation();
    });
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        // Smooth scroll to top on tab switch
        document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });

        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');

        // Keep the group holding the active tab open
        openGroup(btn.closest('.nav-group'));

        if (tabId === 'software') loadSoftware();
        if (tabId === 'startup') loadStartupApps();
        if (tabId === 'storage') loadLargeFiles();
        if (tabId === 'services') loadServices();
        if (tabId === 'installer') { checkWineStatus(); loadWinePrograms(); }
        if (tabId === 'network') loadPingTest();
        if (tabId === 'network-info') loadNetworkInfo();
        if (tabId === 'system-info') loadSystemInfo();
        if (tabId === 'partitions') loadPartitions();
        if (tabId === 'doctor') { runDoctorDiagnosis(); loadLogs(); }
        if (tabId === 'security') { updateUfwStatus(); loadUfwRules(); }
        if (tabId === 'processes') loadProcesses();
        if (tabId === 'network-pro') loadPorts();
        if (tabId === 'kernel') loadKernelModules();
    });
});

// Initial state: open only the group with the active tab (dashboard)
openGroup(document.querySelector('.nav-btn.active')?.closest('.nav-group'));

// ==========================================
// 2. Real-time Charts & Dashboard
// ==========================================
function initCharts() {
    const chartConfig = (color) => ({
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0),
                borderColor: color,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: color + '22'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } },
            plugins: { legend: { display: false } }
        }
    });

    charts.cpu = new Chart(document.getElementById('cpuChart'), chartConfig('#00f2ff'));
    charts.mem = new Chart(document.getElementById('memChart'), chartConfig('#7000ff'));
    charts.disk = new Chart(document.getElementById('diskChart'), chartConfig('#ff0055'));

    charts.network = new Chart(document.getElementById('networkChart'), {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [
                {
                    label: 'Download',
                    data: Array(20).fill(0),
                    borderColor: '#00ff88',
                    backgroundColor: '#00ff8822',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true
                },
                {
                    label: 'Upload',
                    data: Array(20).fill(0),
                    borderColor: '#ff0055',
                    backgroundColor: '#ff005522',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false, min: 0 } },
            plugins: { legend: { display: false } }
        }
    });
}

async function updateStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        updateChart(charts.cpu, data.cpu, 'cpuVal');
        updateChart(charts.mem, data.memory, 'memVal');
        updateChart(charts.disk, data.disk, 'diskVal');
        
        // Info Badges
        const kernelEl = document.getElementById('kernelVal');
        const uptimeEl = document.getElementById('uptimeVal');
        const memBadge = document.getElementById('memUsageBadge');
        const diskText = document.getElementById('diskUsageText');

        if (kernelEl) kernelEl.textContent = data.kernel;
        if (uptimeEl) uptimeEl.textContent = data.uptime;
        if (memBadge) memBadge.textContent = `${data.memUsed} / ${data.memTotal}`;
        if (diskText) diskText.textContent = `${data.diskUsed} / ${data.diskTotal}`;

        // Sidebar mini-stats (live)
        const sbCpu = document.getElementById('sbCpu');
        const sbRam = document.getElementById('sbRam');
        const sbDisk = document.getElementById('sbDisk');
        if (sbCpu) sbCpu.textContent = Math.round(data.cpu) + '%';
        if (sbRam) sbRam.textContent = Math.round(data.memory) + '%';
        if (sbDisk) sbDisk.textContent = Math.round(data.disk) + '%';

        // Network Traffic
        const netRes = await fetch(`${API_BASE}/network/traffic`);
        const netData = await netRes.json();
        const rxEl = document.getElementById('rxSpeed');
        const txEl = document.getElementById('txSpeed');
        if (rxEl) rxEl.textContent = netData.rx;
        if (txEl) txEl.textContent = netData.tx;

        charts.network.data.datasets[0].data.shift();
        charts.network.data.datasets[0].data.push(parseFloat(netData.rx));
        charts.network.data.datasets[1].data.shift();
        charts.network.data.datasets[1].data.push(parseFloat(netData.tx));
        charts.network.update('none');

        // Smart alerts when resources exceed thresholds
        const alerts = [];
        if (data.cpu >= 85) alerts.push(`🔴 المعالج عند ${Math.round(data.cpu)}% — مرتفع بشكل كبير`);
        if (data.memory >= 90) alerts.push(`🟠 الذاكرة عند ${Math.round(data.memory)}% — أوشكت على الامتلاء`);
        if (data.disk >= 90) alerts.push(`🟠 القرص ممتلئ (${Math.round(data.disk)}%) — حرر مساحة`);
        const alertEl = document.getElementById('smartAlert');
        if (alertEl) {
            if (alerts.length) {
                alertEl.innerHTML = alerts.map(a => `<div>${a}</div>`).join('');
                alertEl.classList.remove('hidden');
            } else {
                alertEl.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function updateChart(chart, val, valId) {
    const el = document.getElementById(valId);
    if (el) {
        // Animate the numeric value smoothly from previous to new
        const from = parseFloat(el.dataset.prev || '0') || 0;
        const to = Math.round(val);
        animateNumber(el, from, to, 500);
        el.dataset.prev = to;
    }
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(val);
    chart.update('none');
}

// Smooth number counter animation
function animateNumber(el, from, to, duration) {
    const start = performance.now();
    const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        el.textContent = Math.round(from + (to - from) * eased) + '%';
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ==========================================
// 3. Software Management (Named Apps & Search)
// ==========================================
async function loadSoftware() {
    const listEl = document.getElementById('softwareList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading" style="grid-column: 1 / -1;">جاري فحص وتصنيف كافة البرامج المثبتة...</div>';

    try {
        const res = await fetch(`${API_BASE}/software`);
        allApps = await res.json();
        renderSoftwareList();
    } catch (e) {
        listEl.innerHTML = '<div class="loading" style="grid-column: 1 / -1; color: var(--danger);">فشل جلب قائمة البرمجيات</div>';
    }
}

function renderSoftwareList() {
    const listEl = document.getElementById('softwareList');
    const badgeEl = document.getElementById('softwareCountBadge');
    const searchVal = (document.getElementById('softwareSearchInput')?.value || '').toLowerCase().trim();

    if (!listEl) return;

    let filtered = allApps.filter(app => {
        const matchesCategory = (activeCategory === 'all' || app.category === activeCategory);
        const matchesSearch = !searchVal || 
            app.name.toLowerCase().includes(searchVal) || 
            (app.englishName && app.englishName.toLowerCase().includes(searchVal)) ||
            (app.comment && app.comment.toLowerCase().includes(searchVal));
        return matchesCategory && matchesSearch;
    });

    if (badgeEl) {
        badgeEl.textContent = `${filtered.length} برنامج متوفر`;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-dim);">لم يتم العثور على برامج تطابق خيارات البحث والتصنيف.</div>';
        return;
    }

    const getAppIcon = (name, cat) => {
        const n = (name || '').toLowerCase();
        if (n.includes('chrome') || n.includes('google')) return '🌐';
        if (n.includes('firefox')) return '🦊';
        if (n.includes('vlc') || n.includes('media') || n.includes('video')) return '🎬';
        if (n.includes('music') || n.includes('audio') || n.includes('sound') || n.includes('spotify')) return '🎵';
        if (n.includes('code') || n.includes('studio') || n.includes('develop') || n.includes('git')) return '💻';
        if (n.includes('gimp') || n.includes('draw') || n.includes('inkscape') || n.includes('photo') || n.includes('image')) return '🎨';
        if (n.includes('telegram') || n.includes('discord') || n.includes('chat') || n.includes('signal') || n.includes('slack')) return '💬';
        if (n.includes('terminal') || n.includes('bash') || n.includes('konsol')) return '⌨️';
        if (n.includes('steam') || n.includes('game') || n.includes('play')) return '🎮';
        if (n.includes('calc')) return '🔢';
        if (n.includes('writer') || n.includes('office') || n.includes('doc') || n.includes('pdf')) return '📄';
        if (n.includes('setting') || n.includes('control') || n.includes('config')) return '⚙️';
        if (cat === 'إنترنت وتواصل') return '🌐';
        if (cat === 'وسائط ومونتاج') return '🎬';
        if (cat === 'برمجة وتطوير') return '💻';
        if (cat === 'ألعاب') return '🎮';
        if (cat === 'أدوات ومكتب') return '📄';
        if (cat === 'أدوات النظام') return '⚙️';
        return '📦';
    };

    listEl.innerHTML = filtered.map(app => {
        const typeBadgeColor = app.type === 'snap' ? '#ff0055' : (app.type === 'flatpak' ? '#00c7ff' : '#10b981');
        const typeLabel = app.type === 'snap' ? 'Snap' : (app.type === 'flatpak' ? 'Flatpak' : 'حزمة أساسية (APT)');
        const iconChar = getAppIcon(app.englishName || app.name, app.category);
        const safeName = esc(app.name);
        const safeEn = esc(app.englishName);
        const safeComment = esc(app.comment);
        const safeCategory = esc(app.category);
        
        return `
            <div class="soft-card">
                <div class="soft-card-top">
                    <div class="soft-avatar">
                        <span class="icon">${iconChar}</span>
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${safeName}">
                            ${safeName}
                        </h4>
                        ${app.englishName && app.englishName !== app.name ? `<small style="color: var(--text-dim); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeEn}</small>` : ''}
                        <div style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;">
                            <span class="soft-tag" style="background: ${typeBadgeColor}22; color: ${typeBadgeColor}; border: 1px solid ${typeBadgeColor}55;">${typeLabel}</span>
                            <span class="soft-tag">${safeCategory}</span>
                        </div>
                    </div>
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem; margin: 0.8rem 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${safeComment}">
                    ${safeComment}
                </p>
                <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                    <button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem; background: rgba(0, 242, 255, 0.1); border-color: rgba(0, 242, 255, 0.3); color: var(--primary);" onclick="launchAppByName('${encodeURIComponent(JSON.stringify(app))}')">
                        🚀 تشغيل
                    </button>
                    <button class="btn-delete" style="padding: 6px 14px; font-size: 0.85rem;" onclick="uninstallAppByName('${encodeURIComponent(JSON.stringify(app))}')">
                        🗑️ إلغاء التثبيت
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Launch app directly
window.launchAppByName = async (appJsonEncoded) => {
    const app = JSON.parse(decodeURIComponent(appJsonEncoded));
    try {
        const res = await fetch(`${API_BASE}/software/launch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                execCmd: app.exec,
                desktopFile: app.desktopFile
            })
        });
        const result = await res.json();
        alert(result.message || "تم إطلاق البرنامج بنجاح!");
    } catch (e) {
        alert("فشل تشغيل البرنامج");
    }
};

// Category filter button listeners
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-cat');
        renderSoftwareList();
    });
});

// Search input listener
document.getElementById('softwareSearchInput')?.addEventListener('input', () => {
    renderSoftwareList();
});

window.uninstallAppByName = async (appJsonEncoded) => {
    const app = JSON.parse(decodeURIComponent(appJsonEncoded));
    const confirmMsg = `هل أنت متأكد من رغبتك في حذف برنامج "${app.name}" بشكل نهائي من النظام؟`;
    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${API_BASE}/software/uninstall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: app.name,
                pkgName: app.pkgName,
                type: app.type,
                desktopFile: app.desktopFile
            })
        });
        const result = await res.json();
        alert(result.message || result.error);
        loadSoftware();
    } catch (e) {
        alert('حدث خطأ أثناء محاولة إزالة البرنامج');
    }
};

// ==========================================
// 4. Startup Applications
// ==========================================
async function loadStartupApps() {
    const listEl = document.getElementById('startupList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري فحص قائمة برامج بدء التشغيل...</div>';

    try {
        const res = await fetch(`${API_BASE}/startup`);
        const apps = await res.json();
        if (apps.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">لا توجد برامج مضافة لبدء التشغيل التلقائي حالياً.</div>';
            return;
        }
        listEl.innerHTML = apps.map(app => `
            <div class="soft-item">
                <div class="soft-info">
                    <span class="soft-tag" style="background: #10b98122; color: #10b981;">تشغيل تلقائي</span>
                    <h4>${esc(app.name)}</h4>
                    <p style="color: #94a3b8; font-size: 0.85rem; direction: ltr; text-align: right;">${esc(app.exec)}</p>
                </div>
                <button class="btn-delete" onclick="deleteStartupApp('${encodeURIComponent(app.file)}', '${encodeURIComponent(app.name)}')">تعطيل وإزالة</button>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل جلب قائمة الإقلاع التلقائي';
    }
}

window.deleteStartupApp = async (file, name) => {
    file = decodeURIComponent(file);
    name = decodeURIComponent(name);
    if (!confirm(`هل تريد إزالة "${name}" من قائمة بدء التشغيل التلقائي؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/startup/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file })
        });
        const result = await res.json();
        alert(result.message);
        loadStartupApps();
    } catch (e) {
        alert('فشل تعطيل البرنامج');
    }
};

// ==========================================
// 5. Storage & Large Files Finder
// ==========================================
window.loadLargeFiles = async () => {
    const listEl = document.getElementById('largeFilesList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري فحص المجلد الشخصي لاكتشاف الملفات الأكبر من 100 ميجابايت...</div>';

    try {
        const res = await fetch(`${API_BASE}/storage/large-files`);
        const files = await res.json();
        if (files.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--success);">🎉 رائع! لم يتم العثور على ملفات ضخمة مهملة تزيد عن 100MB.</div>';
            return;
        }
        listEl.innerHTML = files.map(file => `
            <div class="soft-item">
                <div class="soft-info" style="overflow: hidden;">
                    <span class="soft-tag" style="background: #ff005522; color: #ff0055; font-weight: bold;">${esc(file.size)}</span>
                    <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(file.name)}</h4>
                    <p style="color: #94a3b8; font-size: 0.8rem; direction: ltr; text-align: right;" title="${esc(file.path)}">${esc(file.path)}</p>
                </div>
                <button class="btn-delete" onclick="deleteLargeFile('${encodeURIComponent(file.path)}', '${encodeURIComponent(file.name)}')">حذف الملف</button>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل فحص الملفات الكبيرة';
    }
};

window.deleteLargeFile = async (encodedPath, name) => {
    const filePath = decodeURIComponent(encodedPath);
    name = decodeURIComponent(name);
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الملف "${name}" نهائياً لتحرير المساحة؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/storage/delete-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        const result = await res.json();
        alert(result.message);
        loadLargeFiles();
    } catch (e) {
        alert('فشل حذف الملف');
    }
};

// ==========================================
// 6. Services Management
// ==========================================
async function loadServices() {
    const listEl = document.getElementById('servicesList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري فحص الخدمات النشطة...</div>';
    try {
        const res = await fetch(`${API_BASE}/services`);
        const services = await res.json();
        listEl.innerHTML = services.map(svc => `
            <div class="soft-item">
                <div class="soft-info">
                    <span class="soft-tag" style="background: ${svc.status === 'running' || svc.status === 'active' ? '#10b981' : '#f59e0b'}; color: white;">${esc(svc.status)}</span>
                    <h4>${esc(svc.name)}</h4>
                    <p style="color:#94a3b8; font-size: 0.85rem;">${esc(svc.description)}</p>
                </div>
                <div style="display: flex; gap: 5px;">
                    ${svc.status !== 'running' && svc.status !== 'active' ? `<button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="serviceAction('${encodeURIComponent(svc.name)}', 'start')">تشغيل</button>` : ''}
                    ${svc.status === 'running' || svc.status === 'active' ? `<button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #f59e0b;" onclick="serviceAction('${encodeURIComponent(svc.name)}', 'restart')">إعادة</button>` : ''}
                    <button class="btn-delete" style="padding: 5px 10px; font-size: 0.8rem;" onclick="serviceAction('${encodeURIComponent(svc.name)}', 'stop')">إيقاف</button>
                </div>
            </div>
        `).join('');
    } catch (e) { listEl.innerHTML = 'خطأ في الاتصال بالخدمات'; }
}

window.serviceAction = async (name, action) => {
    name = decodeURIComponent(name);
    if (action === 'stop' && !confirm(`إيقاف الخدمة ${name} قد يؤثر على النظام. هل أنت متأكد؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/services/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, action })
        });
        const result = await res.json();
        alert(result.message);
        loadServices();
    } catch (e) {
        alert("فشل تنفيذ الإجراء");
    }
};

// ==========================================
// 7. Installer & App Store & Wine
// ==========================================
window.checkWineStatus = async () => {
    const textEl = document.getElementById('wineStatusText');
    const btnEl = document.getElementById('btnInstallWine');
    if (!textEl) return;

    try {
        const res = await fetch(`${API_BASE}/wine/status`);
        const data = await res.json();
        if (data.installed) {
            textEl.innerHTML = `🟢 بيئة Wine نشطة وجاهزة! الإصدار الحالي: <strong style="color:var(--success);">${esc(data.version)}</strong>. يمكنك الآن تثبيت ملفات .exe و .msi بكل أريحية.`;
            if (btnEl) btnEl.style.display = 'none';
        } else {
            textEl.innerHTML = `🔴 بيئة تشغيل برامج ويندوز (Wine) غير مفعلة في نظامك حالياً. يمكنك تفعيلها بضغطة زر واحدة لتثبيت برامج الويندوز.`;
            if (btnEl) {
                btnEl.style.display = 'block';
                btnEl.textContent = 'تفعيل بيئة تشغيل الويندوز 🚀';
                btnEl.disabled = false;
            }
        }
    } catch (e) {
        textEl.textContent = 'فشل الاتصال بالخادم للتحقق من حالة Wine';
    }
};

window.installWine = async () => {
    const btnEl = document.getElementById('btnInstallWine');
    const textEl = document.getElementById('wineStatusText');
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = 'جاري التفعيل والتثبيت...';
    }
    if (textEl) {
        textEl.innerHTML = '🔄 جاري تحميل وتثبيت بيئة Wine وتحديث معماريات النظام في الخلفية... يرجى الانتظار دقيقتين.';
    }

    try {
        const res = await fetch(`${API_BASE}/wine/install`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            await checkWineStatus();
            const textEl = document.getElementById('wineStatusText');
            if (textEl && textEl.textContent.includes('🟢') || attempts >= 12) {
                clearInterval(interval);
            }
        }, 10000);
    } catch (e) {
        alert('فشل إرسال طلب تثبيت Wine');
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = 'تفعيل بيئة تشغيل الويندوز 🚀';
        }
    }
};

window.installStoreApp = async (appKey) => {
    const btn = document.getElementById(`btn-store-${appKey}`);
    const originalText = btn ? btn.textContent : 'تثبيت';
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري التنزيل والتثبيت...';
        btn.style.filter = 'grayscale(0.7)';
    }

    try {
        const res = await fetch(`${API_BASE}/store/install-popular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appKey })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) {
        alert('فشل بدء عملية التثبيت للمتجر');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.style.filter = 'none';
        }
    }
};

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleInstall(e.dataTransfer.files[0]);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleInstall(fileInput.files[0]);
    });
}

async function handleInstall(file) {
    const progress = document.getElementById('installProgress');
    if (progress) progress.classList.remove('hidden');
    
    const formData = new FormData();
    formData.append('package', file);
    try {
        const res = await fetch(`${API_BASE}/install`, { method: 'POST', body: formData });
        const result = await res.json();
        alert(result.message);
    } catch (e) { 
        alert('فشل تثبيت الحزمة المرفوعة'); 
    } finally { 
        if (progress) progress.classList.add('hidden'); 
    }
}

// ==========================================
// 8. Cleaner, Optimizer & RAM Flush
// ==========================================
window.dropRamCache = async () => {
    try {
        const res = await fetch(`${API_BASE}/clean/ram`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        updateStats();
    } catch (e) {
        alert('فشل تفريغ الذاكرة');
    }
};

window.fixBrokenPackages = async () => {
    try {
        const res = await fetch(`${API_BASE}/system/fix-broken`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
    } catch (e) {
        alert('فشل تشغيل أداة الإصلاح');
    }
};

document.getElementById('fullBoostBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('fullBoostBtn');
    btn.disabled = true;
    btn.textContent = 'جاري التنظيف الشامل وتفريغ الرام...';
    try {
        await fetch(`${API_BASE}/clean/ram`, { method: 'POST' });
        const res = await fetch(`${API_BASE}/clean/advanced`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        updateStats();
    } catch (e) { alert('فشل التنظيف'); }
    finally { btn.disabled = false; btn.textContent = 'إطلاق التنظيف الشامل 🚀'; }
});

document.getElementById('quickCleanBtn')?.addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_BASE}/clean`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('فشل التنظيف'); }
});

document.getElementById('deepCleanBtnAlt')?.addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_BASE}/clean/advanced`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('فشل التنظيف'); }
});

// ==========================================
// 9. Network & DNS Switcher
// ==========================================
window.changeDnsPreset = async (preset) => {
    const networkResult = document.getElementById('networkResult');
    if (networkResult) {
        networkResult.style.display = 'block';
        networkResult.textContent = `جاري تطبيق خوادم DNS (${preset})...`;
    }

    try {
        const res = await fetch(`${API_BASE}/network/changedns-preset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preset })
        });
        const result = await res.json();
        if (networkResult) networkResult.textContent = result.message || 'تم تحديث خوادم DNS بنجاح.';
        alert(result.message);
        loadPingTest();
    } catch (e) {
        if (networkResult) networkResult.textContent = 'فشل تغيير DNS.';
    }
};

window.loadPingTest = async () => {
    const cfEl = document.getElementById('pingCf');
    const ggEl = document.getElementById('pingGg');
    if (cfEl) cfEl.textContent = '...';
    if (ggEl) ggEl.textContent = '...';

    try {
        const res = await fetch(`${API_BASE}/network/ping-test`);
        const data = await res.json();
        if (cfEl) cfEl.textContent = data.cloudflare;
        if (ggEl) ggEl.textContent = data.google;
    } catch (e) {}
};

const speedtestBtn = document.getElementById('speedtestBtn');
if (speedtestBtn) {
    speedtestBtn.addEventListener('click', async () => {
        speedtestBtn.textContent = 'جاري القياس...';
        speedtestBtn.disabled = true;
        const networkResult = document.getElementById('networkResult');
        networkResult.style.display = 'block';
        networkResult.textContent = 'جاري الاتصال بخوادم SpeedTest... يرجى الانتظار بضع ثوانٍ';
        try {
            const res = await fetch(`${API_BASE}/network/speedtest`, { method: 'POST' });
            const result = await res.json();
            networkResult.textContent = result.output || result.error;
        } catch (e) { networkResult.textContent = 'فشل الاتصال بالخادم'; }
        finally { speedtestBtn.textContent = '⚡ بدء فحص السرعة'; speedtestBtn.disabled = false; }
    });
}

// ==========================================
// 10. AI Doctor Diagnostics
// ==========================================
window.runDoctorDiagnosis = async () => {
    const container = document.getElementById('doctorResultsContainer');
    const scoreEl = document.getElementById('doctorHealthScore');
    const summaryEl = document.getElementById('doctorStatusSummary');

    if (container) container.innerHTML = '<div class="loading">جاري فحص السجلات وتحليل المشاكل...</div>';

    try {
        const res = await fetch(`${API_BASE}/doctor/diagnose`);
        const data = await res.json();

        if (scoreEl) scoreEl.textContent = data.score;
        if (summaryEl) {
            summaryEl.textContent = data.status === 'healthy' ? 'جميع وظائف النظام تعمل بأمان واستقرار تام.' : 'تم رصد بعض التنبيهات البسيطة في سجلات النظام.';
            summaryEl.style.color = data.status === 'healthy' ? 'var(--success)' : '#f59e0b';
        }

        if (container) {
            container.innerHTML = data.items.map(item => `
                <div class="soft-item" style="border-right: 4px solid ${item.status === 'ok' ? 'var(--success)' : '#f59e0b'};">
                    <div>
                        <h4 style="color: ${item.status === 'ok' ? 'white' : '#f59e0b'};">${esc(item.title)}</h4>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 4px;">${esc(item.detail)}</p>
                    </div>
                    <span class="soft-tag" style="background: ${item.status === 'ok' ? '#10b98122' : '#f59e0b22'}; color: ${item.status === 'ok' ? '#10b981' : '#f59e0b'};">
                        ${item.status === 'ok' ? 'سليم ✅' : 'يحتاج فحص ⚠️'}
                    </span>
                </div>
            `).join('');
        }
    } catch (e) {
        if (container) container.innerHTML = 'فشل إجراء التشخيص';
    }
};

window.loadLogs = async () => {
    try {
        const res = await fetch(`${API_BASE}/system/logs`);
        const data = await res.json();
        const el = document.getElementById('logTerminal');
        if (el) el.textContent = data.logs;
    } catch (e) {}
};

// ==========================================
// 11. Hardware, Ports, Processes & Tweaks
// ==========================================
window.loadHardware = async () => {
    try {
        const res = await fetch(`${API_BASE}/hardware`);
        const data = await res.json();
        const cpuEl = document.getElementById('hwCpu');
        const gpuEl = document.getElementById('hwGpu');
        const diskEl = document.getElementById('hwDisk');

        if (cpuEl) cpuEl.textContent = `${data.cpu} (${data.cores})`;
        if (gpuEl) gpuEl.textContent = data.gpu;
        if (diskEl) diskEl.textContent = data.disks.join(' | ');

        // Battery info
        const batRes = await fetch(`${API_BASE}/hardware/battery`);
        const batData = await batRes.json();
        const batEl = document.getElementById('hwBattery');
        if (batEl) {
            batEl.textContent = `${batData.capacity}% (${batData.status})`;
        }

        // USB devices
        const devRes = await fetch(`${API_BASE}/hardware/devices`);
        const devData = await devRes.json();
        const devEl = document.getElementById('hwUsbDevices');
        if (devEl) {
            devEl.textContent = `${devData.length} أجهزة متصلة`;
            devEl.title = devData.map(d => d.name).join('\n');
        }
    } catch (e) {}
};

window.loadSensors = async () => {
    try {
        const res = await fetch(`${API_BASE}/hardware/sensors`);
        const data = await res.json();
        const tempEl = document.getElementById('hwTemp');
        const fanEl = document.getElementById('hwFan');
        if (tempEl) tempEl.textContent = data.temp;
        if (fanEl) fanEl.textContent = data.fan;
    } catch (e) {}
};

window.applyMode = async (mode) => {
    try {
        const res = await fetch(`${API_BASE}/modes/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('فشل تفعيل الوضع'); }
};

window.stopAllServers = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في إيقاف جميع السيرفرات النشطة و Ollama؟")) return;
    try {
        const res = await fetch(`${API_BASE}/servers/stop-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) {
        alert('فشل إصدار أمر الإيقاف');
    }
};

window.loadProcesses = async () => {
    const list = document.getElementById('processList');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE}/processes`);
        const raw = await res.json();
        // Sort by CPU usage descending (most consuming first)
        const processes = [...raw].sort((a, b) => (parseFloat(b.cpu) || 0) - (parseFloat(a.cpu) || 0));
        list.innerHTML = processes.map(p => `
            <div class="soft-item">
                <div style="text-align: right; flex: 1;">
                    <div style="font-weight: 700; color: white;">${esc(p.name)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">PID: ${esc(p.pid)} | CPU: ${esc(p.cpu)}% | MEM: ${esc(p.mem)}% | المستخدم: ${esc(p.user)}</div>
                    <div style="height: 5px; background: rgba(255,255,255,0.08); border-radius: 4px; margin-top: 5px; max-width: 300px;">
                        <div style="width: ${Math.min(parseFloat(p.cpu) || 0, 100)}%; height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple)); border-radius: 4px;"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <select onchange="setPriority('${encodeURIComponent(p.pid)}', this.value)" style="background: var(--panel); color: white; border: 1px solid var(--glass-border); padding: 4px; font-size: 0.8rem; border-radius: 6px;">
                        <option value="0">أولوية عادية</option>
                        <option value="-10">أولوية مرتفعة</option>
                        <option value="19">أولوية منخفضة</option>
                    </select>
                    <button class="btn-delete" onclick="killProcess('${encodeURIComponent(p.pid)}')">إنهاء</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p>فشل جلب العمليات</p>';
    }
};

window.killProcess = async (pid) => {
    pid = decodeURIComponent(pid);
    if (!confirm(`هل أنت متأكد من إنهاء العملية ${pid}؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/processes/kill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid })
        });
        const result = await res.json();
        alert(result.message);
        loadProcesses();
    } catch (e) { alert('فشل إنهاء العملية'); }
};

window.setPriority = async (pid, level) => {
    pid = decodeURIComponent(pid);
    try {
        const res = await fetch(`${API_BASE}/processes/priority`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid, level })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) {}
};

window.loadPorts = async () => {
    const list = document.getElementById('portList');
    if (!list) return;
    list.innerHTML = '<div class="loading">جاري فحص المنافذ...</div>';
    try {
        const res = await fetch(`${API_BASE}/network/scan`);
        const ports = await res.json();
        list.innerHTML = `
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
                <tr style="color: var(--primary); border-bottom: 1px solid var(--glass-border);">
                    <th style="padding: 10px;">البروتوكول</th>
                    <th>العنوان المحلي / المنفذ</th>
                    <th>العملية (Process)</th>
                </tr>
                ${ports.map(p => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 10px;">${esc(p.proto)}</td>
                        <td style="direction: ltr; text-align: right;">${esc(p.local)}</td>
                        <td style="color: var(--neon-blue);">${esc(p.process)}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    } catch (e) {}
};

window.loadKernelModules = async () => {
    const list = document.getElementById('kernelList');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE}/system/kernel`);
        const modules = await res.json();
        list.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
                ${modules.map(m => `
                    <div class="soft-item" style="flex-direction: column; align-items: flex-start;">
                        <div style="font-weight: 700; color: var(--neon-green);">${esc(m.name)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">الحجم: ${esc(m.size)} | مستخدم من: ${esc(m.usedBy)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {}
};

// Security UFW
window.updateUfwStatus = async () => {
    try {
        const res = await fetch(`${API_BASE}/security/status`);
        const data = await res.json();
        const el = document.getElementById('ufwStatus');
        if (el) {
            el.textContent = data.active ? 'نشط ومفعل (Active 🛡️)' : 'غير نشط (Inactive ⚠️)';
            el.style.color = data.active ? 'var(--success)' : 'var(--danger)';
        }
    } catch (e) {}
};

document.getElementById('ufwToggle')?.addEventListener('click', async () => {
    const resStatus = await fetch(`${API_BASE}/security/status`);
    const status = await resStatus.json();
    const res = await fetch(`${API_BASE}/security/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !status.active })
    });
    const result = await res.json();
    alert(result.message);
    updateUfwStatus();
});

window.loadUfwRules = async () => {
    const list = document.getElementById('ufwRules');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE}/security/rules`);
        const rules = await res.json();
        if (rules.length === 0) {
            list.innerHTML = '<p style="color: var(--text-dim); text-align: center;">لا توجد قواعد مخصصة مضافة حالياً.</p>';
            return;
        }
        list.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: right;">
                <tr style="border-bottom: 1px solid var(--glass-border); color: var(--primary);">
                    <th style="padding: 10px;">#</th>
                    <th>المنفذ / الخدمة</th>
                    <th>الإجراء</th>
                    <th>المصدر</th>
                    <th>إدارة</th>
                </tr>
                ${rules.map(r => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 10px;">${esc(r.id)}</td>
                        <td>${esc(r.to)}</td>
                        <td style="color: ${r.action.includes('ALLOW') ? 'var(--success)' : 'var(--danger)'}">${esc(r.action)}</td>
                        <td>${esc(r.from)}</td>
                        <td><button class="btn-delete" style="padding: 2px 10px; font-size: 0.8rem;" onclick="deleteUfwRule('${esc(r.id)}')">حذف</button></td>
                    </tr>
                `).join('')}
            </table>
        `;
    } catch (e) {}
};

window.deleteUfwRule = async (id) => {
    if (!confirm(`هل تريد حذف القاعدة رقم ${id}؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/security/deleteRule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        alert(result.message);
        loadUfwRules();
    } catch (e) {}
};

// Tweaks & Themes
window.applyTheme = async (type) => {
    let themeName = type === 'mac' ? 'macOS' : (type === 'win' ? 'Windows 11' : 'الافتراضي');
    if (!confirm(`هل تريد حقاً تطبيق ثيم ${themeName}؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/themes/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('حدث خطأ أثناء تطبيق الثيم'); }
};

window.applySmartTheme = async (themeName, iconName) => {
    if (!confirm(`هل تريد تطبيق ثيم ${themeName} وأيقونات ${iconName}؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/themes/applySmart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ themeName, iconName })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('حدث خطأ أثناء تطبيق الثيم الذكي'); }
};

window.applyDock = async (style) => {
    try {
        const res = await fetch(`${API_BASE}/themes/dock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ style })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('حدث خطأ أثناء إعداد شريط المهام'); }
};

window.toggleTweak = async (key, value) => {
    try {
        const res = await fetch(`${API_BASE}/tweaks/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        const result = await res.json();
        if (result.success) alert(result.message);
    } catch (e) { alert('فشل تغيير الإعداد'); }
};

window.applyWallpaper = async (url) => {
    try {
        const res = await fetch(`${API_BASE}/wallpapers/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('فشل تطبيق الخلفية'); }
};

window.runBackup = async () => {
    try {
        const res = await fetch(`${API_BASE}/system/backup`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
    } catch (e) { alert('فشل النسخ الاحتياطي'); }
};

// ==========================================
// 11b. Disk Analyzer
// ==========================================
window.loadDiskAnalyzer = async () => {
    const listEl = document.getElementById('diskAnalyzerList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري تحليل المجلدات وحساب الأحجام...</div>';
    try {
        const res = await fetch(`${API_BASE}/storage/analyze`);
        const data = await res.json();
        if (!data.length) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">تعذر تحليل المجلدات.</div>';
            return;
        }
        const maxKB = Math.max(...data.map(d => d.sizeKB), 1);
        listEl.innerHTML = data.map(d => `
            <div class="soft-item" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <div style="font-weight: 700; color: white; direction: ltr; text-align: right;">${esc(d.dir)}</div>
                    <div style="color: var(--neon-blue); font-weight: 700;">${esc(d.size)}</div>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; margin-top: 6px;">
                    <div style="width: ${(d.sizeKB / maxKB * 100).toFixed(1)}%; height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple)); border-radius: 4px;"></div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل تحليل القرص';
    }
};

// ==========================================
// 11c. Available Updates
// ==========================================
window.loadSystemUpdates = async () => {
    const listEl = document.getElementById('updatesList');
    const summaryEl = document.getElementById('updatesSummary');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري فحص الحزم القابلة للترقية...</div>';
    try {
        const res = await fetch(`${API_BASE}/system/updates`);
        const data = await res.json();
        if (summaryEl) {
            summaryEl.innerHTML = `<div class="badge"><span class="icon">🔄</span> الحزم المتوفرة: <span style="color: var(--primary);">${data.count}</span></div>`;
        }
        if (!data.count) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--success);">🎉 نظامك محدّث بالكامل — لا توجد حزم قابلة للترقية.</div>';
            return;
        }
        listEl.innerHTML = data.updates.map(u => `
            <div class="soft-item">
                <div style="text-align: right; flex: 1;">
                    <div style="font-weight: 700; color: white;">${esc(u.name)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">${u.from ? esc(u.from) + ' ← ' : ''}${esc(u.to)}</div>
                </div>
                <span class="soft-tag">ترقية</span>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل فحص التحديثات';
    }
};

// ==========================================
// 11d. Power Controls
// ==========================================
window.powerAction = async (action) => {
    const labels = { lock: 'قفل الشاشة', suspend: 'إسبات النظام', reboot: 'إعادة التشغيل', poweroff: 'إيقاف التشغيل', logout: 'تسجيل الخروج' };
    if (['reboot', 'poweroff'].includes(action) && !confirm(`هل أنت متأكد من ${labels[action]}؟`)) return;
    try {
        const res = await fetch(`${API_BASE}/power/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        const result = await res.json();
        alert(result.message || 'تم تنفيذ الأمر.');
    } catch (e) { alert('فشل تنفيذ أمر الطاقة'); }
};

// ==========================================
// 11e. Network Info
// ==========================================
window.loadNetworkInfo = async () => {
    try {
        const res = await fetch(`${API_BASE}/network/info`);
        const data = await res.json();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('netWifi', data.wifi);
        set('netIp', data.ip);
        set('netGateway', data.gateway);
        set('netDns', data.dns);
    } catch (e) { alert('فشل جلب معلومات الشبكة'); }
};

// ==========================================
// 11f. System Info
// ==========================================
window.loadSystemInfo = async () => {
    const listEl = document.getElementById('systemInfoList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري تجميع معلومات النظام...</div>';
    try {
        const res = await fetch(`${API_BASE}/system/info`);
        const d = await res.json();
        const up = d.uptime;
        const days = Math.floor(up / 86400);
        const hours = Math.floor((up % 86400) / 3600);
        const mins = Math.floor((up % 3600) / 60);
        const uptimeStr = days > 0 ? `${days} يوم ${hours} ساعة ${mins} دقيقة` : `${hours} ساعة ${mins} دقيقة`;
        const rows = [
            ['💻 اسم الجهاز (Hostname)', d.hostname],
            ['🐧 نظام التشغيل', d.os],
            ['🧬 النواة (Kernel)', d.kernel],
            ['🔧 المعمارية (Architecture)', d.arch],
            ['👤 المستخدم الحالي', d.user],
            ['⚙️ بيئة سطح المكتب', d.desktop],
            ['🖥️ نوع الجلسة', d.session],
            ['🐚 شل الأوامر (Shell)', d.shell],
            ['🧠 المعالج (CPU)', d.cpu],
            ['⚡ عدد الأنوية (Cores)', d.cores],
            ['💾 الذاكرة الإجمالية', d.ramTotal],
            ['📊 الذاكرة المستخدمة', d.ramUsed],
            ['⏱️ وقت التشغيل (Uptime)', uptimeStr]
        ];
        listEl.innerHTML = rows.map(([label, value]) => `
            <div class="soft-item">
                <div style="text-align: right; flex: 1;">
                    <div style="font-weight: 700; color: white;">${label}</div>
                    <div style="font-size: 0.85rem; color: var(--neon-blue); margin-top: 3px; direction: ltr; text-align: right;">${esc(value)}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل تحميل معلومات النظام';
    }
};

// ==========================================
// 11g. Light/Dark Theme Toggle
// ==========================================
window.toggleTheme = () => {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = next === 'light' ? '☀️' : '🌙';
    try { localStorage.setItem('sm-theme', next); } catch (e) {}
};

// ==========================================
// 11h. Disk Partitions
// ==========================================
window.loadPartitions = async () => {
    const listEl = document.getElementById('partitionsList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري قراءة الأقسام المثبتة...</div>';
    try {
        const res = await fetch(`${API_BASE}/storage/partitions`);
        const data = await res.json();
        if (!data.length) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">لا توجد أقسام لعرضها.</div>';
            return;
        }
        listEl.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="color: var(--neon-blue); text-align: right; border-bottom: 1px solid rgba(255,255,255,0.15);">
                        <th style="padding: 10px;">الجهاز</th>
                        <th>السعة</th>
                        <th>المستخدم</th>
                        <th>المتاح</th>
                        <th style="width: 25%;">الاستخدام</th>
                        <th>نقطة التركيب</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(p => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 10px; direction: ltr; text-align: right;">${esc(p.fs)}</td>
                            <td>${esc(p.size)}</td>
                            <td>${esc(p.used)}</td>
                            <td>${esc(p.avail)}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px;">
                                        <div style="width: ${Math.min(p.usePercent, 100)}%; height: 100%; background: ${p.usePercent >= 90 ? 'var(--danger)' : p.usePercent >= 70 ? '#f59e0b' : 'var(--success)'}; border-radius: 4px;"></div>
                                    </div>
                                    <span style="color: var(--text-dim); font-size: 0.8rem;">${p.usePercent}%</span>
                                </div>
                            </td>
                            <td style="color: var(--neon-green);">${esc(p.mount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        listEl.innerHTML = 'فشل تحميل الأقسام';
    }
};

// ==========================================
// 11i. Export system snapshot as JSON
// ==========================================
window.exportJsonReport = async () => {
    try {
        const [statsRes, infoRes] = await Promise.all([
            fetch(`${API_BASE}/stats`),
            fetch(`${API_BASE}/system/info`)
        ]);
        const stats = await statsRes.json();
        const info = await infoRes.json();
        const report = {
            exported_at: new Date().toISOString(),
            app: 'System Master Ultra',
            version: '2.0',
            stats,
            system: info
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_master_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('تم تصدير التقرير بنجاح.');
    } catch (e) { alert('فشل تصدير التقرير'); }
};

// ==========================================
// 11j. Windows (Wine) Programs — list & delete
// ==========================================
window.loadWinePrograms = async () => {
    const listEl = document.getElementById('wineProgramsList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading">جاري فحص برامج ويندوز في بيئة Wine...</div>';
    try {
        const res = await fetch(`${API_BASE}/wine/programs`);
        const data = await res.json();
        if (!data.installed) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">🔴 بيئة Wine غير مثبتة — فعّلها أولاً من الأعلى.</div>';
            return;
        }
        if (!data.programs.length) {
            listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">لا توجد برامج ويندوز مثبتة حالياً.</div>';
            return;
        }
        listEl.innerHTML = data.programs.map(p => `
            <div class="soft-item" ${p.system ? 'style="opacity: 0.75;"' : ''}>
                <div style="text-align: right; flex: 1;">
                    <div style="font-weight: 700; color: white;">${esc(p.name)} ${p.system ? '<span class="soft-tag" style="background: rgba(255,165,0,0.15); color: #f59e0b;">مكوّن نظام</span>' : ''}</div>
                    <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 3px;">
                        ${p.version ? 'الإصدار: ' + esc(p.version) + ' | ' : ''}${p.uninstaller ? 'معالج إزالة رسمي متوفر ✅' : 'سيتم حذف ملفات البرنامج مباشرة'}
                    </div>
                </div>
                <button class="btn-delete" onclick="uninstallWineProgram('${encodeURIComponent(p.key)}', '${encodeURIComponent(p.name)}', ${p.uninstaller ? 'true' : 'false'})">🗑️ حذف</button>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = 'فشل فحص برامج ويندوز';
    }
};

window.uninstallWineProgram = async (key, name, hasUninstaller) => {
    key = decodeURIComponent(key);
    name = decodeURIComponent(name);
    const warn = hasUninstaller
        ? `سيتم تشغيل معالج الإزالة الرسمي لـ "${name}". متابعة؟`
        : `سيتم حذف برنامج "${name}" وملفاته نهائياً من بيئة Wine. متأكد؟`;
    if (!confirm(warn)) return;
    try {
        // Find the uninstaller string from the cached list
        let uninstaller = '';
        try {
            const res = await fetch(`${API_BASE}/wine/programs`);
            const data = await res.json();
            const match = data.programs.find(p => p.key === key && p.name === name);
            if (match) uninstaller = match.uninstaller || '';
        } catch (e) {}
        const res = await fetch(`${API_BASE}/wine/uninstall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, name, uninstaller })
        });
        const result = await res.json();
        alert(result.message || result.error || 'تم');
        loadWinePrograms();
    } catch (e) { alert('فشل حذف برنامج ويندوز'); }
};

// ==========================================
// 12. Init
// ==========================================
initCharts();
loadHardware();
loadSensors();
updateStats();
setInterval(updateStats, 2500);
setInterval(loadSensors, 5000);

// Restore saved theme preference
try {
    if (localStorage.getItem('sm-theme') === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.textContent = '☀️';
    }
} catch (e) {}



