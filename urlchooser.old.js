#!/usr/bin/gjs

imports.gi.versions.Gtk = "4.0";

const { Gtk, Gio, GLib, Gdk, Pango } = imports.gi;

const CONFIG_DIR = GLib.build_filenamev([
    GLib.get_home_dir(),
    ".config/urlchooser"
]);

const CONFIG_FILE = CONFIG_DIR + "/config.json";
const APPLICATIONS_DIR = "/usr/share/applications";

const DEFAULT_ICON_SIZE = 32;
const MIN_ICON_SIZE = 16;
const MAX_ICON_SIZE = 96;

let config = {
    last_browser: null,
    always_ask: true,
    theme: "system",       // "system" | "light" | "dark"
    language: "en",        // see LANG_CODES below
    icon_size: DEFAULT_ICON_SIZE,
    browsers: []           // array of .desktop file paths, chosen order
};

// ---------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------

const LANG_CODES = ["en", "th"];
const LANG_NAMES = { en: "English", th: "ไทย (Thai)" };

const STRINGS = {
    en: {
        window_title: "Choose Browser",
        tooltip_settings: "Settings",
        tooltip_close: "Close",
        settings_title: "Settings",
        section_browsers: "Web Browsers",
        no_browsers_placeholder: "No browsers added yet",
        add_browser: "Add...",
        auto_detect: "Auto-detect",
        remove_browser_tooltip: "Remove from list",
        section_general: "General",
        set_default_button: "Set as Default Browser",
        always_ask: "Always ask before opening",
        section_appearance: "Appearance",
        theme_label: "Theme",
        theme_system: "System",
        theme_light: "Light",
        theme_dark: "Dark",
        icon_size_label: "Icon size",
        section_language: "Language",
        close: "Close",
        no_url_hint: "No URL was given on launch — showing settings instead.",
        pick_desktop_file_title: "Choose a browser .desktop file"
    },
    th: {
        window_title: "เลือกเบราว์เซอร์",
        tooltip_settings: "ตั้งค่า",
        tooltip_close: "ปิด",
        settings_title: "การตั้งค่า",
        section_browsers: "เว็บเบราว์เซอร์",
        no_browsers_placeholder: "ยังไม่มีเบราว์เซอร์ในรายการ",
        add_browser: "เพิ่ม...",
        auto_detect: "ค้นหาอัตโนมัติ",
        remove_browser_tooltip: "ลบออกจากรายการ",
        section_general: "ทั่วไป",
        set_default_button: "ตั้งค่าแอปนี้เป็น Default Browser",
        always_ask: "ถามทุกครั้งก่อนเปิดลิงก์",
        section_appearance: "รูปลักษณ์",
        theme_label: "ธีม",
        theme_system: "ตามระบบ",
        theme_light: "สว่าง",
        theme_dark: "มืด",
        icon_size_label: "ขนาดไอคอน",
        section_language: "ภาษา",
        close: "ปิด",
        no_url_hint: "ไม่พบ URL ตอนเปิดแอป จึงแสดงหน้าตั้งค่าแทน",
        pick_desktop_file_title: "เลือกไฟล์ .desktop ของเบราว์เซอร์"
    }
};

function t(key) {
    const lang = STRINGS[config.language] ? config.language : "en";
    return (STRINGS[lang][key] !== undefined) ? STRINGS[lang][key] : (STRINGS.en[key] || key);
}

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

function loadConfig() {
    try {
        if (GLib.file_test(CONFIG_FILE, GLib.FileTest.EXISTS)) {
            const [ok, contents] = GLib.file_get_contents(CONFIG_FILE);
            if (ok) {
                const loaded = JSON.parse(new TextDecoder().decode(contents));
                config = Object.assign({}, config, loaded);
            }
        }
    } catch (e) {
        log("Config load error: " + e);
    }

    if (!Array.isArray(config.browsers) || config.browsers.length === 0) {
        // First run (or corrupted list): seed with every installed app
        // that can handle http links.
        config.browsers = getAllHttpCapableApps()
            .map(info => info.get_filename())
            .filter(path => !!path);
        saveConfig();
    }

    if (!config.icon_size || config.icon_size < MIN_ICON_SIZE || config.icon_size > MAX_ICON_SIZE) {
        config.icon_size = DEFAULT_ICON_SIZE;
    }

    if (!["system", "light", "dark"].includes(config.theme)) {
        config.theme = "system";
    }

    if (!LANG_CODES.includes(config.language)) {
        config.language = "en";
    }
}

function saveConfig() {
    try {
        GLib.mkdir_with_parents(CONFIG_DIR, 0o755);
        GLib.file_set_contents(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (e) {
        log("Config save error: " + e);
    }
}

// ---------------------------------------------------------------------
// Desktop app / browser helpers
// ---------------------------------------------------------------------

function getAllHttpCapableApps() {
    const infos = Gio.AppInfo.get_all();
    const browsers = [];

    for (const info of infos) {
        try {
            if (info.supports_type("x-scheme-handler/http")) {
                browsers.push(info);
            }
        } catch (_) {}
    }

    return browsers;
}

function loadDesktopInfo(path) {
    try {
        if (!GLib.file_test(path, GLib.FileTest.EXISTS)) return null;
        return Gio.DesktopAppInfo.new_from_filename(path);
    } catch (e) {
        return null;
    }
}

// Returns [{ path, info }] for every configured browser whose .desktop
// file still exists. Silently drops (and persists the drop of) any
// entries that have gone missing.
function getConfiguredBrowsers() {
    const result = [];
    let changed = false;

    for (const path of config.browsers) {
        const info = loadDesktopInfo(path);
        if (info) {
            result.push({ path, info });
        } else {
            changed = true;
        }
    }

    if (changed) {
        config.browsers = result.map(b => b.path);
        saveConfig();
    }

    return result;
}

// Scans /usr/share/applications for .desktop files whose Categories
// list includes "WebBrowser" (per the freedesktop menu spec, browsers
// declare e.g. Categories=Network;WebBrowser;). Returns [{ path, info }].
function scanForBrowserDesktopFiles() {
    const found = [];

    if (!GLib.file_test(APPLICATIONS_DIR, GLib.FileTest.IS_DIR)) {
        return found;
    }

    try {
        const dir = Gio.File.new_for_path(APPLICATIONS_DIR);
        const enumerator = dir.enumerate_children(
            "standard::name,standard::type",
            Gio.FileQueryInfoFlags.NONE,
            null
        );

        let fileInfo;
        while ((fileInfo = enumerator.next_file(null)) !== null) {
            const name = fileInfo.get_name();
            if (!name.endsWith(".desktop")) continue;

            const path = GLib.build_filenamev([APPLICATIONS_DIR, name]);
            const appInfo = loadDesktopInfo(path);
            if (!appInfo) continue;

            const categories = appInfo.get_categories();
            if (categories && categories.includes("WebBrowser")) {
                found.push({ path, info: appInfo });
            }
        }
        enumerator.close(null);
    } catch (e) {
        log("Scan error: " + e);
    }

    return found;
}

function openBrowser(info, url) {
    try {
        info.launch_uris([url], null);
    } catch (e) {
        log("Launch error: " + e);
    }
}

function setAsDefault() {
    const desktop = "urlchooser.desktop";

    GLib.spawn_command_line_async(
        `xdg-mime default ${desktop} x-scheme-handler/http`
    );

    GLib.spawn_command_line_async(
        `xdg-mime default ${desktop} x-scheme-handler/https`
    );
}

// ---------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------

function resolveDark() {
    if (config.theme === "dark") return true;
    if (config.theme === "light") return false;
    const settings = Gtk.Settings.get_default();
    return !!settings.gtk_application_prefer_dark_theme;
}

function applyGtkThemePreference() {
    const settings = Gtk.Settings.get_default();
    if (config.theme === "dark") {
        settings.gtk_application_prefer_dark_theme = true;
    } else if (config.theme === "light") {
        settings.gtk_application_prefer_dark_theme = false;
    }
    // "system": leave whatever the session/portal already set.
}

// Panels registered here get their theme class refreshed whenever the
// user changes the theme setting from any open settings window.
const styledPanels = new Set();

function registerThemedPanel(panel) {
    styledPanels.add(panel);
    applyThemeClass(panel);
}

function applyThemeClass(panel) {
    const dark = resolveDark();
    panel.remove_css_class("theme-dark");
    panel.remove_css_class("theme-light");
    panel.add_css_class(dark ? "theme-dark" : "theme-light");
}

function refreshAllThemedPanels() {
    applyGtkThemePreference();
    for (const panel of styledPanels) {
        applyThemeClass(panel);
    }
}

// ---------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------

const CSS = `
window {
    background-color: transparent;
}

.root-panel {
    border-radius: 16px;
    padding: 8px;
}

.theme-dark.root-panel {
    background-color: rgba(28, 30, 36, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    color: #eceff4;
}

.theme-light.root-panel {
    background-color: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    color: #202225;
}

.icon-btn {
    border-radius: 12px;
    padding: 6px;
    background: transparent;
    border: none;
    min-width: 0;
    min-height: 0;
    transition: background 150ms ease;
}

.theme-dark .icon-btn:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

.theme-light .icon-btn:hover {
    background-color: rgba(0, 0, 0, 0.07);
}

.icon-btn.close-btn:hover {
    background-color: rgba(224, 66, 56, 0.9);
    color: white;
}

.panel-separator {
    min-width: 1px;
    margin: 4px 4px;
    opacity: 0.35;
}

.settings-title {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 2px;
}

.settings-section-label {
    font-weight: 600;
    font-size: 12px;
    opacity: 0.6;
    letter-spacing: 0.3px;
}

.settings-card {
    border-radius: 12px;
    padding: 12px;
}

.theme-dark .settings-card {
    background-color: rgba(255, 255, 255, 0.045);
}

.theme-light .settings-card {
    background-color: rgba(0, 0, 0, 0.03);
}

.browser-row {
    padding: 4px 4px;
    border-radius: 8px;
}

.browser-row:hover {
    background-color: alpha(currentColor, 0.06);
}

.placeholder-label {
    opacity: 0.55;
    font-style: italic;
    padding: 10px 4px;
}

.pill-button {
    border-radius: 9px;
    padding: 6px 12px;
}

.settings-close-button {
    border-radius: 10px;
    padding: 8px 12px;
    font-weight: 600;
}

listbox {
    background: transparent;
}

listboxrow {
    background: transparent;
    padding: 0;
}
`;

function installCss() {
    const provider = new Gtk.CssProvider();
    provider.load_from_data(CSS, -1);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
}

// ---------------------------------------------------------------------
// File picker for adding a browser (.desktop file)
// ---------------------------------------------------------------------

function pickDesktopFile(parentWin, onChosen) {
    const dialog = new Gtk.FileDialog({
        title: t("pick_desktop_file_title"),
        modal: true
    });

    const filter = new Gtk.FileFilter();
    filter.set_name("Desktop Entry (*.desktop)");
    filter.add_pattern("*.desktop");

    const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });
    filters.append(filter);
    dialog.set_filters(filters);
    dialog.set_default_filter(filter);

    if (GLib.file_test(APPLICATIONS_DIR, GLib.FileTest.IS_DIR)) {
        dialog.set_initial_folder(Gio.File.new_for_path(APPLICATIONS_DIR));
    }

    dialog.open(parentWin, null, (source, res) => {
        try {
            const file = dialog.open_finish(res);
            if (file) {
                onChosen(file.get_path());
            }
        } catch (e) {
            // user cancelled, or an error occurred - nothing to do
        }
    });
}

// ---------------------------------------------------------------------
// Main chooser window
// ---------------------------------------------------------------------

function createChooserWindow(app, url) {

    const win = new Gtk.ApplicationWindow({
        application: app,
        title: t("window_title"),
        decorated: false,
        resizable: false
    });
    win.add_css_class("transparent-window");

    const escController = new Gtk.EventControllerKey();
    escController.connect("key-pressed", (_c, keyval) => {
        if (keyval === Gdk.KEY_Escape) {
            app.quit();
            return true;
        }
        return false;
    });
    win.add_controller(escController);

    const rootPanel = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 4
    });
    rootPanel.add_css_class("root-panel");
    registerThemedPanel(rootPanel);

    function buildIconButton(iconName, tooltip, cssClass) {
        const image = Gtk.Image.new_from_icon_name(iconName);
        image.set_pixel_size(config.icon_size);

        const btn = new Gtk.Button({ child: image, tooltip_text: tooltip });
        btn.add_css_class("icon-btn");
        if (cssClass) btn.add_css_class(cssClass);
        return btn;
    }

    function rebuild() {
        let child = rootPanel.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            rootPanel.remove(child);
            child = next;
        }

        const browsers = getConfiguredBrowsers();

        for (const { info } of browsers) {
            const image = new Gtk.Image();
            const gicon = info.get_icon();
            if (gicon) {
                image.set_from_gicon(gicon);
            } else {
                image.set_from_icon_name("web-browser-symbolic");
            }
            image.set_pixel_size(config.icon_size);

            const btn = new Gtk.Button({
                child: image,
                tooltip_text: info.get_display_name()
            });
            btn.add_css_class("icon-btn");

            btn.connect("clicked", () => {
                config.last_browser = info.get_display_name();
                saveConfig();
                openBrowser(info, url);
                app.quit();
            });

            rootPanel.append(btn);
        }

        const sep = new Gtk.Separator({ orientation: Gtk.Orientation.VERTICAL });
        sep.add_css_class("panel-separator");
        rootPanel.append(sep);

        const settingsBtn = buildIconButton(
            "preferences-system-symbolic",
            t("tooltip_settings"),
            null
        );
        settingsBtn.connect("clicked", () => {
            openSettings(app, win, rebuild);
        });
        rootPanel.append(settingsBtn);

        const closeBtn = buildIconButton(
            "window-close-symbolic",
            t("tooltip_close"),
            "close-btn"
        );
        closeBtn.connect("clicked", () => app.quit());
        rootPanel.append(closeBtn);
    }

    rebuild();

    win.set_child(rootPanel);
    win.present();
}

// ---------------------------------------------------------------------
// Settings window
// ---------------------------------------------------------------------

// parentWin: pass a Gtk.Window to open as a transient modal dialog, or
// null to open as a standalone top-level window (used when the app is
// launched with no URL at all).
function openSettings(app, parentWin, onChangedCallback) {

    const standalone = !parentWin;

    const win = standalone
        ? new Gtk.ApplicationWindow({
            application: app,
            title: t("settings_title"),
            decorated: false,
            resizable: false,
            default_width: 420
        })
        : new Gtk.Window({
            title: t("settings_title"),
            transient_for: parentWin,
            modal: true,
            decorated: false,
            resizable: false,
            default_width: 420
        });
    win.add_css_class("transparent-window");

    const escController = new Gtk.EventControllerKey();
    escController.connect("key-pressed", (_c, keyval) => {
        if (keyval === Gdk.KEY_Escape) {
            if (standalone) app.quit(); else win.close();
            return true;
        }
        return false;
    });
    win.add_controller(escController);

    const panel = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 14,
        margin_top: 18,
        margin_bottom: 18,
        margin_start: 18,
        margin_end: 18
    });
    panel.add_css_class("root-panel");
    registerThemedPanel(panel);

    win.connect("close-request", () => {
        styledPanels.delete(panel);
        if (standalone && !win._rebuilding) app.quit();
        return false;
    });

    function sectionHeader(iconName, text) {
        const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 6 });
        const icon = Gtk.Image.new_from_icon_name(iconName);
        icon.set_pixel_size(13);
        icon.set_opacity(0.6);
        const label = new Gtk.Label({ label: text, xalign: 0 });
        label.add_css_class("settings-section-label");
        box.append(icon);
        box.append(label);
        return box;
    }

    function makeCard() {
        const card = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10
        });
        card.add_css_class("settings-card");
        return card;
    }

    // --- Title -----------------------------------------------------------

    const title = new Gtk.Label({ label: t("settings_title"), xalign: 0 });
    title.add_css_class("settings-title");
    panel.append(title);

    if (standalone) {
        const hint = new Gtk.Label({
            label: t("no_url_hint"),
            xalign: 0,
            wrap: true
        });
        hint.add_css_class("placeholder-label");
        panel.append(hint);
    }

    // --- Browsers card -----------------------------------------------------

    const browsersCard = makeCard();
    browsersCard.append(sectionHeader("web-browser-symbolic", t("section_browsers")));

    const scroller = new Gtk.ScrolledWindow({
        min_content_height: 150,
        max_content_height: 210,
        hscrollbar_policy: Gtk.PolicyType.NEVER
    });

    const listBox = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.NONE });
    scroller.set_child(listBox);
    browsersCard.append(scroller);

    function refreshListBox() {
        let child = listBox.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            listBox.remove(child);
            child = next;
        }

        const browsers = getConfiguredBrowsers();

        if (browsers.length === 0) {
            const placeholder = new Gtk.Label({
                label: t("no_browsers_placeholder"),
                xalign: 0
            });
            placeholder.add_css_class("placeholder-label");
            const row = new Gtk.ListBoxRow({ selectable: false, activatable: false });
            row.set_child(placeholder);
            listBox.append(row);
            return;
        }

        for (const { path, info } of browsers) {
            const row = new Gtk.ListBoxRow({ selectable: false, activatable: false });
            const rowBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8
            });
            rowBox.add_css_class("browser-row");

            const icon = new Gtk.Image();
            const rowGicon = info.get_icon();
            if (rowGicon) {
                icon.set_from_gicon(rowGicon);
            } else {
                icon.set_from_icon_name("web-browser-symbolic");
            }
            icon.set_pixel_size(22);

            const label = new Gtk.Label({
                label: info.get_display_name(),
                xalign: 0,
                hexpand: true,
                ellipsize: Pango.EllipsizeMode.END
            });

            const removeBtn = new Gtk.Button();
            const removeIcon = Gtk.Image.new_from_icon_name("list-remove-symbolic");
            removeBtn.set_child(removeIcon);
            removeBtn.add_css_class("icon-btn");
            removeBtn.set_tooltip_text(t("remove_browser_tooltip"));

            removeBtn.connect("clicked", () => {
                config.browsers = config.browsers.filter(p => p !== path);
                saveConfig();
                refreshListBox();
                if (onChangedCallback) onChangedCallback();
            });

            rowBox.append(icon);
            rowBox.append(label);
            rowBox.append(removeBtn);

            row.set_child(rowBox);
            listBox.append(row);
        }
    }

    refreshListBox();

    const browserButtonsRow = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 8,
        homogeneous: true
    });

    const addBtn = new Gtk.Button({ label: t("add_browser") });
    addBtn.add_css_class("pill-button");
    addBtn.connect("clicked", () => {
        pickDesktopFile(win, (path) => {
            const info = loadDesktopInfo(path);
            if (!info) return;
            if (!config.browsers.includes(path)) {
                config.browsers.push(path);
                saveConfig();
                refreshListBox();
                if (onChangedCallback) onChangedCallback();
            }
        });
    });

    const autoDetectBtn = new Gtk.Button({ label: t("auto_detect") });
    autoDetectBtn.add_css_class("pill-button");
    autoDetectBtn.add_css_class("suggested-action");
    autoDetectBtn.connect("clicked", () => {
        const found = scanForBrowserDesktopFiles();
        let added = false;
        for (const { path } of found) {
            if (!config.browsers.includes(path)) {
                config.browsers.push(path);
                added = true;
            }
        }
        if (added) {
            saveConfig();
            refreshListBox();
            if (onChangedCallback) onChangedCallback();
        }
    });

    browserButtonsRow.append(addBtn);
    browserButtonsRow.append(autoDetectBtn);
    browsersCard.append(browserButtonsRow);

    panel.append(browsersCard);

    // --- General card --------------------------------------------------

    const generalCard = makeCard();
    generalCard.append(sectionHeader("emblem-default-symbolic", t("section_general")));

    const btnSetDefault = new Gtk.Button({ label: t("set_default_button") });
    btnSetDefault.add_css_class("pill-button");
    btnSetDefault.connect("clicked", () => setAsDefault());
    generalCard.append(btnSetDefault);

    const toggleAsk = new Gtk.CheckButton({
        label: t("always_ask"),
        active: config.always_ask
    });
    toggleAsk.connect("toggled", () => {
        config.always_ask = toggleAsk.active;
        saveConfig();
    });
    generalCard.append(toggleAsk);

    panel.append(generalCard);

    // --- Appearance card -------------------------------------------------

    const appearanceCard = makeCard();
    appearanceCard.append(sectionHeader("preferences-desktop-theme-symbolic", t("section_appearance")));

    const themeRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
    const themeLabel = new Gtk.Label({ label: t("theme_label"), xalign: 0, hexpand: true });
    const themeMap = ["system", "light", "dark"];
    const themeModel = Gtk.StringList.new([t("theme_system"), t("theme_light"), t("theme_dark")]);
    const themeDropDown = new Gtk.DropDown({ model: themeModel });
    themeDropDown.set_selected(Math.max(0, themeMap.indexOf(config.theme)));
    themeDropDown.connect("notify::selected", () => {
        config.theme = themeMap[themeDropDown.selected];
        saveConfig();
        refreshAllThemedPanels();
    });
    themeRow.append(themeLabel);
    themeRow.append(themeDropDown);
    appearanceCard.append(themeRow);

    const iconLabel = new Gtk.Label({ label: t("icon_size_label"), xalign: 0 });
    appearanceCard.append(iconLabel);

    const iconAdjustment = new Gtk.Adjustment({
        value: config.icon_size,
        lower: MIN_ICON_SIZE,
        upper: MAX_ICON_SIZE,
        step_increment: 4,
        page_increment: 8
    });
    const iconScale = new Gtk.Scale({
        orientation: Gtk.Orientation.HORIZONTAL,
        adjustment: iconAdjustment,
        digits: 0,
        hexpand: true,
        draw_value: true,
        value_pos: Gtk.PositionType.RIGHT
    });
    iconScale.connect("value-changed", () => {
        config.icon_size = Math.round(iconAdjustment.value);
        saveConfig();
        if (onChangedCallback) onChangedCallback();
    });
    appearanceCard.append(iconScale);

    panel.append(appearanceCard);

    // --- Language card -----------------------------------------------------

    const languageCard = makeCard();
    languageCard.append(sectionHeader("preferences-desktop-locale-symbolic", t("section_language")));

    const langRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
    const langNamesList = LANG_CODES.map(code => LANG_NAMES[code] || code);
    const langModel = Gtk.StringList.new(langNamesList);
    const langDropDown = new Gtk.DropDown({ model: langModel, hexpand: true });
    langDropDown.set_selected(Math.max(0, LANG_CODES.indexOf(config.language)));
    langDropDown.connect("notify::selected", () => {
        const newLang = LANG_CODES[langDropDown.selected];
        if (newLang === config.language) return;
        config.language = newLang;
        saveConfig();
        if (onChangedCallback) onChangedCallback();
        win._rebuilding = true;
        win.close();
        openSettings(app, parentWin, onChangedCallback);
    });
    langRow.append(langDropDown);
    languageCard.append(langRow);

    panel.append(languageCard);

    // --- Close ---------------------------------------------------------

    const btnClose = new Gtk.Button({ label: t("close") });
    btnClose.add_css_class("settings-close-button");
    btnClose.connect("clicked", () => {
        if (standalone) app.quit(); else win.close();
    });
    panel.append(btnClose);

    win.set_child(panel);
    win.present();
}

// ---------------------------------------------------------------------
// App entry point
// ---------------------------------------------------------------------

const app = new Gtk.Application({
    application_id: "com.example.urlchooser"
});

app.connect("startup", () => {
    installCss();
});

app.connect("activate", () => {

    loadConfig();
    applyGtkThemePreference();

    const url = ARGV[0];

    if (!url) {
        // No URL was passed on launch - open Settings directly instead
        // of showing an error, so the app is still useful when opened
        // manually (e.g. from an application launcher).
        openSettings(app, null, null);
        return;
    }

    // ถ้าไม่ต้องถาม -> ใช้ default browser เลย
    if (!config.always_ask) {

        const def = Gio.AppInfo.get_default_for_uri_scheme("http");

        if (def) {
            def.launch_uris([url], null);
        }

        app.quit();
        return;
    }

    createChooserWindow(app, url);
});

app.run([]);
