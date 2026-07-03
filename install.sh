#!/bin/bash

# Ensure the script is run with root/sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run this script with sudo privileges (e.g., sudo ./install.sh)."
  exit 1
fi

echo "🚀 Starting installation of URL Chooser to /opt..."

# 1. Create target deployment directory under /opt
INSTALL_DIR="/opt/urlchooser"
mkdir -p "$INSTALL_DIR"

# 2. Copy core modules and resources to the installation directory
echo "📦 Copying application files..."
cp -r core.js settings.js ui.js urlchooser.js "$INSTALL_DIR/"
cp -r i18n "$INSTALL_DIR/"

# 3. Grant execution permissions to the entrypoint script
chmod +x "$INSTALL_DIR/urlchooser.js"

# 4. Create a symlink to /usr/local/bin for global terminal access
echo "🔗 Creating symlink to /usr/local/bin/urlchooser..."
ln -sf "$INSTALL_DIR/urlchooser.js" /usr/local/bin/urlchooser

# 5. Register the application with the desktop environment via a .desktop file
echo "📝 Creating system integration entry (.desktop)..."
DESKTOP_FILE="/usr/share/applications/urlchooser.desktop"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Name=URL Chooser
Name[th]=ตัวเลือกเบราว์เซอร์
Comment=Choose your preferred browser on the fly
Comment[th]=เลือกเว็บเบราว์เซอร์ที่คุณต้องการเมื่อเปิดลิงก์
Exec=/usr/local/bin/urlchooser %u
Icon=web-browser
Terminal=false
Type=Application
Categories=Network;WebBrowser;
MimeType=x-scheme-handler/http;x-scheme-handler/https;
EOF

# 6. Rebuild desktop application database to sync mime-type associations
echo "🔄 Updating Mime-Type desktop database..."
update-desktop-database

echo "✅ Installation completed successfully!"
echo "💡 You can now set URL Chooser as your default system browser inside your OS Settings."