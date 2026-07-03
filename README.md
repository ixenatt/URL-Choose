# 🌐 URL Chooser (GJS)

A lightweight **browser selector / URL handler** written in **GNOME JavaScript (GJS)**.

It intercepts HTTP/HTTPS links and lets you choose which installed browser to open them with.

---

## ✨ Features

* 🔀 Choose browser before opening any URL
* 🌐 Detect installed browsers automatically
* ⚙️ Settings window (GTK4)
* ⭐ Set as default system browser (xdg-mime)
* 🧠 Remember last selected browser
* 🔘 Optional “Always ask” mode
* 🚀 Fallback to system default browser
* 🖥️ Works with GNOME / XDG desktop systems

---

## 📸 Preview

```
+------------------------+
| Choose Browser         |
|------------------------|
| Firefox                |
| Google Chrome          |
| Brave                  |
| Chromium               |
|                        |
| [Open Default Browser] |
| [Settings]            |
+------------------------+
```

---

## 📦 Requirements

* Linux (tested on GNOME)
* GJS (GNOME JavaScript)
* GTK 4
* xdg-utils

Install dependencies:

### Ubuntu / Debian

```bash
sudo apt install gjs libgtk-4-1 xdg-utils
```

### Fedora

```bash
sudo dnf install gjs gtk4 xdg-utils
```

---

## 🚀 Installation

Clone repository:

```bash
git clone https://github.com/yourname/url-chooser.git
cd url-chooser
```

Make script executable:

```bash
chmod +x urlchooser.js
```

Move to bin:

```bash
mkdir -p ~/bin
mv urlchooser.js ~/bin/urlchooser
```

---

## 🧩 Desktop Integration

Create desktop file:

```bash
mkdir -p ~/.local/share/applications
nano ~/.local/share/applications/urlchooser.desktop
```

Paste:

```ini
[Desktop Entry]
Name=URL Chooser
Exec=/home/YOUR_USER/bin/urlchooser %u
Type=Application
NoDisplay=false
Terminal=false

MimeType=x-scheme-handler/http;x-scheme-handler/https;
```

Update system database:

```bash
xdg-mime default urlchooser.desktop x-scheme-handler/http
xdg-mime default urlchooser.desktop x-scheme-handler/https
```

---

## ⚙️ Settings

Inside the app:

* Enable / disable “Always ask”
* Set as default browser handler
* Close settings anytime

---

## 🧠 How it works

1. System opens a URL (`http://...`)
2. XDG routes it to this app
3. App reads installed browsers via `Gio.AppInfo`
4. Shows selection window
5. Selected browser receives the URL via:

   ```js
   info.launch_uris([url], null)
   ```

---

## 🧪 Usage

Manually test:

```bash
./urlchooser https://example.com
```

---

## ⚡ Configuration

Config file stored at:

```
~/.config/urlchooser/config.json
```

Example:

```json
{
  "always_ask": true,
  "last_browser": "Firefox"
}
```

---

## 🔐 Permissions

This app:

* Does NOT collect data
* Does NOT send network requests
* Only launches local applications

---

## 🛠️ Roadmap

* [ ] Per-domain browser rules
* [ ] Search/filter browser list
* [ ] GTK Adwaita UI upgrade
* [ ] Tray indicator
* [ ] “Remember decision for this site”
* [ ] Flatpak packaging
* [ ] Keyboard shortcuts

---

## 📄 License

MIT License

---

## 💡 Why this exists

Linux systems often default to a single browser.

This tool restores control by letting users decide **which browser opens each link**, similar to “Open with…” but for every URL.

---

## 🤝 Contributing

PRs welcome:

* UI improvements
* rule engine
* GNOME integration
* packaging (Flatpak / Debian)

---

ถ้าคุณอยากต่อยอดอีก ผมสามารถทำให้ได้เช่น:

* 🔥 Flatpak manifest
* 🧩 libadwaita UI (สวยระดับ GNOME Settings)
* 🧠 per-domain rule engine (เหมือน smart browser router)
* ⚡ rofi-like fuzzy search UI

บอกได้เลย 👍

