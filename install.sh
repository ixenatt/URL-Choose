#!/bin/bash

# =========================================================================
# URL Chooser - Advanced Installation Script (GPL 3.0)
# รองรับ Debian/Ubuntu, Fedora, และ Arch Linux
# =========================================================================

# ตรวจสอบสิทธิ์ Root (sudo)
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run this script with sudo privileges (e.g., sudo ./install.sh)."
  exit 1
fi

echo "🚀 Starting installation of URL Chooser..."

# 1. ตรวจสอบไฟล์ต้นทางก่อนติดตั้ง ป้องกันการ Copy ไฟล์เปล่าหรือไฟล์ขาดหาย
SOURCE_FILES=("urlchooser.js" "core.js" "ui.js" "settings.js" "i18n")
for file in "${SOURCE_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    echo "❌ Error: Source file/folder '$file' not found in the current directory."
    echo "   Please run this script from the repository root folder."
    exit 1
  fi
done

# 2. จัดเตรียมไดเรกทอรีเป้าหมายใน /opt
INSTALL_DIR="/opt/urlchooser"
echo "📂 Creating installation directory at $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# 3. ล้างไฟล์เก่า (ถ้ามี) และคัดลอกไฟล์ระบบทั้งหมดไปที่ /opt
echo "📦 Deploying application files..."
rm -rf "$INSTALL_DIR"/*
cp -r core.js settings.js ui.js urlchooser.js "$INSTALL_DIR/"
cp -r i18n "$INSTALL_DIR/"

# ทำความสะอาดกรณีมีโฟลเดอร์ image สกรีนช็อตติดมาด้วย (ถ้าต้องการให้แอปเบาลง)
if [ -d "image" ]; then
  cp -r image "$INSTALL_DIR/"
fi

# 4. กำหนดสิทธิ์รัน (Executable) ให้กับไฟล์สคริปต์หลัก
echo "🔐 Setting executable permissions..."
chmod +x "$INSTALL_DIR/urlchooser.js"

# 5. สร้าง Symlink ไปยัง /usr/local/bin เพื่อให้เรียกใช้ผ่านโครงสร้างระบบได้ทั่วไป
echo "🔗 Creating global symlink to /usr/local/bin/urlchooser..."
ln -sf "$INSTALL_DIR/urlchooser.js" /usr/local/bin/urlchooser

# 6. สร้างไฟล์เดสก์ท็อป (.desktop) เพื่อลงทะเบียนแอปพลิเคชันกับเดสก์ท็อป GNOME
# เพิ่มคีย์ครบถ้วน เพื่อให้ปรากฏใน App Overview และเมนู Default Web Browser ของ OS
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
Icon=web-browser
Categories=Network;WebBrowser;
MimeType=x-scheme-handler/http;x-scheme-handler/https;text/html;text/xml;application/xhtml+xml;
StartupNotify=true
NoDisplay=false
EOF

# 7. บังคับรีเฟรชฐานข้อมูลแอปพลิเคชัน (Mime-Type & Desktop Database) ของระบบ
echo "🔄 Updating desktop and mime-type databases..."
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications
else
    echo "⚠️ Warning: 'update-desktop-database' command not found. Please ensure 'desktop-file-utils' is installed."
fi

# 8. สั่งลงทะเบียน xdg สำหรับจัดการ URL โปรโตคอลล่วงหน้า
echo "⚙️ Registering default xdg-mime handlers..."
if command -v xdg-mime &> /dev/null; then
    xdg-mime default urlchooser.desktop x-scheme-handler/http
    xdg-mime default urlchooser.desktop x-scheme-handler/https
fi
xdg-settings set default-web-browser urlchooser.desktop

echo "----------------------------------------------------------------------"
echo "✅ Installation completed successfully!"
echo "💡 App Location: $INSTALL_DIR"
echo "💡 Global Binary: /usr/local/bin/urlchooser"
echo "----------------------------------------------------------------------"
echo "ℹ️  If it doesn't show up in the GUI immediately, please restart GNOME Settings."