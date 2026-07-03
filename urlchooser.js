#!/usr/bin/gjs

imports.gi.versions.Gtk = "4.0";

const { Gtk, Gio, GLib, Gdk } = imports.gi;

/*
 * =========================
 * PATH SETUP (IMPORTANT)
 * =========================
 */

imports.searchPath.unshift(
    GLib.get_current_dir()
);

/*
 * =========================
 * MODULES
 * =========================
 */

const Core = imports.core.Core;
const UI = imports.ui.UI;
const Settings = imports.settings.Settings;
const I18N = imports.i18n.index.I18N;

/*
 * =========================
 * APP STATE
 * =========================
 */

let config = null;

/*
 * =========================
 * APP
 * =========================
 */

const app = new Gtk.Application({
    application_id: "com.example.urlchooser"
});

app.connect("startup", () => {
    UI.installCss();
});

app.connect("activate", () => {

    config = Core.loadConfig();

    // กำหนดภาษาเริ่มต้นตามที่บันทึกใน config
    if (config && config.language) {
        I18N.setLanguage(config.language);
    }

    Core.applyGtkTheme(config);

    const url = ARGV[0];

    /*
     * =========================
     * NO URL → OPEN SETTINGS
     * =========================
     */

    if (!url) {
        Settings.open(app, null, config, Core, () => {
            config = Core.loadConfig();
            if (config && config.language) I18N.setLanguage(config.language);
        });
        return;
    }

    /*
     * =========================
     * SKIP CHOOSER
     * =========================
     */

    if (config && !config.always_ask) {
        Core.openDefaultBrowser(url);
        app.quit();
        return;
    }

    /*
     * =========================
     * SHOW CHOOSER
     * =========================
     */

    createChooser(url);
});

/*
 * =========================
 * CHOOSER UI
 * =========================
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
        // อัปเดตชื่อ Title ของ Window เผื่อมีการเปลี่ยนภาษา
        win.set_title(I18N.t("window_title"));

        let child = root.get_first_child();

        while (child) {
            const next = child.get_next_sibling();
            root.remove(child);
            child = next;
        }

        const browsers = Core.getBrowsers(config);

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

            btn.connect("clicked", () => {
                Core.openBrowser(b.info, url);
                config.last_browser = b.path;
                Core.saveConfig(config);
                app.quit();
            });

            root.append(btn);
        }

        /*
         * SETTINGS BUTTON
         */

        const settingsBtn = UI.iconButton(
            "preferences-system-symbolic",
            I18N.t("tooltip_settings")
        );

        settingsBtn.connect("clicked", () => {
            // โหลดคอนฟิกล่าสุดก่อนเปิดหน้าต่างเสมอ ป้องกันตัวแปรหาย
            config = Core.loadConfig(); 
            
            Settings.open(app, win, config, Core, () => {
                // หลังจากบันทึกค่าใน Settings หน้าต่างย่อยเสร็จเรียบร้อย
                let refreshedConfig = Core.loadConfig();
                if (refreshedConfig) {
                    config = refreshedConfig; // เขียนทับ global config ของหน้าจอหลัก
                    I18N.setLanguage(config.language); // สลับชุดคำแปลภาษาหลักทันที
                    rebuild(); // สั่งรีเฟรชวาดหน้าจอหลักและขนาดไอคอนใหม่
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
 * =========================
 * RUN
 * =========================
 */
app.run([]);