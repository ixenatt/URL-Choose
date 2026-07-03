/*
 * i18n/index.js
 * GJS Classic Module - Dynamic Language Loader
 */

const { Gio, GLib } = imports.gi;

const LANGUAGES = {};
const LANGUAGE_NAMES = {
    en: "English",
    th: "ไทย",
    // คุณสามารถเพิ่มชื่อเต็มของภาษาอื่นๆ เผื่อไว้ตรงนี้ได้
};

let currentLanguage = "en";

/**
 * ฟังก์ชันสำหรับสแกนและโหลดไฟล์ภาษาอัตโนมัติ
 */
function _initLanguages() {
    try {
        // 1. หาตำแหน่งพาธปัจจุบันของโฟลเดอร์ i18n
        let currentDir = GLib.get_current_dir();
        let i18nDirPath = GLib.build_filenamev([currentDir, "i18n"]);
        let directory = Gio.File.new_for_path(i18nDirPath);

        // 2. สแกนหาไฟล์ในโฟลเดอร์
        let enumerator = directory.enumerate_children(
            "standard::name,standard::type",
            Gio.FileQueryInfoFlags.NONE,
            null
        );

        let fileInfo;
        while ((fileInfo = enumerator.next_file(null)) !== null) {
            let fileName = fileInfo.get_name();
            let fileType = fileInfo.get_file_type();

            // กรองเอาเฉพาะไฟล์ที่ลงท้ายด้วย .js และไม่ใช่ไฟล์ index.js เอง
            if (fileType === Gio.FileType.REGULAR && fileName.endsWith(".js") && fileName !== "index.js") {
                let langCode = fileName.slice(0, -3); // ตัด ".js" ออกเพื่อเอา Code เช่น "en", "th"
                let uppercaseCode = langCode.toUpperCase(); // เช่น "EN", "TH"

                // 3. โหลดโมดูลแบบ Dynamic ผ่าน GJS imports
                let module = imports.i18n[langCode];
                if (module && module[uppercaseCode]) {
                    LANGUAGES[langCode] = module[uppercaseCode];
                }
            }
        }
    } catch (e) {
        logError(e, "Error scanning i18n directory");
        // Fallback หากเกิดข้อผิดพลาดในการสแกนไฟล์
        LANGUAGES["en"] = {};
    }
}

// เรียกทำงานทันทีเมื่อโมดูลถูกโหลด
_initLanguages();

/**
 * Set current language
 */
function setLanguage(lang) {
    if (LANGUAGES[lang])
        currentLanguage = lang;
}

/**
 * Get current language
 */
function getLanguage() {
    return currentLanguage;
}

/**
 * Translate
 */
function t(key, lang = null) {
    const language = lang || currentLanguage;

    if (LANGUAGES[language] &&
        Object.prototype.hasOwnProperty.call(LANGUAGES[language], key))
        return LANGUAGES[language][key];

    // เจาะจงดึงจากภาษา 'en' เป็นค่าเริ่มต้น (Fallback) หากภาษาอื่นไม่มี Key นั้นๆ
    if (LANGUAGES["en"] && Object.prototype.hasOwnProperty.call(LANGUAGES["en"], key))
        return LANGUAGES["en"][key];

    return key;
}

/**
 * Supported languages (สร้างรายการภาษาไดนามิกตามไฟล์ที่สแกนเจอ)
 */
function getLanguages() {
    let list = [];
    for (let code in LANGUAGES) {
        list.push({
            code: code,
            name: LANGUAGE_NAMES[code] || code.toUpperCase() // ถ้าไม่มีชื่อเต็มในระบบ จะใช้ตัวย่อพิมพ์ใหญ่แทน
        });
    }
    // เรียงให้ภาษาอังกฤษ (en) อยู่ลำดับแรกเพื่อความสวยงาม
    return list.sort((a, b) => a.code === "en" ? -1 : b.code === "en" ? 1 : 0);
}

/**
 * Check language exists
 */
function hasLanguage(lang) {
    return LANGUAGES.hasOwnProperty(lang);
}

/**
 * Export
 */
var I18N = {
    t,
    setLanguage,
    getLanguage,
    getLanguages,
    hasLanguage
};