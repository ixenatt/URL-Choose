#!/usr/bin/gjs

imports.gi.versions.Gtk = "4.0";

const { Gtk, Gio, GLib, Gdk } = imports.gi;

/*
 * =========================================================
 * PATH SETUP (DYNAMIC DEVELOPMENT & PRODUCTION FALLBACK)
 * =========================================================
 */

const currentDir = GLib.get_current_dir();
// ตรวจสอบว่ามีไฟล์ core.js อยู่ใน Working Directory ปัจจุบันหรือไม่
const isDevelopment = GLib.file_test(`${currentDir}/core.js`, GLib.FileTest.EXISTS);

if (isDevelopment) {
    // ช่วงพัฒนา: ชี้ไปที่โฟลเดอร์ปัจจุบันที่คุณกำลังแก้ไขโค้ดอยู่
    imports.searchPath.unshift(currentDir);
} else {
    // ช่วงใช้งานจริง (Production): ชี้ไปที่ไดเรกทอรีหลักของระบบใน /opt
    imports.searchPath.unshift("/opt/urlchooser");
}
/*
 * =========================================================
 * MODULES
 * =========================================================
 */

const Core = imports.core.Core;
const UI = imports.ui.UI;
const Settings = imports.settings.Settings;
const I18N = imports.i18n.index.I18N;

/*
 * =========================================================
 * APP STATE
 * =========================================================
 */

let config = null;

/*
 * =========================================================
 * APP
 * =========================================================
 */

const app = new Gtk.Application({
    application_id: "com.example.urlchooser"
});

app.connect("startup", () => {
    UI.installCss();
});

app.connect("activate", () => {

    config = Core.loadConfig();

    /*
     * =========================================================
     * FIRST-RUN FALLBACK: AUTO-DETECT IF BROWSER LIST IS EMPTY
     * =========================================================
     */
    if (!config || !config.browsers || !Array.isArray(config.browsers) || config.browsers.length === 0) {
        if (typeof Core.autoDetectBrowsers === "function") {
            const detected = Core.autoDetectBrowsers();
            if (detected && detected.length > 0) {
                config.browsers = detected;
                Core.saveConfig(config);
            }
        }
    }

    if (config && config.language) {
        I18N.setLanguage(config.language);
    }

    Core.applyGtkTheme(config);

    // รองรับกรณีไม่มี URL ส่งเข้ามา (เช่น เปิดแอปตรงๆ) จะได้ค่าเป็น string ว่าง ""
    const url = ARGV[0] || "";

    /*
     * =========================================================
     * SKIP CHOOSER (ทำงานเฉพาะตอนที่มี URL ส่งเข้ามาเท่านั้น)
     * =========================================================
     */
    if (url && config && !config.always_ask) {
        Core.openDefaultBrowser(url);
        app.quit();
        return;
    }

    /*
     * =========================================================
     * SHOW CHOOSER WINDOW ALWAYS
     * =========================================================
     * ไม่ว่าจะคลิกลิงก์มา หรือเปิดแอปขึ้นมาตรงๆ ให้รันหน้าจอหลักเสมอ
     */
    createChooser(url);
});

/*
 * =========================================================
 * CHOOSER UI
 * =========================================================
 */

function createChooser(url) {

    const win = new Gtk.ApplicationWindow({
        application: app,
        title: I18N.t("window_title"),
        decorated: false,
        resizable: false
    });

    win.add_css_class("transparent-window");

    const root = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6
    });

    root.add_css_class("root-panel");

    /*
     * ESC CLOSE
     */
    const esc = new Gtk.EventControllerKey();
    esc.connect("key-pressed", (_c, keyval) => {
        if (keyval === Gdk.KEY_Escape) {
            app.quit();
            return true;
        }
        return false;
    });
    win.add_controller(esc);

    /*
     * BUILD UI
     */
    function rebuild() {
        win.set_title(I18N.t("window_title"));

        let child = root.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            root.remove(child);
            child = next;
        }

        const browsers = Core.getBrowsers(config);

        if (browsers.length === 0) {
            const lblEmpty = new Gtk.Label({
                margin_start: 12,
                margin_end: 12
            });
            lblEmpty.set_markup(`<span color="#ffffff">${I18N.t("no_browser")}</span>`);
            root.append(lblEmpty);
        } else {
            for (const b of browsers) {
                const icon = new Gtk.Image();
                const gicon = b.info.get_icon();

                if (gicon)
                    icon.set_from_gicon(gicon);
                else
                    icon.set_from_icon_name("web-browser-symbolic");

                icon.set_pixel_size(config.icon_size || 32);

                const btn = new Gtk.Button({
                    child: icon,
                    tooltip_text: b.info.get_display_name()
                });

                btn.add_css_class("icon-btn");

                // หากไม่มี URL ปุ่มเลือกเบราเซอร์จะทำหน้าที่เป็นแค่พรีวิว (กดแล้วไม่มีผลร้ายแรงหรือกดแล้วแอปปิด)
                btn.connect("clicked", () => {
                    if (url) {
                        Core.openBrowser(b.info, url);
                        config.last_browser = b.path;
                        Core.saveConfig(config);
                    }
                    app.quit();
                });

                root.append(btn);
            }
        }

        /*
         * SETTINGS BUTTON
         */
        const settingsBtn = UI.iconButton(
            "preferences-system-symbolic",
            I18N.t("tooltip_settings")
        );

        settingsBtn.connect("clicked", () => {
            config = Core.loadConfig(); 
            
            Settings.open(app, win, config, Core, () => {
                let refreshedConfig = Core.loadConfig();
                if (refreshedConfig) {
                    config = refreshedConfig;
                    I18N.setLanguage(config.language);
                    rebuild(); // อัปเดต UI หน้าต่างหลักตามที่ตั้งค่าทันที
                }
            });
        });
        root.append(settingsBtn);

        /*
         * CLOSE BUTTON
         */
        const closeBtn = UI.iconButton(
            "window-close-symbolic",
            I18N.t("tooltip_close")
        );

        closeBtn.add_css_class("close-btn");
        closeBtn.connect("clicked", () => app.quit());
        root.append(closeBtn);
    }

    rebuild();

    win.set_child(root);
    win.present();
}

/*
 * =========================================================
 * RUN
 * =========================================================
 */
app.run([]);