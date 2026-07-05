#!/bin/bash

# =========================================================================
# URL Chooser - Smart Permission Installation Script (GPL 3.0)
# Fix for Arch Linux / Root Layer Configuration
# =========================================================================

# 1. ตรวจสอบก่อนว่าผู้ใช้เปิดรันสคริปต์นี้ด้วยสิทธิ์ sudo จริงไหม (เพราะต้องการติดตั้งลง /opt)
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run this script with sudo privileges (e.g., sudo ./install.sh)."
  exit 1
fi

# 2. แกะหาชื่อ User จริงๆ ที่เป็นคนกดเรียกใช้คำสั่ง sudo (ไม่ใช่ root)
REAL_USER=${SUDO_USER:-$USER}
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

echo "🚀 Starting installation of URL Chooser..."
echo "👤 Real User detected: $REAL_USER (Home: $REAL_HOME)"

# 3. ตรวจสอบไฟล์ต้นทางก่อนติดตั้ง
SOURCE_FILES=("urlchooser.js" "core.js" "ui.js" "ui-dark.js" "ui-light.js" "theme-detect.js" "settings.js" "i18n")
for file in "${SOURCE_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    echo "❌ Error: Source file/folder '$file' not found."
    exit 1
  fi
done

# 4. จัดเตรียมไดเรกทอรีเป้าหมายใน /opt (ต้องใช้ Root)
INSTALL_DIR="/opt/urlchooser"
echo "📂 Creating installation directory at $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# 5. คัดลอกไฟล์ระบบทั้งหมดไปที่ /opt (ต้องใช้ Root)
echo "📦 Deploying application files..."
rm -rf "$INSTALL_DIR"/*
cp -r core.js settings.js ui.js ui-dark.js ui-light.js theme-detect.js urlchooser.js "$INSTALL_DIR/"
cp -r i18n "$INSTALL_DIR/"
cp -r io.github.ixenatt.urlchooser.png "/usr/share/icons/"
chmod 755 -r /usr/share/icons/io.github.ixenatt.urlchooser.png

if [ -d "image" ]; then
  cp -r image "$INSTALL_DIR/"
fi

# 6. กำหนดสิทธิ์รัน (Executable) ให้กับไฟล์สคริปต์หลัก (ต้องใช้ Root)
echo "🔐 Setting executable permissions..."
chmod +x "$INSTALL_DIR/urlchooser.js"

# 7. สร้าง Symlink ไปยัง /usr/local/bin (ต้องใช้ Root)
echo "🔗 Creating global symlink to /usr/local/bin/urlchooser..."
ln -sf "$INSTALL_DIR/urlchooser.js" /usr/local/bin/urlchooser

# 7.5 ติดตั้งไอคอนแอปเข้าไปใน hicolor icon theme ของระบบ (ต้องใช้ Root)
# ใช้ชื่อไอคอนเดียวกับ application_id เพื่อให้ DE (GNOME/KDE ฯลฯ) หาไอคอนเจออัตโนมัติ
APP_ID="io.github.ixenatt.urlchooser"
ICON_SRC="$INSTALL_DIR/image/urlchooser-icon.png"
if [ -f "$ICON_SRC" ]; then
    echo "🎨 Installing application icon into hicolor icon theme..."
    ICON_DEST_DIR="/usr/share/icons/hicolor/512x512/apps"
    mkdir -p "$ICON_DEST_DIR"
    cp "$ICON_SRC" "$ICON_DEST_DIR/${APP_ID}.png"

    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache -f -t /usr/share/icons/hicolor &> /dev/null || true
    fi
fi

# 8. สร้างไฟล์เดสก์ท็อป (.desktop) ไปที่ระบบกลาง (ต้องใช้ Root)
echo "📝 Generating desktop integration entry..."
DESKTOP_FILE="/usr/share/applications/urlchooser.desktop"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Terminal=false
Name=URL Chooser
Name[th]=ตัวเลือกเบราว์เซอร์
Comment=Choose your preferred browser on the fly
Comment[th]=เลือกเว็บเบราว์เซอร์ที่คุณต้องการเมื่อเปิดลิงก์
Exec=/usr/local/bin/urlchooser %u
Icon=${APP_ID}
StartupWMClass=${APP_ID}
Categories=Network;WebBrowser;
MimeType=x-scheme-handler/http;x-scheme-handler/https;text/html;text/xml;application/xhtml+xml;
StartupNotify=true
NoDisplay=false
EOF

# 9. บังคับรีเฟรชฐานข้อมูลแอปพลิเคชันระบบกลาง (ต้องใช้ Root)
echo "🔄 Updating global desktop and mime-type databases..."
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications
fi

# 10. สั่งลงทะเบียน xdg สำหรับจัดการ URL โปรโตคอลด้วยสิทธิ์ของ USER จริง (ห้ามใช้สิทธิ์ Root!)
# ใช้คำสั่ง 'sudo -u' เพื่อส่งผ่านสิทธิ์กลับไปเป็น User ธรรมดา ป้องกันข้อผิดพลาด .config/mimeapps.list
echo "⚙️ Registering default xdg-mime handlers for user: $REAL_USER..."
if command -v xdg-mime &> /dev/null; then
    sudo -u "$REAL_USER" xdg-mime default urlchooser.desktop x-scheme-handler/http
    sudo -u "$REAL_USER" xdg-mime default urlchooser.desktop x-scheme-handler/https
    sudo -u "$REAL_USER" xdg-mime default urlchooser.desktop text/html
    sudo -u "$REAL_USER" xdg-mime default urlchooser.desktop text/html
    sudo -u "$REAL_USER" xdg-settings set default-web-browser urlchooser.desktop

fi

echo "----------------------------------------------------------------------"
echo "✅ Installation completed successfully!"
echo "💡 App Location: $INSTALL_DIR"
echo "💡 Global Binary: /usr/local/bin/urlchooser"
echo "💡 Application ID: ${APP_ID}"
echo "💡 Icon installed: /usr/share/icons/hicolor/512x512/apps/${APP_ID}.png"
echo "----------------------------------------------------------------------"

