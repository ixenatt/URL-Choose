/*
 * ui-light.js
 * GJS Classic Module - CSS สำหรับธีมสว่าง (Light Theme)
 */

const CSS_LIGHT = `
/* บังคับให้ไอคอนเปลี่ยนสีตาม Foreground (color) ของ CSS เสมอ */
.icon-btn image {
    color: #1a1a1a;
}

.icon-btn {
    border-radius: 10px;
    padding: 14px;
    background: transparent;
    border: none;
    transition: background 0.2s;
}

/* เอฟเฟกต์ Hover บนหน้าต่างหลัก (ปุ่มทั่วไป) */
.icon-btn:hover {
    background: rgba(0, 0, 0, 0.07);
}

.icon-btn:hover image {
    color: #000000;
}

/* เอฟเฟกต์ Hover เฉพาะปุ่มปิด (สีแดง) */
.close-btn:hover {
    background: #e74c3c;
}

.close-btn:hover image {
    color: #ffffff;
}

/* หน้าต่างหลัก (โทนสว่าง โปร่งใสระดับเดียวกับธีมมืด) */
.root-panel {
    border-radius: 16px;
    padding: 14px 18px;
    background: rgba(250, 250, 250, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* เส้นแบ่งระหว่างกลุ่มปุ่ม (ไอคอนเบราว์เซอร์ | ตั้งค่า | ปิด) */
.v-separator {
    background: rgba(0, 0, 0, 0.15);
    min-width: 1px;
    margin: 4px 6px;
}

/* ป้องกัน CSS ของหน้าต่างหลักไปกวนหน้าต่าง Settings */
window.transparent-window {
    background: transparent;
}

/* ==============================
 * SETTINGS WINDOW (macOS-style compact panel, โทนสว่าง)
 * ============================== */
.settings-panel {
    border-radius: 16px;
    background: rgba(248, 248, 248, 0.88);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
}

.settings-title {
    color: #1a1a1a;
    font-weight: 600;
    font-size: 1.05em;
}

.settings-panel label {
    color: #1a1a1a;
}

.settings-panel .dim-label {
    color: rgba(0, 0, 0, 0.55);
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
    background: rgba(0, 0, 0, 0.06);
}

.nav-sidebar row:selected {
    background: rgba(59, 130, 246, 0.22);
}

.nav-sidebar row image {
    color: #1a1a1a;
}

.nav-sidebar row label {
    color: #1a1a1a;
}

/* ตกแต่งความสวยงามของรายการในหน้า Settings */
.boxed-list {
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.03);
}

/* สำหรับปุ่มลบในหน้าตั้งค่า */
.error {
    background: transparent;
    border: none;
}
.error:hover {
    background: rgba(231, 76, 60, 0.12);
}
.error image {
    color: #c0392b;
}

/* ==============================
 * ปุ่มและช่องกรอกข้อมูลทั่วไปในหน้า Settings
 * ============================== */
.panel-btn,
.panel-btn button {
    background: rgba(0, 0, 0, 0.06);
    color: #1a1a1a;
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 8px;
    padding: 6px 14px;
}

.panel-btn:hover,
.panel-btn button:hover {
    background: rgba(0, 0, 0, 0.12);
}

.panel-btn label,
.panel-btn image {
    color: #1a1a1a;
}

.panel-btn arrow {
    color: #1a1a1a;
    opacity: 0.75;
}

.panel-btn.suggested-action,
.panel-btn.suggested-action button {
    background: rgba(37, 99, 235, 0.8);
    border: 1px solid rgba(37, 99, 235, 1);
    color: #ffffff;
}

.panel-btn.suggested-action label,
.panel-btn.suggested-action image {
    color: #ffffff;
}

.panel-btn.suggested-action:hover,
.panel-btn.suggested-action button:hover {
    background: rgba(29, 78, 216, 1);
}

/* SpinButton / Entry ในหน้า Settings */
.settings-panel spinbutton,
.settings-panel entry {
    background: rgba(0, 0, 0, 0.05);
    color: #1a1a1a;
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 8px;
}

.settings-panel spinbutton button,
.settings-panel spinbutton text,
.settings-panel spinbutton entry {
    background: transparent;
    color: #1a1a1a;
}

/* =========================================================================
 * ตัวเลือกแบบ MenuButton + Popover + ListBox ที่เราสร้างเอง (ภาษา/ธีม)
 * ========================================================================= */
.app-popover > contents {
    background: rgba(252, 252, 252, 0.8);
    color: #1a1a1a;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 4px;
}

.app-popover-list {
    background: transparent;
}

.app-popover-list row {
    border-radius: 6px;
    padding: 2px;
    background: transparent;
    color: #1a1a1a;
}

.app-popover-list row label {
    color: #1a1a1a;
}

.app-popover-list row:hover {
    background: rgba(0, 0, 0, 0.08);
}

.app-popover-list row:selected {
    background: rgba(59, 130, 246, 0.25);
}
`;

var UiLight = { CSS_LIGHT };
