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
    border-radius: 12px;
    padding: 8px; /* ปรับเพิ่ม Padding ของปุ่มให้คลิกง่ายและสวยขึ้น */
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

/* หน้าต่างหลัก (Transparent & Blur Setup) */
.root-panel {
    border-radius: 16px;
    padding: 12px 16px; /* เพิ่ม Padding รอบตัวหน้าต่างหลักให้มีระยะห่างที่สวยงาม */
    background: rgba(30, 30, 30, 0.85); /* พื้นหลังโปร่งใส 85% */
    border: 1px solid rgba(255, 255, 255, 0.1); /* เพิ่มเส้นขอบบางๆ เพื่อความมิติ */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* ป้องกัน CSS ของหน้าต่างหลักไปกวนหน้าต่าง Settings */
window.transparent-window {
    background: transparent;
}

/* ตกแต่งความสวยงามของ Sidebar ในหน้า Settings (ยึดตามธีมระบบ) */
.boxed-list {
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
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
 * EXPORT
 * =========================
 */

var UI = {
    installCss,
    iconButton,
    spacer
};