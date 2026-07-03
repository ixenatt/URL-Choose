/*
 * core.js
 * GJS Classic Module - Core Functions
 */

const { Gio, GLib , Gtk } = imports.gi;

var Core = {
    // ฟังก์ชัน loadConfig และ saveConfig เดิมของคุณ
    loadConfig() {
        try {
            // โค้ดอ่านไฟล์ config.json ของคุณเดิม...
            // ตัวอย่างสมมติเพื่อให้มี Fallback ป้องกัน config เป็น undefined
            let path = GLib.build_filenamev([GLib.get_user_config_dir(), "urlchooser", "config.json"]);
            let file = Gio.File.new_for_path(path);
            if (!file.query_exists(null)) {
                return this.getDefaultConfig();
            }
            const [ok, contents] = file.load_contents(null);
            if (!ok) return this.getDefaultConfig();
            
            let data = JSON.parse(imports.byteArray.toString(contents));
            if (!data.language) data.language = "en";
            if (!data.browsers) data.browsers = [];
            return data;
        } catch (e) {
            return this.getDefaultConfig();
        }
    },

    saveConfig(config) {
        try {
            let path = GLib.build_filenamev([GLib.get_user_config_dir(), "urlchooser", "config.json"]);
            let file = Gio.File.new_for_path(path);
            let parent = file.get_parent();
            if (!parent.query_exists(null)) {
                parent.make_directory_with_parents(null);
            }
            file.replace_contents(
                imports.byteArray.fromString(JSON.stringify(config, null, 4)),
                null, false, Gio.FileCreateFlags.NONE, null
            );
        } catch (e) {
            logError(e, "Error saving config");
        }
    },

    getDefaultConfig() {
        return {
            always_ask: true,
            icon_size: 32,
            theme: "system",
            language: "en",
            browsers: []
        };
    },

    /**
     * ค้นหาเบราว์เซอร์อัตโนมัติจากไฟล์ .desktop ในระบบลินุกซ์
     */
    autoDetectBrowsers() {
        let detectedPaths = [];
        try {
            const appDir = Gio.File.new_for_path("/usr/share/applications");
            if (!appDir.query_exists(null)) return detectedPaths;

            const enumerator = appDir.enumerate_children(
                "standard::name,standard::type",
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                if (fileInfo.get_file_type() === Gio.FileType.REGULAR && fileInfo.get_name().endsWith(".desktop")) {
                    let desktopId = fileInfo.get_name();
                    let appInfo = Gio.DesktopAppInfo.new(desktopId);
                    
                    if (appInfo) {
                        let categories = appInfo.get_categories();
                        if (categories && categories.includes("Network") && categories.includes("WebBrowser")) {
                            let desktopPath = GLib.build_filenamev(["/usr/share/applications", desktopId]);
                            detectedPaths.push(desktopPath);
                        }
                    }
                }
            }
        } catch (e) {
            logError(e, "Error auto-detecting browsers");
        }
        return detectedPaths;
    },

    /**
     * ดึงค่ารายชื่อเบราว์เซอร์แอปพลิเคชันสำหรับส่งให้หน้า UI วาดปุ่ม
     */
    getBrowsers(config) {
        let list = [];
        if (!config || !config.browsers || !Array.isArray(config.browsers)) return list;

        config.browsers.forEach(bPath => {
            try {
                let info = null;
                if (bPath.endsWith(".desktop")) {
                    info = Gio.DesktopAppInfo.new_from_filename(bPath);
                } else {
                    info = Gio.AppInfo.create_from_commandline(bPath, null, Gio.AppInfoCreateFlags.NONE);
                }

                if (info) {
                    list.push({
                        path: bPath,
                        info: info
                    });
                }
            } catch (e) {
                logError(e, `Error loading browser: ${bPath}`);
            }
        });
        return list;
    },

    openBrowser(info, url) {
        try {
            info.launch_uris([url], null);
        } catch (e) {
            logError(e, "Error launching browser");
        }
    },

    applyGtkTheme(config) {
        let settings = Gtk.Settings.get_default();
        if (!settings || !config) return;
        if (config.theme === "dark") {
            settings.gtk_application_prefer_dark_theme = true;
        } else if (config.theme === "light") {
            settings.gtk_application_prefer_dark_theme = false;
        }
    }
};