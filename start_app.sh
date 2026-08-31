#!/bin/bash

# المسار الخاص بالمشروع (يُشتق تلقائياً من مكان هذا السكربت)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOSTART_DIR="$HOME/.config/autostart"
DESKTOP_DIR="$HOME/Desktop"

cd "$PROJECT_DIR" || exit 1

echo "==============================================="
echo "   🚀 System Master - جاري التشغيل..."
echo "==============================================="

# التأكد من وجود Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ خطأ: Node.js غير مثبت!"
    exit 1
fi

# تنظيف العمليات القديمة لهذا المشروع فقط
echo "🔄 تنظيف العمليات السابقة..."
pkill -f "node $PROJECT_DIR/server.cjs" 2>/dev/null || true
pkill -f "[n]ode server.cjs" 2>/dev/null || true
pkill -f "[v]ite --port 5180" 2>/dev/null || true
pkill -f "npm run dev -- --port 5180" 2>/dev/null || true

# تشغيل Backend
echo "📡 تشغيل الخادم الخلفي (Backend)..."
setsid node server.cjs > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# تشغيل Frontend
echo "🌐 تشغيل الواجهة الأمامية (Frontend)..."
setsid npm run dev -- --port 5180 > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# الانتظار للتأكد من التشغيل
sleep 5

# إضافة البرنامج إلى قائمة التشغيل التلقائي إذا لم يكن موجوداً
if [ ! -d "$AUTOSTART_DIR" ]; then
    mkdir -p "$AUTOSTART_DIR"
fi

if [ -f "$PROJECT_DIR/SystemMaster.desktop" ]; then
    cp "$PROJECT_DIR/SystemMaster.desktop" "$AUTOSTART_DIR/"
    chmod +x "$AUTOSTART_DIR/SystemMaster.desktop"
    echo "✅ تم إضافة البرنامج للقائمة التشغيل التلقائي."
fi

# فتح المتصفح
echo "🌍 فتح المتصفح..."
(google-chrome http://localhost:5180 || firefox http://localhost:5180 || xdg-open http://localhost:5180) > /dev/null 2>&1 &

echo ""
echo "==============================================="
echo "  🎉 تم تشغيل System Master بنجاح!"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo "==============================================="
echo "يمكنك إغلاق هذه النافذة الآن."
sleep 2
