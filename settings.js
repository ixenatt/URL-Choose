/*
 * settings.js
 * GJS Classic Module (GTK 4.0) - Fixed General Page, Wider Window, Default Path Set
 */

const { Gtk, Gio, GLib } = imports.gi;
const I18N = imports.i18n.index.I18N;

function open(app, parentWindow, config, Core, onSaveCallback) {
    let localConfig = config ? config : Core.getDefaultConfig();

    // 1. ปรับขนาดหน้าต่างให้กว้างขยายขึ้น (800x500)
    const win = new Gtk.Window({
        application: app,
        title: I18N.t("settings_title"),
        transient_for: parentWindow,
        modal: true,
        default_width: 800,
        default_height: 500
    });

    let currentBrowsers = [];
    if (localConfig.browsers && Array.isArray(localConfig.browsers)) {
        currentBrowsers = [...localConfig.browsers];
    }

    const mainBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 0 });
    const sidebar = new Gtk.StackSidebar();
    const stack = new Gtk.Stack({
        transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
        transition_duration: 250,
        hexpand: true, // บังคับให้พื้นที่หน้าเพจเนื้อหาฝั่งขวาขยายเต็มความกว้างหน้าต่าง
        vexpand: true
    });

    sidebar.set_stack(stack);
    sidebar.set_size_request(180, -1); // ปรับขนาดความกว้างเมนูซ้ายเล็กน้อยเพื่อความสมดุล

    mainBox.append(sidebar);
    const contentSeparator = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });
    mainBox.append(contentSeparator);
    mainBox.append(stack);

    /* =========================================================================
     * PAGE 1: GENERAL (แก้ไขปัญหาหน้าต่างหายและเปิดการขยายโครงสร้าง)
     * ========================================================================= */
    const pageGeneral = new Gtk.Box({ 
        orientation: Gtk.Orientation.VERTICAL, 
        margin_top: 24, margin_bottom: 24, margin_start: 24, margin_end: 24, 
        spacing: 16 
    });
    
    const chkAlwaysAsk = new Gtk.CheckButton({
        label: I18N.t("always_ask"),
        active: !!localConfig.always_ask
    });
    pageGeneral.append(chkAlwaysAsk);

    // ทำกล่องปุ่มตั้งค่าเริ่มต้นแยกเพื่อให้วาด Layout ได้ถูกต้องชัดเจน
    const btnDefault = new Gtk.Button({ 
        label: I18N.t("set_default"),
        halign: Gtk.Align.START // วางชิดซ้าย ไม่ให้ปุ่มยืดเต็มหน้าจอ
    });
    btnDefault.connect("clicked", () => {
        if (typeof Core.setAsDefaultBrowser === "function") Core.setAsDefaultBrowser();
    });
    pageGeneral.append(btnDefault);
    
    stack.add_titled(pageGeneral, "general", I18N.t("general"));

    /* =========================================================================
     * PAGE 2: APPEARANCE (ลักษณะการแสดงผล)
     * ========================================================================= */
    const pageAppearance = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_top: 24, margin_bottom: 24, margin_start: 24, margin_end: 24, spacing: 16 });
    
    const rowIconSize = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });
    const lblIconSize = new Gtk.Label({ label: I18N.t("icon_size"), xalign: 0, hexpand: true });
    const spinIconSize = Gtk.SpinButton.new_with_range(16, 128, 4);
    spinIconSize.set_value(localConfig.icon_size || 32);
    rowIconSize.append(lblIconSize);
    rowIconSize.append(spinIconSize);
    pageAppearance.append(rowIconSize);

    const rowTheme = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });
    const lblTheme = new Gtk.Label({ label: I18N.t("theme"), xalign: 0, hexpand: true });
    const comboTheme = new Gtk.DropDown({
        model: Gtk.StringList.new([I18N.t("theme_system"), I18N.t("theme_light"), I18N.t("theme_dark")])
    });
    if (localConfig.theme === "light") comboTheme.set_selected(1);
    else if (localConfig.theme === "dark") comboTheme.set_selected(2);
    else comboTheme.set_selected(0);
    rowTheme.append(lblTheme);
    rowTheme.append(comboTheme);
    pageAppearance.append(rowTheme);
    
    stack.add_titled(pageAppearance, "appearance", I18N.t("appearance"));

    /* =========================================================================
     * PAGE 3: BROWSERS
     * ========================================================================= */
    const pageBrowsers = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_top: 24, margin_bottom: 24, margin_start: 24, margin_end: 24, spacing: 16 });
    const lblBrowserList = new Gtk.Label({ label: I18N.t("browser_list"), xalign: 0 });
    pageBrowsers.append(lblBrowserList);

    const browserListBox = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.NONE });
    browserListBox.add_css_class("boxed-list");
    
    const scrollWin = new Gtk.ScrolledWindow({ min_content_height: 220, vexpand: true });
    scrollWin.set_child(browserListBox);
    pageBrowsers.append(scrollWin);

    function updateBrowserListUI() {
        let child = browserListBox.get_first_child();
        while (child) {
            let next = child.get_next_sibling();
            browserListBox.remove(child);
            child = next;
        }

        if (currentBrowsers.length === 0) {
            const emptyLabel = new Gtk.Label({ label: I18N.t("no_browser"), margin_top: 12, margin_bottom: 12 });
            browserListBox.append(emptyLabel);
            return;
        }

        currentBrowsers.forEach((bPath, index) => {
            const rowBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12, margin_top: 6, margin_bottom: 6, margin_start: 6, margin_end: 6 });
            
            let displayName = GLib.path_get_basename(bPath);
            let gicon = null;

            try {
                let appInfo = null;
                if (bPath.endsWith(".desktop")) {
                    appInfo = Gio.DesktopAppInfo.new_from_filename(bPath);
                }
                if (appInfo) {
                    displayName = appInfo.get_display_name();
                    gicon = appInfo.get_icon();
                }
            } catch (e) {}

            const imgIcon = new Gtk.Image();
            if (gicon) imgIcon.set_from_gicon(gicon);
            else imgIcon.set_from_icon_name("web-browser-symbolic");
            imgIcon.set_pixel_size(24);
            rowBox.append(imgIcon);

            const textVBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, hexpand: true });
            const lblName = new Gtk.Label({ label: displayName, xalign: 0 });
            const lblPath = new Gtk.Label({ label: bPath, xalign: 0 });
            lblPath.add_css_class("dim-label");

            textVBox.append(lblName);
            textVBox.append(lblPath);
            rowBox.append(textVBox);

            const btnRemove = new Gtk.Button({ icon_name: "user-trash-symbolic", tooltip_text: I18N.t("remove_browser") });
            btnRemove.add_css_class("error");
            btnRemove.connect("clicked", () => {
                currentBrowsers.splice(index, 1);
                updateBrowserListUI();
            });
            rowBox.append(btnRemove);

            browserListBox.append(rowBox);
        });
    }

    const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 6 });
    const btnAdd = new Gtk.Button({ label: I18N.t("add_browser"), icon_name: "list-add-symbolic" });
    const btnScan = new Gtk.Button({ label: I18N.t("auto_detect"), icon_name: "find-location-symbolic" });
    const lblStatus = new Gtk.Label({ label: "", xalign: 0, hexpand: true });
    lblStatus.add_css_class("dim-label");

    // กดปุ่ม ADD BROWSER -> บังคับให้เปิดพาธเริ่มต้นที่ /usr/share/applications
    btnAdd.connect("clicked", () => {
        const fileChooser = new Gtk.FileDialog({ title: I18N.t("add_browser") });
        
        // กำหนดโฟลเดอร์เริ่มต้นเป็น /usr/share/applications
        let defaultFolder = Gio.File.new_for_path("/usr/share/applications");
        fileChooser.set_initial_folder(defaultFolder);

        fileChooser.open(win, null, (obj, res) => {
            try {
                const file = fileChooser.open_finish(res);
                if (file) {
                    const filePath = file.get_path();
                    if (!currentBrowsers.includes(filePath)) {
                        currentBrowsers.push(filePath);
                        updateBrowserListUI();
                    }
                }
            } catch (err) {}
        });
    });

    btnScan.connect("clicked", () => {
        lblStatus.set_text(I18N.t("scanning"));
        if (typeof Core.autoDetectBrowsers === "function") {
            const detected = Core.autoDetectBrowsers();
            if (detected && detected.length > 0) {
                detected.forEach(path => {
                    if (!currentBrowsers.includes(path)) currentBrowsers.push(path);
                });
                lblStatus.set_text(I18N.t("browser_found") || "Found!");
            } else {
                lblStatus.set_text(I18N.t("no_browser"));
            }
        }
        updateBrowserListUI();
    });

    btnBox.append(btnAdd);
    btnBox.append(btnScan);
    btnBox.append(lblStatus);
    pageBrowsers.append(btnBox);

    updateBrowserListUI();
    stack.add_titled(pageBrowsers, "browsers", I18N.t("browsers"));

    /* =========================================================================
     * PAGE 4: LANGUAGE
     * ========================================================================= */
    const pageLanguage = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_top: 24, margin_bottom: 24, margin_start: 24, margin_end: 24, spacing: 12 });
    const lblLangSelect = new Gtk.Label({ label: I18N.t("language_select"), xalign: 0 });
    
    const langList = I18N.getLanguages(); 
    const langNames = langList.map(l => l.name);
    const comboLanguage = new Gtk.DropDown({ model: Gtk.StringList.new(langNames) });
    const currentLangIdx = langList.findIndex(l => l.code === localConfig.language);
    if (currentLangIdx !== -1) comboLanguage.set_selected(currentLangIdx);

    const lblNotice = new Gtk.Label({ label: `* ${I18N.t("restart_required")}`, xalign: 0, margin_top: 6 });
    lblNotice.add_css_class("dim-label");

    pageLanguage.append(lblLangSelect);
    pageLanguage.append(comboLanguage);
    pageLanguage.append(lblNotice);
    stack.add_titled(pageLanguage, "language", I18N.t("language"));

    /* =========================================================================
     * BOTTOM ACTION BUTTONS
     * ========================================================================= */
    const footerSeparator = new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL });
    const actionBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 12, margin_bottom: 12, margin_start: 16, margin_end: 16, spacing: 8, halign: Gtk.Align.END });
    const btnCancel = new Gtk.Button({ label: I18N.t("cancel") });
    const btnSave = new Gtk.Button({ label: I18N.t("save") });
    btnSave.add_css_class("suggested-action");

    const outerBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    outerBox.append(mainBox);
    outerBox.append(footerSeparator);
    outerBox.append(actionBox);
    actionBox.append(btnCancel);
    actionBox.append(btnSave);
    mainBox.set_vexpand(true);

    btnCancel.connect("clicked", () => win.close());

    btnSave.connect("clicked", () => {
        localConfig.always_ask = chkAlwaysAsk.get_active();
        localConfig.icon_size = spinIconSize.get_value_as_int();

        const themeIdx = comboTheme.get_selected();
        if (themeIdx === 1) localConfig.theme = "light";
        else if (themeIdx === 2) localConfig.theme = "dark";
        else localConfig.theme = "system";

        const selectedLangIdx = comboLanguage.get_selected();
        if (selectedLangIdx !== -1) localConfig.language = langList[selectedLangIdx].code;

        localConfig.browsers = currentBrowsers;

        if (typeof Core.saveConfig === "function") {
            Core.saveConfig(localConfig);
        }

        if (typeof onSaveCallback === "function") {
            onSaveCallback();
        }

        win.close();
    });

    win.set_child(outerBox);
    win.present();
}

var Settings = { open };