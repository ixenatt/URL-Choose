/*
 * theme-detect.js
 * GJS Classic Module - ตรวจสอบว่าระบบกำลังใช้ Dark หรือ Light theme อยู่
 * โดยไม่ผูกติดกับ GNOME โดยเฉพาะ (ใช้ XDG Desktop Portal ซึ่งเป็นมาตรฐานกลาง
 * ที่ GNOME, KDE Plasma, และ DE อื่นๆ ที่รองรับ xdg-desktop-portal ตอบค่าได้)
 */

const { Gio, GLib, Gtk } = imports.gi;

/**
 * วิธีหลัก: ถาม XDG Desktop Portal ผ่าน D-Bus
 * org.freedesktop.portal.Settings -> org.freedesktop.appearance -> color-scheme
 * ค่าที่ได้: 0 = ไม่ระบุ, 1 = ต้องการ dark, 2 = ต้องการ light
 * ใช้ได้ทุก DE ที่มี xdg-desktop-portal ทำงานอยู่เบื้องหลัง ไม่ใช่แค่ GNOME
 */
function readFromPortal() {
    const proxy = Gio.DBusProxy.new_for_bus_sync(
        Gio.BusType.SESSION,
        Gio.DBusProxyFlags.NONE,
        null,
        "org.freedesktop.portal.Desktop",
        "/org/freedesktop/portal/desktop",
        "org.freedesktop.portal.Settings",
        null
    );

    const result = proxy.call_sync(
        "Read",
        new GLib.Variant("(ss)", ["org.freedesktop.appearance", "color-scheme"]),
        Gio.DBusCallFlags.NONE,
        -1,
        null
    );

    // ผลลัพธ์ถูกห่อเป็น (v) ต้อง unpack สองชั้น
    const outer = result.deep_unpack()[0];
    const value = outer.deep_unpack ? outer.deep_unpack() : outer;

    if (value === 1) return "dark";
    if (value === 2) return "light";
    return null; // ไม่ระบุ ให้ไป fallback ต่อ
}

/**
 * fallback ที่ 1: เช็คค่าที่ GTK ตั้งไว้เอง
 * (บางระบบ sync ค่ามาจาก portal อยู่แล้วตอน GTK init)
 */
function readFromGtkSettings() {
    try {
        const settings = Gtk.Settings.get_default();
        if (settings && settings.gtk_application_prefer_dark_theme) {
            return "dark";
        }
        if (settings && typeof settings.gtk_theme_name === "string") {
            if (settings.gtk_theme_name.toLowerCase().includes("dark")) return "dark";
        }
    } catch (e) {}
    return null;
}

/**
 * fallback ที่ 2: เช็ค environment variable GTK_THEME
 * (เผื่อกรณีรันบน WM เปล่าๆ ที่ไม่มี portal และไม่มี GTK settings daemon)
 */
function readFromEnv() {
    const gtkTheme = GLib.getenv("GTK_THEME");
    if (gtkTheme && gtkTheme.toLowerCase().includes("dark")) return "dark";
    return null;
}

/**
 * คืนค่า "dark" หรือ "light" เสมอ (ไม่คืน null)
 * ไล่ตรวจตามลำดับ: portal -> gtk settings -> env var -> default light
 */
function getSystemColorScheme() {
    try {
        const fromPortal = readFromPortal();
        if (fromPortal) return fromPortal;
    } catch (e) {
        // portal ไม่มี (DE ไม่รองรับ / WM เปล่าไม่มี xdg-desktop-portal) -> ไป fallback ต่อ
    }

    const fromGtk = readFromGtkSettings();
    if (fromGtk) return fromGtk;

    const fromEnv = readFromEnv();
    if (fromEnv) return fromEnv;

    return "light";
}

var ThemeDetect = {
    getSystemColorScheme
};
