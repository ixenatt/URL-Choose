/*
 * ui.js
 * GJS Classic Module (GTK 4.0) - Fixed Theme Colors & Window Transparency
 */

const { Gtk, Gdk } = imports.gi;

/*
 * =========================
 * CSS STYLE
 * =========================
 */

const CSS = `
/* บังคับให้ไอคอนเปลี่ยนสีตาม Foreground (color) ของ CSS เสมอ */
.icon-btn image {
    color: #ffffff; 
}

.icon-btn {
    border-radius: 10px;
    padding: 14px; /* เพิ่มพื้นที่รอบไอคอนให้หายใจได้มากขึ้น */
    background: transparent;
    border: none;
    transition: background 0.2s;
}

/* เอฟเฟกต์ Hover บนหน้าต่างหลัก (ปุ่มทั่วไป) */
.icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.icon-btn:hover image {
    color: #ffffff;
}

/* เอฟเฟกต์ Hover เฉพาะปุ่มปิด (สีแดง) */
.close-btn:hover {
    background: #e74c3c;
}

.close-btn:hover image {
    color: #ffffff;
}

/* หน้าต่างหลัก (ทึบขึ้น มองเห็นไอคอนชัด, มุมโค้งน้อยลง) */
.root-panel {
    border-radius: 16px;
    padding: 14px 18px; /* เพิ่ม Padding รอบตัวหน้าต่างหลักให้มีระยะห่างที่สวยงาม */
    background: rgba(22, 22, 22, 0.88); /* ลดความโปร่งใสลง ให้เห็นไอคอนชัดเจน */
    border: 1px solid rgba(255, 255, 255, 0.12); /* เพิ่มเส้นขอบบางๆ เพื่อความมิติ */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

/* เส้นแบ่งระหว่างกลุ่มปุ่ม (ไอคอนเบราว์เซอร์ | ตั้งค่า | ปิด) */
.v-separator {
    background: rgba(255, 255, 255, 0.25);
    min-width: 1px;
    margin: 4px 6px;
}

/* ป้องกัน CSS ของหน้าต่างหลักไปกวนหน้าต่าง Settings */
window.transparent-window {
    background: transparent;
}

/* ==============================
 * SETTINGS WINDOW (macOS-style compact panel, ทึบขึ้นให้อ่านง่าย)
 * ============================== */
.settings-panel {
    border-radius: 16px;
    background: rgba(24, 24, 26, 0.97); /* เกือบทึบ เห็นเนื้อหาทุกอย่างชัดเจน */
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.settings-title {
    color: #ffffff;
    font-weight: 600;
    font-size: 1.05em;
}

.settings-panel label {
    color: #ffffff;
}

.settings-panel .dim-label {
    color: rgba(255, 255, 255, 0.6);
}

/* Sidebar นำทางแบบไอคอน+ข้อความ (แนวตั้ง) */
.nav-sidebar {
    background: transparent;
}

.nav-sidebar row {
    border-radius: 8px;
    margin: 2px 6px;
    background: transparent;
}

.nav-sidebar row:hover {
    background: rgba(255, 255, 255, 0.08);
}

.nav-sidebar row:selected {
    background: rgba(90, 150, 255, 0.35);
}

.nav-sidebar row image {
    color: #ffffff;
}

.nav-sidebar row label {
    color: #ffffff;
}

/* ตกแต่งความสวยงามของรายการในหน้า Settings (ยึดตามธีมระบบ) */
.boxed-list {
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
}

/* สำหรับปุ่มลบในหน้าตั้งค่า */
.error {
    background: transparent;
    border: none;
}
.error:hover {
    background: rgba(231, 76, 60, 0.15);
}
.error image {
    color: #e74c3c;
}

/* ==============================
 * ปุ่มและช่องกรอกข้อมูลทั่วไปในหน้า Settings
 * ให้สีปุ่ม/ตัวหนังสือตัดกับพื้นหลังเสมอ ไม่กลืนกัน
 * ============================== */
.panel-btn,
.panel-btn button {
    background: rgba(255, 255, 255, 0.10);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    padding: 6px 14px;
}

.panel-btn:hover,
.panel-btn button:hover {
    background: rgba(255, 255, 255, 0.18);
}

.panel-btn label,
.panel-btn image {
    color: #ffffff;
}

.panel-btn arrow {
    color: #ffffff;
    opacity: 0.85;
}

.panel-btn.suggested-action,
.panel-btn.suggested-action button {
    background: rgba(58, 130, 247, 0.9);
    border: 1px solid rgba(58, 130, 247, 1);
    color: #ffffff;
}

.panel-btn.suggested-action:hover,
.panel-btn.suggested-action button:hover {
    background: rgba(37, 108, 230, 1);
}
/* SpinButton / Entry ในหน้า Settings */
.settings-panel spinbutton,
.settings-panel entry {
    background: rgba(255, 255, 255, 0.10);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
}

.settings-panel spinbutton button,
.settings-panel spinbutton text,
.settings-panel spinbutton entry {
    background: transparent;
    color: #ffffff;
}

/* =========================================================================
 * ตัวเลือกภาษาแบบ MenuButton + Popover + ListBox ที่เราสร้างเอง
 * ใช้แทน Gtk.DropDown เพราะเราคุม CSS node ("popover", "contents", "row")
 * ได้แน่นอน 100% ไม่ต้องพึ่งชื่อ node ภายในของ GtkListView ที่ไม่แน่นอน
 * ========================================================================= */
.app-popover > contents {
    background: rgba(24, 24, 26, 0.98);
    color: #ffffff;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 4px;
}

.app-popover-list {
    background: transparent;
}

.app-popover-list row {
    border-radius: 6px;
    padding: 2px;
    background: transparent;
    color: #ffffff;
}

.app-popover-list row label {
    color: #ffffff;
}

.app-popover-list row:hover {
    background: rgba(255, 255, 255, 0.14);
}

.app-popover-list row:selected {
    background: rgba(90, 150, 255, 0.4);
}
`;

/*
 * =========================
 * INSTALL CSS
 * =========================
 */

function installCss() {
    const provider = new Gtk.CssProvider();
    provider.load_from_data(CSS, -1);

    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
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
    iconButton,
    spacer,
    divider
};