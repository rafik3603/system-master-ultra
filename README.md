<div align="center">

# 💠 System Master Ultra v2.0

### مدير نظام لينكس متكامل — واجهة ويب عربية حديثة

[![Status](https://img.shields.io/badge/الحالة-نشط-brightgreen)](https://github.com/rafik3603/system-master-ultra)
[![Platform](https://img.shields.io/badge/المنصة-Linux-blue)](https://github.com/rafik3603/system-master-ultra)
[![License](https://img.shields.io/badge/الترخيص-MIT-orange)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js)](https://nodejs.org)

**مراقبة حية • إدارة برامج • محلل قرص • مركز أمان • تنبيهات ذكية • ثيمات**

</div>

---

## 📋 نظرة عامة

System Master Ultra هو مدير نظام تشغيل لينكس بواجهة ويب عربية بالكامل (RTL)، يقدم مراقبة شاملة للعتاد وإدارة كاملة للبرامج والخدمات والعمليات، مع مركز أمان جدار ناري وتحسينات أداء — كل ذلك من متصفحك.

![](https://img.shields.io/badge/⚠️-لقطات_الشاشة_قريباً-lightgrey)

---

## ✨ المميزات

### 📈 لوحة القيادة الحية
- مراقبة فورية للمعالج والذاكرة والقرص وسرعة الشبكة (تحديث كل 2.5 ثانية)
- رسوم بيانية متحركة بـ Chart.js
- **تنبيهات ذكية** تظهر تلقائياً عند تجاوز الحدود الحرجة (CPU ≥ 85%، RAM ≥ 90%، قرص ≥ 90%)

### 📦 إدارة البرامج
- فحص وتصنيف كافة البرامج المثبتة (APT/Snap/Flatpak) مع بحث وتصفية
- تثبيت وإزالة وتشغيل البرامج بضغطة واحدة
- متجر برامج شعبية (Chrome, VLC, Discord, VS Code, GIMP, Zoom...)
- تثبيت ملفات `.deb`, `.tar.gz`, `.AppImage` وحتى `.exe/.msi` عبر Wine

### 🗃️ التخزين والأقراص
- **محلل مساحة القرص**: أكبر 15 مجلداً استهلاكاً للمساحة (مع تخزين مؤقت ذكي)
- **جدول الأقراص والأقسام**: السعة والامتلاء بشريط تقدم ملون
- البحث عن الملفات الضخمة (>100MB) وحذفها

### ⚙️ إدارة النظام
- إدارة الخدمات (بدء/إيقاف/إعادة تشغيل/تفعيل)
- إدارة العمليات (إنهاء وتغيير الأولوية) مرتبة بالاستهلاك
- التحكم في برامج بدء التشغيل
- مستكشف وحدات النواة والمنافذ النشطة

### 🌐 الشبكة
- **معلومات الشبكة الحالية**: Wi-Fi (مع الإشارة)، IP، البوابة، DNS
- قياس سرعة الإنترنت واختبار Ping
- **تبديل DNS** بضغطة (Google, Cloudflare, AdGuard, Quad9)
- مراقبة حركة الشبكة حية

### 🛡️ مركز الأمان
- إدارة جدار UFW الناري مع عرض وحذف القواعد
- تنقية وحماية من XSS وحقن الأوامر
- يعمل على `127.0.0.1` فقط مع حماية CORS من المصادر الخارجية

### 🚀 التحسين والصيانة
- تنظيف شامل بنقرة (كاش، حزم مهملة، سجلات)
- تفريغ الذاكرة المؤقتة (RAM Boost)
- إصلاح الحزم المعطلة وأقفال APT
- أوضاع الطاقة (ألعاب / توفير طاقة / متوازن)
- التحديثات المتوفرة والتحديث الشامل

### 🎨 المظهر
- ثيمات سطح مكتب (macOS / Windows 11) وأيقونات وشريط مهام
- خلفيات 4K
- **تبديل ليلي/نهاري** للواجهة (محفوظ تلقائياً)
- تعديل خيارات GNOME (حركات، إضاءة ليلية)

### ⏻ أزرار الطاقة
- قفل الشاشة، إسبات، إعادة تشغيل، إيقاف تشغيل — عبر polkit بنافذة صلاحيات رسومية (بدون كلمات مرور مضمّنة)

### 🩺 طبيب النظام AI
- تشخيص تلقائي لسجلات النظام وكشف الأخطاء
- تقرير صحة مع تنبيهات
- تصدير تقرير نصي أو JSON

### 💻 معلومات النظام
- تفاصيل كاملة: المعالج، الذاكرة، النواة، بيئة سطح المكتب، الجلسة، الشل، وقت التشغيل
- حساسات الحرارة والمراوح وبطارية الجهاز

---

## 🚀 التشغيل

### المتطلبات
- توزيعة لينكس (اختُبر على Ubuntu)
- Node.js 18+
- متصفح حديث

### خطوات التشغيل

```bash
# 1. استنساخ المشروع
git clone https://github.com/rafik3603/system-master-ultra.git
cd system-master-ultra

# 2. تثبيت الاعتماديات
npm install

# 3. التشغيل (الخادم + الواجهة)
./start_app.sh
```

سيفتح التطبيق تلقائياً على: `http://localhost:5180`

> الخادم الخلفي يعمل على `http://localhost:3010`

### تشغيل يدوي (بديل)

```bash
# الخادم الخلفي
node server.cjs

# الواجهة الأمامية (في نافذة أخرى)
npm run dev -- --port 5180
```

### البناء للإنتاج

```bash
npm run build   # يولّد مجلد dist/
```

---

## 📁 بنية المشروع

```
system-master-ultra/
├── server.cjs          # الخادم الخلفي (Express) — كل نقاط API
├── main.js             # منطق الواجهة الأمامية
├── index.html          # الصفحة الرئيسية (24+ قسماً)
├── style.css           # التنسيقات (ثيم ليلي/نهاري)
├── start_app.sh        # مشغّل التطبيق
├── install_themes.sh   # مثبّت الثيمات
├── network_tools.sh    # أدوات الشبكة (speedtest/DNS)
├── fix_vlc.sh          # إصلاح VLC
├── SystemMaster.desktop # مختصر سطح المكتب
├── public/             # أيقونات
└── src/                # مصادر Vite
```

---

## 🔌 نقاط API الرئيسية

| القسم | النقاط |
|---|---|
| **المراقبة** | `GET /api/stats`, `/api/network/traffic`, `/api/hardware/sensors` |
| **البرامج** | `GET /api/software`, `POST /api/software/{uninstall,launch}`, `POST /api/install` |
| **الخدمات** | `GET /api/services`, `POST /api/services/action` |
| **العمليات** | `GET /api/processes`, `POST /api/processes/{kill,priority}` |
| **التخزين** | `GET /api/storage/{large-files,analyze,partitions}`, `POST /api/storage/delete-file` |
| **الشبكة** | `GET /api/network/{info,ping-test,scan}`, `POST /api/network/{speedtest,changedns-preset}` |
| **الأمان** | `GET /api/security/{status,rules}`, `POST /api/security/{toggle,deleteRule}` |
| **النظام** | `GET /api/system/{info,updates,benchmark,report}`, `POST /api/system/{update,backup}` |
| **الطاقة** | `POST /api/power/action` (lock/suspend/reboot/poweroff) |
| **الثيمات** | `POST /api/themes/{apply,applySmart,dock}` |

---

## 🔒 الأمان

- الخادم يربط على `127.0.0.1` فقط (غير مكشوف للشبكة الخارجية)
- حماية CORS: طلبات من `localhost`/`127.0.0.1` فقط، والباقي يُرفض بـ 403
- تنقية جميع المدخلات من XSS عبر `esc()` و`encodeURIComponent`
- تنقية حقن الأوامر عبر قوائم بيضاء و`safeShell()` واقتباس آمن
- منع تجاوز المسارات (Path Traversal) في حذف الملفات وبدء التشغيل
- عمليات الطاقة عبر polkit (بدون كلمات مرور صلبة في الكود)

> ⚠️ هذا تطبيق محلي للإدارة الشخصية. لا تفتح الخادم على الشبكة الخارجية.

---

## 🛠️ التقنيات

![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/-Express-000?logo=express) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite) ![Chart.js](https://img.shields.io/badge/-Chart.js-FF6384?logo=chartdotjs)

---

## 📝 الترخيص

مشروع مفتوح المصدر للاستخدام الشخصي والتعليمي.

---

<div align="center">

**صُنع بـ 💠 لأجل لينكس**

⭐ إذا أعجبك المشروع، ادعمه بنجمة على GitHub!

</div>
