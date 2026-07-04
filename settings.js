/*
 * settings.js
 * GJS Classic Module (GTK 4.0) - macOS System Settings-style compact panel
 */

const { Gtk, Gio, GLib } = imports.gi;
const I18N = imports.i18n.index.I18N;
const UI = imports.ui.UI;

function open(app, parentWindow, config, Core, onSaveCallback) {
    let localConfig = config ? config : Core.getDefaultConfig();

    /* =========================================================================
     * WINDOW: กระจกฝ้าโปร่งแสง ไม่มีกรอบระบบ (Custom Titlebar)
     * ========================================================================= */
    const win = new Gtk.Window({
        application: app,
        transient_for: parentWindow,
        modal: true,
        decorated: false,
        resizable: false,
        default_width: 800,
        default_height: 700
    });
    win.add_css_class("transparent-window");

    let currentBrowsers = [];
    if (localConfig.browsers && Array.isArray(localConfig.browsers)) {
        currentBrowsers = [...localConfig.browsers];
    }

    const outerBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    outerBox.add_css_class("settings-panel");

    /* =========================================================================
     * CUSTOM TITLE BAR (ลากย้ายหน้าต่างได้ + ปุ่มปิด)
     * ========================================================================= */
    const titleRow = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_top: 10, margin_bottom: 4, margin_start: 12, margin_end: 12
    });

    const titleLeftSpacer = new Gtk.Box();
    titleLeftSpacer.set_size_request(32, -1);

    const lblTitle = new Gtk.Label({ label: I18N.t("settings_title"), hexpand: true, halign: Gtk.Align.CENTER });
    lblTitle.add_css_class("settings-title");

    const btnTitleClose = UI.iconButton("window-close-symbolic", I18N.t("tooltip_close"));
    btnTitleClose.add_css_class("close-btn");
    btnTitleClose.connect("clicked", () => win.close());

    titleRow.append(titleLeftSpacer);
    titleRow.append(lblTitle);
    titleRow.append(btnTitleClose);

    const dragHandle = new Gtk.WindowHandle();
    dragHandle.set_child(titleRow);
    outerBox.append(dragHandle);

    /* =========================================================================
     * BODY: Sidebar (ไอคอน+ข้อความ) ทางซ้าย + เนื้อหาทางขวา
     * ========================================================================= */
    const bodyBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, vexpand: true });

    const sidebarList = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
    sidebarList.add_css_class("nav-sidebar");

    const sidebarScroll = new Gtk.ScrolledWindow({
        hscrollbar_policy: Gtk.PolicyType.NEVER,
        vexpand: true
    });
    sidebarScroll.set_child(sidebarList);
    sidebarScroll.set_size_request(170, -1);

    const stack = new Gtk.Stack({
        transition_type: Gtk.StackTransitionType.CROSSFADE,
        transition_duration: 150,
        hexpand: true,
        vexpand: true
    });

    let firstSidebarRow = null;

    function sidebarRow(iconName, labelText, pageName) {
        const rowBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            margin_top: 8, margin_bottom: 8, margin_start: 12, margin_end: 12
        });

        const icon = Gtk.Image.new_from_icon_name(iconName);
        icon.set_pixel_size(18);

        const lbl = new Gtk.Label({ label: labelText, xalign: 0 });

        rowBox.append(icon);
        rowBox.append(lbl);

        const row = new Gtk.ListBoxRow({ child: rowBox });
        row._pageName = pageName;

        sidebarList.append(row);

        if (!firstSidebarRow) firstSidebarRow = row;

        return row;
    }

    const contentScroll = new Gtk.ScrolledWindow({ hscrollbar_policy: Gtk.PolicyType.NEVER, vexpand: true, hexpand: true });
    contentScroll.set_child(stack);

    const bodySeparator = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });

    bodyBox.append(sidebarScroll);
    bodyBox.append(bodySeparator);
    bodyBox.append(contentScroll);
    outerBox.append(bodyBox);

    /* =========================================================================
     * PAGE 1: GENERAL
     * ========================================================================= */
    const pageGeneral = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 24, margin_bottom: 24, margin_start: 28, margin_end: 28,
        spacing: 16
    });

    const chkAlwaysAsk = new Gtk.CheckButton({
        label: I18N.t("always_ask"),
        active: !!localConfig.always_ask
    });
    pageGeneral.append(chkAlwaysAsk);

    const btnDefault = new Gtk.Button({
        label: I18N.t("set_default"),
        halign: Gtk.Align.START
    });
    btnDefault.add_css_class("panel-btn");
    btnDefault.connect("clicked", () => {
        if (typeof Core.setAsDefaultBrowser === "function") Core.setAsDefaultBrowser();
    });
    pageGeneral.append(btnDefault);

    stack.add_named(pageGeneral, "general");

    /* =========================================================================
     * PAGE 2: APPEARANCE (ตัดตัวเลือก Theme ออก เหลือแค่ขนาดไอคอน)
     * ========================================================================= */
    const pageAppearance = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 24, margin_bottom: 24, margin_start: 28, margin_end: 28,
        spacing: 16
    });

    const rowIconSize = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });
    const lblIconSize = new Gtk.Label({ label: I18N.t("icon_size"), xalign: 0, hexpand: true });
    const spinIconSize = Gtk.SpinButton.new_with_range(24, 128, 4);
    spinIconSize.set_value(localConfig.icon_size || 64);
    rowIconSize.append(lblIconSize);
    rowIconSize.append(spinIconSize);
    pageAppearance.append(rowIconSize);

    stack.add_named(pageAppearance, "appearance");

    /* =========================================================================
     * PAGE 3: BROWSERS
     * ========================================================================= */
    const pageBrowsers = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 24, margin_bottom: 24, margin_start: 28, margin_end: 28,
        spacing: 12
    });
    const lblBrowserList = new Gtk.Label({ label: I18N.t("browser_list"), xalign: 0 });
    pageBrowsers.append(lblBrowserList);

    const browserListBox = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.NONE });
    browserListBox.add_css_class("boxed-list");

    const scrollWin = new Gtk.ScrolledWindow({ min_content_height: 160, vexpand: true });
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
    btnAdd.add_css_class("panel-btn");
    const btnScan = new Gtk.Button({ label: I18N.t("auto_detect"), icon_name: "find-location-symbolic" });
    btnScan.add_css_class("panel-btn");
    const lblStatus = new Gtk.Label({ label: "", xalign: 0, hexpand: true });
    lblStatus.add_css_class("dim-label");

    btnAdd.connect("clicked", () => {
        const fileChooser = new Gtk.FileDialog({ title: I18N.t("add_browser") });

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
    stack.add_named(pageBrowsers, "browsers");

    /* =========================================================================
     * PAGE 4: LANGUAGE
     * (ใช้ MenuButton + Popover + ListBox ที่เราคุม CSS เองแทน Gtk.DropDown
     *  เพราะ Gtk.DropDown ใช้ GtkListView ภายในซึ่งชื่อ CSS node ของแถวไม่แน่นอน
     *  ทำให้ override สีไม่ได้ผลจริง ส่วน GtkListBoxRow มีชื่อ node "row" ที่แน่นอนตายตัว)
     * ========================================================================= */
    const pageLanguage = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 24, margin_bottom: 24, margin_start: 28, margin_end: 28,
        spacing: 12
    });
    const lblLangSelect = new Gtk.Label({ label: I18N.t("language_select"), xalign: 0 });

    const langList = I18N.getLanguages();
    let selectedLanguageCode = localConfig.language || (langList[0] ? langList[0].code : "en");
    const initialLang = langList.find(l => l.code === selectedLanguageCode) || langList[0];

    const langButton = new Gtk.MenuButton({
        label: initialLang ? initialLang.name : "",
        halign: Gtk.Align.START
    });
    langButton.add_css_class("panel-btn");

    const langPopover = new Gtk.Popover();
    langPopover.add_css_class("app-popover");

    const langListBox = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.NONE });
    langListBox.add_css_class("app-popover-list");

    langList.forEach((l) => {
        const row = new Gtk.ListBoxRow();
        const lbl = new Gtk.Label({
            label: l.name, xalign: 0,
            margin_top: 6, margin_bottom: 6, margin_start: 12, margin_end: 12
        });
        row.set_child(lbl);
        row._langCode = l.code;
        row._langName = l.name;
        langListBox.append(row);
    });

    langListBox.connect("row-activated", (box, row) => {
        selectedLanguageCode = row._langCode;
        langButton.set_label(row._langName);
        langPopover.popdown();
    });

    langPopover.set_child(langListBox);
    langButton.set_popover(langPopover);

    const lblNotice = new Gtk.Label({ label: `* ${I18N.t("restart_required")}`, xalign: 0, margin_top: 6 });
    lblNotice.add_css_class("dim-label");

    pageLanguage.append(lblLangSelect);
    pageLanguage.append(langButton);
    pageLanguage.append(lblNotice);
    stack.add_named(pageLanguage, "language");

    /* =========================================================================
     * BUILD SIDEBAR ROWS (หลัง add_named ทุกหน้าเสร็จแล้วเพื่อให้สลับหน้าได้ทันที)
     * ========================================================================= */
    sidebarRow("preferences-system-symbolic", I18N.t("general"), "general");
    sidebarRow("preferences-desktop-theme-symbolic", I18N.t("appearance"), "appearance");
    sidebarRow("web-browser-symbolic", I18N.t("browsers"), "browsers");
    sidebarRow("preferences-desktop-locale-symbolic", I18N.t("language"), "language");

    sidebarList.connect("row-selected", (list, row) => {
        if (row && row._pageName) stack.set_visible_child_name(row._pageName);
    });

    if (firstSidebarRow) sidebarList.select_row(firstSidebarRow);
    stack.set_visible_child_name("general");

    /* =========================================================================
     * BOTTOM ACTION BUTTONS
     * ========================================================================= */
    const footerSeparator = new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL });
    const actionBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_top: 12, margin_bottom: 12, margin_start: 16, margin_end: 16,
        spacing: 8, halign: Gtk.Align.END
    });
    const btnCancel = new Gtk.Button({ label: I18N.t("cancel") });
    btnCancel.add_css_class("panel-btn");
    const btnSave = new Gtk.Button({ label: I18N.t("save") });
    btnSave.add_css_class("panel-btn");
    btnSave.add_css_class("suggested-action");

    outerBox.append(footerSeparator);
    outerBox.append(actionBox);
    actionBox.append(btnCancel);
    actionBox.append(btnSave);

    btnCancel.connect("clicked", () => win.close());

    btnSave.connect("clicked", () => {
        localConfig.always_ask = chkAlwaysAsk.get_active();
        localConfig.icon_size = spinIconSize.get_value_as_int();

        localConfig.language = selectedLanguageCode;

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
