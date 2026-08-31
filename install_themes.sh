#!/bin/bash

TYPE=$1
SUDO_PW="0"

echo "🚀 بدء التحويل الكامل للنظام إلى: $TYPE"

# وظيفة لتنفيذ أوامر gsettings
set_setting() {
    gsettings set $1 $2 "$3"
}

# تثبيت المتطلبات الأساسية والخطوط
echo "📦 تثبيت الأدوات والخطوط..."
echo "$SUDO_PW" | sudo -S apt-get update
echo "$SUDO_PW" | sudo -S apt-get install -y git gnome-shell-extensions gnome-tweaks fonts-inter-variable

if [ "$TYPE" == "mac" ]; then
    echo "🍏 جاري تحويل النظام إلى macOS..."
    
    # تحميل الثيمات والأيقونات
    git clone https://github.com/vinceliuice/WhiteSur-gtk-theme.git /tmp/whitesur-gtk --depth=1
    /tmp/whitesur-gtk/install.sh -t all -N glass -s 220
    
    git clone https://github.com/vinceliuice/WhiteSur-icon-theme.git /tmp/whitesur-icons --depth=1
    /tmp/whitesur-icons/install.sh
    
    # إعدادات الواجهة
    set_setting org.gnome.desktop.interface gtk-theme "WhiteSur-Light"
    set_setting org.gnome.desktop.interface icon-theme "WhiteSur"
    set_setting org.gnome.desktop.interface cursor-theme "WhiteSur"
    set_setting org.gnome.desktop.interface font-name "Inter Variable 11"
    set_setting org.gnome.desktop.wm.preferences button-layout "close,minimize,maximize:appmenu"
    
    # إعدادات الـ Dock (شريط الماك السفلي)
    set_setting org.gnome.shell.extensions.dash-to-dock dock-position "BOTTOM"
    set_setting org.gnome.shell.extensions.dash-to-dock extend-height false
    set_setting org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 48
    set_setting org.gnome.shell.extensions.dash-to-dock transparency-mode "FIXED"
    set_setting org.gnome.shell.extensions.dash-to-dock background-opacity 0.2
    set_setting org.gnome.shell.extensions.dash-to-dock apply-custom-theme false
    set_setting org.gnome.shell.extensions.dash-to-dock running-indicator-style "DOTS"
    set_setting org.gnome.shell.extensions.dash-to-dock custom-theme-shrink true
    set_setting org.gnome.shell.extensions.dash-to-dock unity-backlit-items false
    
    # تغيير الخلفية
    wget -O /tmp/mac_wallpaper.jpg https://raw.githubusercontent.com/vinceliuice/WhiteSur-wallpapers/main/10.15/WhiteSur-Light.jpg
    set_setting org.gnome.desktop.background picture-uri "file:///tmp/mac_wallpaper.jpg"
    set_setting org.gnome.desktop.background picture-uri-dark "file:///tmp/mac_wallpaper.jpg"

elif [ "$TYPE" == "win" ]; then
    echo "🪟 جاري تحويل النظام إلى Windows 11..."
    
    git clone https://github.com/vinceliuice/Windows-11-theme.git /tmp/win11-gtk --depth=1
    /tmp/win11-gtk/install.sh -t all -s standard
    
    git clone https://github.com/vinceliuice/Fluent-icon-theme.git /tmp/fluent-icons --depth=1
    /tmp/fluent-icons/install.sh
    
    # إعدادات الواجهة
    set_setting org.gnome.desktop.interface gtk-theme "Windows-11-Light"
    set_setting org.gnome.desktop.interface icon-theme "Fluent"
    set_setting org.gnome.desktop.interface cursor-theme "Windows-11"
    set_setting org.gnome.desktop.interface font-name "Inter Variable 11"
    set_setting org.gnome.desktop.wm.preferences button-layout ":minimize,maximize,close"
    
    # إعدادات الـ Dock (نمط ويندوز 11 الأصلي)
    set_setting org.gnome.shell.extensions.dash-to-dock dock-position "BOTTOM"
    set_setting org.gnome.shell.extensions.dash-to-dock extend-height false
    set_setting org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 44
    set_setting org.gnome.shell.extensions.dash-to-dock transparency-mode "FIXED"
    set_setting org.gnome.shell.extensions.dash-to-dock background-opacity 0.8
    set_setting org.gnome.shell.extensions.dash-to-dock unity-backlit-items true
    set_setting org.gnome.shell.extensions.dash-to-dock show-apps-at-top true
    # توسيط الأيقونات (محاكاة ويندوز 11)
    set_setting org.gnome.shell.extensions.dash-to-dock alignment "CENTER"
    
    # إعدادات لوحة المفاتيح (اختصارات ويندوز)
    set_setting org.gnome.desktop.wm.keybindings show-desktop "['<Super>d']"
    set_setting org.gnome.desktop.wm.keybindings panel-run-dialog "['<Super>r', '<Alt>F2']"
    set_setting org.gnome.settings-daemon.plugins.media-keys home "['<Super>e']"
    
    # اختصارات النسخ واللصق في التيرمينال (كأنها ويندوز)
    dconf write /org/gnome/terminal/legacy/keybindings/copy "'<Primary>c'"
    dconf write /org/gnome/terminal/legacy/keybindings/paste "'<Primary>v'"
    
    # تغيير الخلفية
    wget -O /tmp/win_wallpaper.jpg https://raw.githubusercontent.com/vinceliuice/Windows-11-wallpapers/main/10.15/WhiteSur-Light.jpg || wget -O /tmp/win_wallpaper.jpg https://images.hdqwalls.com/download/windows-11-stock-official-4k-mm-3840x2160.jpg
    set_setting org.gnome.desktop.background picture-uri "file:///tmp/win_wallpaper.jpg"
    set_setting org.gnome.desktop.background picture-uri-dark "file:///tmp/win_wallpaper.jpg"


elif [ "$TYPE" == "default" ]; then
    echo "🔄 استعادة المظهر الأصلي لأوبونتو..."
    set_setting org.gnome.desktop.interface gtk-theme "Yaru-dark"
    set_setting org.gnome.desktop.interface icon-theme "Yaru"
    set_setting org.gnome.desktop.interface font-name "Ubuntu 11"
    set_setting org.gnome.desktop.wm.preferences button-layout "appmenu:close,minimize,maximize"
    set_setting org.gnome.shell.extensions.dash-to-dock dock-position "LEFT"
    set_setting org.gnome.shell.extensions.dash-to-dock extend-height true

elif [ "$TYPE" == "ubuntu-themes" ]; then
    echo "🐧 جاري تثبيت ثيمات وأيقونات LinuxForGeeks..."
    
    # تحميل الثيمات والأيقونات
    rm -rf /tmp/ubuntu-themes-repo
    git clone https://github.com/LinuxForGeeks/ubuntu-themes.git /tmp/ubuntu-themes-repo --depth=1
    
    echo "📦 نسخ الثيمات والأيقونات..."
    echo "$SUDO_PW" | sudo -S mkdir -p /usr/share/themes /usr/share/icons
    echo "$SUDO_PW" | sudo -S cp -r /tmp/ubuntu-themes-repo/themes/* /usr/share/themes/
    echo "$SUDO_PW" | sudo -S cp -r /tmp/ubuntu-themes-repo/icons/* /usr/share/icons/
    
    echo "✅ تم تثبيت الثيمات والأيقونات بنجاح! يمكنك تفعيلها باستخدام GNOME Tweaks."

elif [ "$TYPE" == "smart" ]; then
    THEME_NAME=$2
    ICON_NAME=$3
    echo "🐧 جاري التطبيق الذكي..."
    
    # تحميل المستودع إذا لزم الأمر
    if [ ! -d "/tmp/ubuntu-themes-repo" ]; then
        if [ "$THEME_NAME" != "none" ] && [ ! -d "/usr/share/themes/$THEME_NAME" ]; then
            echo "⬇️ تحميل المستودع..."
            git clone https://github.com/LinuxForGeeks/ubuntu-themes.git /tmp/ubuntu-themes-repo --depth=1
        elif [ "$ICON_NAME" != "none" ] && [ ! -d "/usr/share/icons/$ICON_NAME" ]; then
            echo "⬇️ تحميل المستودع..."
            git clone https://github.com/LinuxForGeeks/ubuntu-themes.git /tmp/ubuntu-themes-repo --depth=1
        fi
    fi

    # نسخ الملفات إذا تم التحميل
    if [ -d "/tmp/ubuntu-themes-repo" ]; then
        echo "$SUDO_PW" | sudo -S mkdir -p /usr/share/themes /usr/share/icons
        echo "$SUDO_PW" | sudo -S cp -r /tmp/ubuntu-themes-repo/themes/* /usr/share/themes/ || true
        echo "$SUDO_PW" | sudo -S cp -r /tmp/ubuntu-themes-repo/icons/* /usr/share/icons/ || true
    fi

    # إذا كان الثيم المطلوب هو Deepin
    if [[ "$THEME_NAME" == "deepin" || "$THEME_NAME" == "deepin-dark" ]] && [ ! -d "/usr/share/themes/$THEME_NAME" ]; then
        echo "⬇️ تحميل ثيم Deepin GTK الأصلي..."
        if [ ! -d "/tmp/deepin-gtk-theme" ]; then
            git clone https://github.com/linuxdeepin/deepin-gtk-theme.git /tmp/deepin-gtk-theme --depth=1
        fi
        echo "$SUDO_PW" | sudo -S mkdir -p /usr/share/themes
        echo "$SUDO_PW" | sudo -S cp -r /tmp/deepin-gtk-theme/deepin /usr/share/themes/ || true
        echo "$SUDO_PW" | sudo -S cp -r /tmp/deepin-gtk-theme/deepin-dark /usr/share/themes/ || true
    fi

    # إذا كان الثيم المطلوب هو WhiteSur
    if [[ "$THEME_NAME" == "WhiteSur-Light" || "$THEME_NAME" == "WhiteSur-Dark" ]] && [ ! -d "/usr/share/themes/$THEME_NAME" ]; then
        echo "⬇️ تحميل ثيم WhiteSur الأصلي..."
        if [ ! -d "/tmp/whitesur-gtk" ]; then
            git clone https://github.com/vinceliuice/WhiteSur-gtk-theme.git /tmp/whitesur-gtk --depth=1
        fi
        /tmp/whitesur-gtk/install.sh -t all -N glass -s 220
    fi

    # إذا كانت الأيقونات هي WhiteSur
    if [[ "$ICON_NAME" == "WhiteSur" ]] && [ ! -d "/usr/share/icons/$ICON_NAME" ]; then
        echo "⬇️ تحميل أيقونات WhiteSur الأصلية..."
        if [ ! -d "/tmp/whitesur-icons" ]; then
            git clone https://github.com/vinceliuice/WhiteSur-icon-theme.git /tmp/whitesur-icons --depth=1
        fi
        /tmp/whitesur-icons/install.sh
    fi

    # إذا كان الثيم المطلوب هو Colloid
    if [[ "$THEME_NAME" == "Colloid-Light" || "$THEME_NAME" == "Colloid-Dark" ]] && [ ! -d "/usr/share/themes/$THEME_NAME" ]; then
        echo "⬇️ تحميل ثيم Colloid الحديث..."
        if [ ! -d "/tmp/colloid-gtk" ]; then
            git clone https://github.com/vinceliuice/Colloid-gtk-theme.git /tmp/colloid-gtk --depth=1
        fi
        /tmp/colloid-gtk/install.sh -t all -s standard
    fi

    # إذا كانت الأيقونات هي Colloid
    if [[ "$ICON_NAME" == "Colloid" ]] && [ ! -d "/usr/share/icons/$ICON_NAME" ]; then
        echo "⬇️ تحميل أيقونات Colloid..."
        if [ ! -d "/tmp/colloid-icons" ]; then
            git clone https://github.com/vinceliuice/Colloid-icon-theme.git /tmp/colloid-icons --depth=1
        fi
        /tmp/colloid-icons/install.sh
    fi

    
    echo "🎨 تفعيل التخصيصات..."
    if [ "$THEME_NAME" != "none" ]; then
        set_setting org.gnome.desktop.interface gtk-theme "$THEME_NAME"
    fi
    if [ "$ICON_NAME" != "none" ]; then
        set_setting org.gnome.desktop.interface icon-theme "$ICON_NAME"
    fi
    
    echo "✅ تم التطبيق بنجاح!"

elif [ "$TYPE" == "dock" ]; then
    STYLE=$2
    if [ "$STYLE" == "mac" ]; then
        set_setting org.gnome.shell.extensions.dash-to-dock dock-position "BOTTOM"
        set_setting org.gnome.shell.extensions.dash-to-dock extend-height false
        set_setting org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 48
        set_setting org.gnome.shell.extensions.dash-to-dock transparency-mode "DYNAMIC"
        set_setting org.gnome.shell.extensions.dash-to-dock background-opacity 0.2
        set_setting org.gnome.shell.extensions.dash-to-dock apply-custom-theme true
        set_setting org.gnome.shell.extensions.dash-to-dock running-indicator-style "DOTS"
        set_setting org.gnome.shell.extensions.dash-to-dock custom-theme-shrink true
        set_setting org.gnome.shell.extensions.dash-to-dock unity-backlit-items false
        set_setting org.gnome.shell.extensions.dash-to-dock click-action "minimize"
    elif [ "$STYLE" == "win" ]; then
        set_setting org.gnome.shell.extensions.dash-to-dock dock-position "BOTTOM"
        set_setting org.gnome.shell.extensions.dash-to-dock extend-height true
        set_setting org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 40
        set_setting org.gnome.shell.extensions.dash-to-dock transparency-mode "DEFAULT"
        set_setting org.gnome.shell.extensions.dash-to-dock apply-custom-theme true
        set_setting org.gnome.shell.extensions.dash-to-dock running-indicator-style "DEFAULT"
        set_setting org.gnome.shell.extensions.dash-to-dock click-action "minimize-or-previews"
    elif [ "$STYLE" == "default" ]; then
        set_setting org.gnome.shell.extensions.dash-to-dock dock-position "LEFT"
        set_setting org.gnome.shell.extensions.dash-to-dock extend-height true
        set_setting org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 48
        set_setting org.gnome.shell.extensions.dash-to-dock transparency-mode "DEFAULT"
        set_setting org.gnome.shell.extensions.dash-to-dock apply-custom-theme false
    fi
    echo "✅ تم إعداد شريط المهام بنجاح"
fi

echo "✅ اكتمل التحويل بنجاح! قد تحتاج لتسجيل الخروج والعودة لرؤية كافة التغييرات."
