/*
 * ui.js
 * GJS Classic Module (GTK 4.0) - Theme-aware CSS loader (System/Light/Dark)
 */

const { Gtk, Gdk } = imports.gi;

// หมายเหตุ: ชื่อไฟล์มี "-" จึงต้อง import ด้วย bracket notation เท่านั้น
// (imports.ui-dark จะถูกตีความเป็นการลบเลข ทำให้ syntax error)
const UiDark = imports["ui-dark"].UiDark;
const UiLight = imports["ui-light"].UiLight;
const ThemeDetect = imports["theme-detect"].ThemeDetect;

/*
 * =========================
 * THEME STATE
 * =========================
 */

let currentProvider = null;
let currentMode = "dark"; // "light" | "dark" ที่ resolve แล้วจริงๆ (ไม่ใช่ค่า "system")

/**
 * แปลงค่าที่ผู้ใช้ตั้งไว้ ("system" | "light" | "dark") ให้เป็นโหมดจริง ("light" | "dark")
 * ถ้าเป็น "system" จะไปตรวจสอบจากระบบผ่าน theme-detect.js
 */
function resolveThemeMode(themeConfigValue) {
    if (themeConfigValue === "dark") return "dark";
    if (themeConfigValue === "light") return "light";
    // "system" หรือค่าอื่นที่ไม่รู้จัก -> ตรวจสอบจากระบบจริง
    try {
        return ThemeDetect.getSystemColorScheme();
    } catch (e) {
        return "dark"; // เผื่อตรวจไม่ได้เลยจริงๆ ให้ fallback เป็น dark
    }
}

/*
 * =========================
 * INSTALL / SWITCH CSS
 * =========================
 */

/**
 * ติดตั้ง (หรือสลับ) สไตล์ชีตของแอปตามค่า theme ที่ส่งเข้ามา
 * @param {string} themeConfigValue - "system" | "light" | "dark"
 */
function installCss(themeConfigValue) {
    const mode = resolveThemeMode(themeConfigValue);
    currentMode = mode;

    const cssText = mode === "light" ? UiLight.CSS_LIGHT : UiDark.CSS_DARK;

    const provider = new Gtk.CssProvider();
    provider.load_from_data(cssText, -1);

    const display = Gdk.Display.get_default();

    // ถ้าเคยติดตั้ง provider ตัวเก่าไว้แล้ว (กรณีผู้ใช้เปลี่ยนธีมระหว่างใช้งาน) ให้ถอดออกก่อน
    if (currentProvider) {
        Gtk.StyleContext.remove_provider_for_display(display, currentProvider);
    }

    Gtk.StyleContext.add_provider_for_display(
        display,
        provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    currentProvider = provider;
    return mode;
}

/**
 * ให้หน้า Settings หรือส่วนอื่นเรียกดูได้ว่าตอนนี้ธีมที่ใช้จริง (หลัง resolve "system" แล้ว) คืออะไร
 */
function getCurrentThemeMode() {
    return currentMode;
}

/*
 * =========================
 * ICON BUTTON FACTORY
 * =========================
 */

function iconButton(iconName, tooltip) {
    // ใช้เมธอดสร้างไอคอนที่จะเปลี่ยนสีตามสไตล์ CSS (Symbolic)
    const image = Gtk.Image.new_from_icon_name(iconName);
    image.set_pixel_size(24);

    const btn = new Gtk.Button({
        child: image,
        tooltip_text: tooltip
    });

    btn.add_css_class("icon-btn");

    return btn;
}

/*
 * =========================
 * SMALL HELPERS
 * =========================
 */

function spacer(width = 8) {
    const box = new Gtk.Box();
    box.set_size_request(width, -1);
    return box;
}

/*
 * =========================
 * VERTICAL DIVIDER (สำหรับคั่นกลุ่มปุ่ม)
 * =========================
 */

function divider() {
    const sep = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });
    sep.add_css_class("v-separator");
    sep.set_size_request(-1, 28);
    return sep;
}

/*
 * =========================
 * EXPORT
 * =========================
 */

var UI = {
    installCss,
    getCurrentThemeMode,
    iconButton,
    spacer,
    divider
};