#!/bin/bash

action=$1

if [ "$action" == "speedtest" ]; then
    echo -e "\e[1;36m======================================\e[0m"
    echo -e "\e[1;32m       قياس سرعة الإنترنت (Speed Test)\e[0m"
    echo -e "\e[1;36m======================================\e[0m"
    if ! command -v python3 &> /dev/null; then
        echo "يجب تثبيت python3 لتشغيل الاختبار."
    else
        echo "جاري الاتصال بالخوادم..."
        curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
    fi
    echo ""
    read -p "اضغط Enter للخروج..."
elif [ "$action" == "changedns" ]; then
    echo -e "\e[1;36m======================================\e[0m"
    echo -e "\e[1;33m       تغيير DNS إلى خوادم Google\e[0m"
    echo -e "\e[1;36m======================================\e[0m"
    ACTIVE_CONN=$(nmcli -t -f NAME,DEVICE c show --active | head -n 1 | cut -d: -f1)
    if [ -n "$ACTIVE_CONN" ]; then
        echo "الشبكة الحالية: $ACTIVE_CONN"
        echo "جاري تحديث DNS..."
        sudo nmcli connection modify "$ACTIVE_CONN" ipv4.dns "8.8.8.8 8.8.4.4" ipv4.ignore-auto-dns yes
        sudo nmcli connection up "$ACTIVE_CONN"
        echo -e "\e[1;32mتم تغيير DNS بنجاح!\e[0m"
    else
        echo "لم يتم العثور على شبكة نشطة."
    fi
    echo ""
    read -p "اضغط Enter للخروج..."
fi
