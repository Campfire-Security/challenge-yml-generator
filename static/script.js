let instanceCounter = 0;
let flagCounter = 0;
let answerCounter = 0;
let translationCounter = 0;
let previewYamlData = null;

// Predefined answer keys for multiple choice
const answerKeys = ['answer-1', 'answer-2', 'answer-3', 'answer-4', 'answer-5'];

// Helper function to create label with info icon
function createLabelWithInfo(labelText, helpText) {
    const safeLabel = escapeHtml(labelText);
    // Process help text to format flag examples properly - wrap flag strings in spans to prevent wrapping
    let processedHelp = escapeHtml(helpText);
    // Replace bullet points followed by flag examples with formatted spans that don't wrap
    // Match pattern: bullet point, optional space, then flag pattern
    processedHelp = processedHelp.replace(/(•\s*)(FIRE\{[^}]+\}|DDC\{[^}]+\})/g, (match, bullet, flag) => {
        return '<div style="margin: 6px 0; line-height: 1.6;">' + bullet + '<span class="flag-example">' + flag + '</span></div>';
    });

    return `
        <label>
            ${safeLabel}
            <span class="info-icon" onclick="this.classList.toggle('active')" onmouseleave="this.classList.remove('active')">
                i
                <span class="tooltip">${processedHelp}</span>
            </span>
        </label>
    `;
}

// Security: Input sanitization functions
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // Remove null bytes and control characters (except newlines and tabs for textareas)
    return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function sanitizeForAttribute(value) {
    return escapeHtml(sanitizeInput(value));
}

function sanitizeForText(value) {
    return sanitizeInput(value);
}

function sanitizeForYaml(value) {
    if (typeof value !== 'string') {
        return '';
    }
    // Remove null bytes and dangerous control characters
    // Allow newlines and tabs for multi-line YAML content
    return value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

// Custom alert function
function showAlert(message, title = 'Alert') {
    const alertModal = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');

    // Sanitize inputs before displaying
    alertTitle.textContent = sanitizeForText(title);
    alertMessage.textContent = sanitizeForText(message);
    alertModal.style.display = 'block';
}

function closeAlert() {
    const alertModal = document.getElementById('customAlert');
    alertModal.style.display = 'none';
}

// Custom confirm function
let confirmCallback = null;

function showConfirm(message, title = 'Confirm', callback) {
    const confirmModal = document.getElementById('customConfirm');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');

    // Sanitize inputs before displaying
    confirmTitle.textContent = sanitizeForText(title);
    confirmMessage.textContent = sanitizeForText(message);
    confirmCallback = callback;
    confirmModal.style.display = 'block';
}

function confirmAction(result) {
    const confirmModal = document.getElementById('customConfirm');
    confirmModal.style.display = 'none';
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// Close modals when clicking outside or pressing Escape
document.addEventListener('DOMContentLoaded', function () {
    const alertModal = document.getElementById('customAlert');
    const confirmModal = document.getElementById('customConfirm');

    if (alertModal) {
        alertModal.addEventListener('click', function (event) {
            if (event.target === alertModal) {
                closeAlert();
            }
        });
    }

    if (confirmModal) {
        confirmModal.addEventListener('click', function (event) {
            if (event.target === confirmModal) {
                confirmAction(false);
            }
        });
    }

    // Close modals on Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (alertModal && alertModal.style.display === 'block') {
                closeAlert();
            }
            if (confirmModal && confirmModal.style.display === 'block') {
                confirmAction(false);
            }
        }
    });
});

// Category prefixes
const categoryPrefixes = {
    "Starters": "st_",
    "Forensics": "fr_",
    "Web exploitation": "we_",
    "Cryptography": "cry_",
    "Boot 2 Root": "b2r_",
    "Reverse Engineering": "re_",
    "Binary (PWN)": "bn_",
    "Misc": "mi_",
    "Operational Technologies": "ot_",
};

// ISO-639-1 Language codes
const LANGUAGES = [
    { code: "aa", name: "Afar", nativeName: "Afaraf" },
    { code: "ab", name: "Abkhaz", nativeName: "Аҧсуа бызшәа" },
    { code: "ae", name: "Avestan", nativeName: "Avesta" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
    { code: "ak", name: "Akan", nativeName: "Akan" },
    { code: "am", name: "Amharic", nativeName: "አማርኛ" },
    { code: "an", name: "Aragonese", nativeName: "Aragonés" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
    { code: "av", name: "Avaric", nativeName: "Авар мацӀ" },
    { code: "ay", name: "Aymara", nativeName: "Aymar aru" },
    { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan dili" },
    { code: "ba", name: "Bashkir", nativeName: "Башҡорт теле" },
    { code: "be", name: "Belarusian", nativeName: "Беларуская" },
    { code: "bg", name: "Bulgarian", nativeName: "Български език" },
    { code: "bi", name: "Bislama", nativeName: "Bislama" },
    { code: "bm", name: "Bambara", nativeName: "Bamanankan" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "bo", name: "Tibetan", nativeName: "བོད་ཡིག" },
    { code: "br", name: "Breton", nativeName: "Brezhoneg" },
    { code: "bs", name: "Bosnian", nativeName: "Bosanski jezik" },
    { code: "ca", name: "Catalan", nativeName: "Català" },
    { code: "ce", name: "Chechen", nativeName: "Нохчийн мотт" },
    { code: "ch", name: "Chamorro", nativeName: "Chamoru" },
    { code: "co", name: "Corsican", nativeName: "Corsu" },
    { code: "cr", name: "Cree", nativeName: "ᓀᐦᐃᔭᐍᐏᐣ" },
    { code: "cs", name: "Czech", nativeName: "Čeština" },
    { code: "cu", name: "Old Church Slavonic", nativeName: "Ѩзыкъ словѣньскъ" },
    { code: "cv", name: "Chuvash", nativeName: "Чӑваш чӗлхи" },
    { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
    { code: "da", name: "Danish", nativeName: "Dansk" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "dv", name: "Divehi", nativeName: "Dhivehi" },
    { code: "dz", name: "Dzongkha", nativeName: "རྫོང་ཁ" },
    { code: "ee", name: "Ewe", nativeName: "Eʋegbe" },
    { code: "el", name: "Greek", nativeName: "Ελληνικά" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "eo", name: "Esperanto", nativeName: "Esperanto" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "et", name: "Estonian", nativeName: "Eesti" },
    { code: "eu", name: "Basque", nativeName: "Euskara" },
    { code: "fa", name: "Persian", nativeName: "فارسی" },
    { code: "ff", name: "Fula", nativeName: "Fulfulde" },
    { code: "fi", name: "Finnish", nativeName: "Suomi" },
    { code: "fj", name: "Fijian", nativeName: "Vosa Vakaviti" },
    { code: "fo", name: "Faroese", nativeName: "Føroyskt" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "fy", name: "Western Frisian", nativeName: "Frysk" },
    { code: "ga", name: "Irish", nativeName: "Gaeilge" },
    { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig" },
    { code: "gl", name: "Galician", nativeName: "Galego" },
    { code: "gn", name: "Guaraní", nativeName: "Avañe'ẽ" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "gv", name: "Manx", nativeName: "Gaelg" },
    { code: "ha", name: "Hausa", nativeName: "Hausa" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "ho", name: "Hiri Motu", nativeName: "Hiri Motu" },
    { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
    { code: "ht", name: "Haitian", nativeName: "Kreyòl ayisyen" },
    { code: "hu", name: "Hungarian", nativeName: "Magyar" },
    { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
    { code: "hz", name: "Herero", nativeName: "Otjiherero" },
    { code: "ia", name: "Interlingua", nativeName: "Interlingua" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
    { code: "ie", name: "Interlingue", nativeName: "Interlingue" },
    { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo" },
    { code: "ii", name: "Nuosu", nativeName: "ꆈꌠ꒿ Nuosuhxop" },
    { code: "ik", name: "Inupiaq", nativeName: "Iñupiaq" },
    { code: "io", name: "Ido", nativeName: "Ido" },
    { code: "is", name: "Icelandic", nativeName: "Íslenska" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "iu", name: "Inuktitut", nativeName: "ᐃᓄᒃᑎᑐᑦ" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "jv", name: "Javanese", nativeName: "Basa Jawa" },
    { code: "ka", name: "Georgian", nativeName: "ქართული" },
    { code: "kg", name: "Kongo", nativeName: "KiKongo" },
    { code: "ki", name: "Kikuyu", nativeName: "Gĩkũyũ" },
    { code: "kj", name: "Kwanyama", nativeName: "Kuanyama" },
    { code: "kk", name: "Kazakh", nativeName: "Қазақ тілі" },
    { code: "kl", name: "Kalaallisut", nativeName: "Kalaallisut" },
    { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "kr", name: "Kanuri", nativeName: "Kanuri" },
    { code: "ks", name: "Kashmiri", nativeName: "कश्मीरी" },
    { code: "ku", name: "Kurdish", nativeName: "Kurdî" },
    { code: "kv", name: "Komi", nativeName: "Коми кыв" },
    { code: "kw", name: "Cornish", nativeName: "Kernewek" },
    { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча" },
    { code: "la", name: "Latin", nativeName: "Latīna" },
    { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch" },
    { code: "lg", name: "Ganda", nativeName: "Luganda" },
    { code: "li", name: "Limburgish", nativeName: "Limburgs" },
    { code: "ln", name: "Lingala", nativeName: "Lingála" },
    { code: "lo", name: "Lao", nativeName: "ພາສາລາວ" },
    { code: "lt", name: "Lithuanian", nativeName: "Lietuvių kalba" },
    { code: "lu", name: "Luba-Katanga", nativeName: "Kiluba" },
    { code: "lv", name: "Latvian", nativeName: "Latviešu valoda" },
    { code: "mg", name: "Malagasy", nativeName: "Fiteny malagasy" },
    { code: "mh", name: "Marshallese", nativeName: "Kajin M̧ajeļ" },
    { code: "mi", name: "Māori", nativeName: "Te reo Māori" },
    { code: "mk", name: "Macedonian", nativeName: "Македонски јазик" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "mn", name: "Mongolian", nativeName: "Монгол" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "mt", name: "Maltese", nativeName: "Malti" },
    { code: "my", name: "Burmese", nativeName: "ဗမာစာ" },
    { code: "na", name: "Nauru", nativeName: "Ekakairũ Naoero" },
    { code: "nb", name: "Norwegian Bokmål", nativeName: "Norsk bokmål" },
    { code: "nd", name: "Northern Ndebele", nativeName: "isiNdebele" },
    { code: "ne", name: "Nepali", nativeName: "नेपाली" },
    { code: "ng", name: "Ndonga", nativeName: "Owambo" },
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
    { code: "nn", name: "Norwegian Nynorsk", nativeName: "Norsk nynorsk" },
    { code: "no", name: "Norwegian", nativeName: "Norsk" },
    { code: "nr", name: "Southern Ndebele", nativeName: "isiNdebele" },
    { code: "nv", name: "Navajo", nativeName: "Diné bizaad" },
    { code: "ny", name: "Chichewa", nativeName: "ChiCheŵa" },
    { code: "oc", name: "Occitan", nativeName: "Occitan" },
    { code: "oj", name: "Ojibwe", nativeName: "ᐊᓂᔑᓈᐯᒧᐎᓐ" },
    { code: "om", name: "Oromo", nativeName: "Afaan Oromoo" },
    { code: "or", name: "Oriya", nativeName: "ଓଡ଼ିଆ" },
    { code: "os", name: "Ossetian", nativeName: "Ирон æвзаг" },
    { code: "pa", name: "Panjabi", nativeName: "ਪੰਜਾਬੀ" },
    { code: "pi", name: "Pāli", nativeName: "पाऴि" },
    { code: "pl", name: "Polish", nativeName: "Polski" },
    { code: "ps", name: "Pashto", nativeName: "پښتو" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "qu", name: "Quechua", nativeName: "Runa Simi" },
    { code: "rm", name: "Romansh", nativeName: "Rumantsch grischun" },
    { code: "rn", name: "Kirundi", nativeName: "Ikirundi" },
    { code: "ro", name: "Romanian", nativeName: "Română" },
    { code: "ru", name: "Russian", nativeName: "Русский язык" },
    { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda" },
    { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
    { code: "sc", name: "Sardinian", nativeName: "Sardu" },
    { code: "sd", name: "Sindhi", nativeName: "सिन्धी" },
    { code: "se", name: "Northern Sami", nativeName: "Davvisámegiella" },
    { code: "sg", name: "Sango", nativeName: "Yângâ tî sängö" },
    { code: "si", name: "Sinhala", nativeName: "සිංහල" },
    { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
    { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
    { code: "sm", name: "Samoan", nativeName: "Gagana fa'a Samoa" },
    { code: "sn", name: "Shona", nativeName: "ChiShona" },
    { code: "so", name: "Somali", nativeName: "Soomaaliga" },
    { code: "sq", name: "Albanian", nativeName: "Shqip" },
    { code: "sr", name: "Serbian", nativeName: "Српски језик" },
    { code: "ss", name: "Swati", nativeName: "SiSwati" },
    { code: "st", name: "Southern Sotho", nativeName: "Sesotho" },
    { code: "su", name: "Sundanese", nativeName: "Basa Sunda" },
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
    { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ" },
    { code: "th", name: "Thai", nativeName: "ไทย" },
    { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ" },
    { code: "tk", name: "Turkmen", nativeName: "Türkmen" },
    { code: "tl", name: "Tagalog", nativeName: "Wikang Tagalog" },
    { code: "tn", name: "Tswana", nativeName: "Setswana" },
    { code: "to", name: "Tonga", nativeName: "Faka Tonga" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "ts", name: "Tsonga", nativeName: "Xitsonga" },
    { code: "tt", name: "Tatar", nativeName: "Татарча" },
    { code: "tw", name: "Twi", nativeName: "Twi" },
    { code: "ty", name: "Tahitian", nativeName: "Reo Tahiti" },
    { code: "ug", name: "Uyghur", nativeName: "ئۇيغۇرچە" },
    { code: "uk", name: "Ukrainian", nativeName: "Українська" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "uz", name: "Uzbek", nativeName: "Oʻzbek" },
    { code: "ve", name: "Venda", nativeName: "Tshivenḓa" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { code: "vo", name: "Volapük", nativeName: "Volapük" },
    { code: "wa", name: "Walloon", nativeName: "Walon" },
    { code: "wo", name: "Wolof", nativeName: "Wollof" },
    { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
    { code: "yi", name: "Yiddish", nativeName: "ייִדיש" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
    { code: "za", name: "Zhuang", nativeName: "Saɯ cueŋƅ" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu" }
];

// Validation functions
function validateChallengeName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: "Challenge name is required. Expected: letters, numbers, spaces, hyphens, and underscores only." };
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
        return { valid: false, error: "Challenge name format is invalid. Expected: letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), and underscores (_) only. No special characters allowed." };
    }
    return { valid: true };
}

function validateTag(tag) {
    if (!tag || tag.trim().length === 0) {
        return { valid: false, error: "Tag is required. Expected: lowercase letters, numbers, hyphens, and underscores only." };
    }
    if (!/^[a-z0-9\-_]+$/.test(tag)) {
        return { valid: false, error: "Tag format is invalid. Expected: lowercase letters (a-z), numbers (0-9), hyphens (-), and underscores (_) only. No uppercase letters, spaces, or special characters allowed." };
    }
    return { valid: true };
}

function validateFlagTag(flagTag) {
    if (!flagTag || flagTag.trim().length === 0) {
        return { valid: false, error: "Flag tag is required. Expected: lowercase letters, numbers, hyphens, and underscores only." };
    }
    if (!/^[a-z0-9\-_]+$/.test(flagTag)) {
        return { valid: false, error: "Flag tag format is invalid. Expected: lowercase letters (a-z), numbers (0-9), hyphens (-), and underscores (_) only. No uppercase letters, spaces, or special characters allowed." };
    }
    return { valid: true };
}

function validateFlagStatic(flagStatic) {
    if (!flagStatic || flagStatic.trim().length === 0) {
        return { valid: false, error: "Flag value is required. Expected format: FIRE{...} or DDC{...} with 6-50 characters inside the braces." };
    }

    const trimmed = flagStatic.trim();

    // Check for FIRE{...} or DDC{...} format
    const firePattern = /^FIRE\{[a-zA-Z0-9\-_]{6,50}\}$/;
    const ddcPattern = /^DDC\{[a-zA-Z0-9\-_]{6,50}\}$/;

    if (!firePattern.test(trimmed) && !ddcPattern.test(trimmed)) {
        // Provide detailed error message
        if (!trimmed.startsWith('FIRE{') && !trimmed.startsWith('DDC{')) {
            return { valid: false, error: "Flag value format is invalid. Expected: Must start with 'FIRE{' or 'DDC{' (e.g., FIRE{example_flag_123456} or DDC{example_flag_123456})." };
        }
        if (!trimmed.endsWith('}')) {
            return { valid: false, error: "Flag value format is invalid. Expected: Must end with '}' (e.g., FIRE{example_flag_123456} or DDC{example_flag_123456})." };
        }

        // Extract content between braces
        const match = trimmed.match(/^(FIRE|DDC)\{([^}]*)\}$/);
        if (match) {
            const content = match[2];
            if (content.length < 6) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces must be 6-50 characters long. Current length: " + content.length + " characters. Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
            if (content.length > 50) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces must be 6-50 characters long. Current length: " + content.length + " characters. Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
            if (!/^[a-zA-Z0-9\-_]+$/.test(content)) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces can only contain letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_). Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
        }

        return { valid: false, error: "Flag value format is invalid. Expected: FIRE{...} or DDC{...} with 6-50 characters inside the braces. Characters allowed: letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_). Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
    }

    return { valid: true };
}

function validateDnsName(dnsName) {
    if (!dnsName || dnsName.trim().length === 0) {
        return { valid: false, error: "DNS name cannot be empty" };
    }

    const trimmed = dnsName.trim();

    // Must end with .cfire
    if (!trimmed.endsWith('.cfire')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Must end with '.cfire' (e.g., service1.cfire). The TLD must always be '.cfire'." };
    }

    // Must be at least "x.cfire" (minimum 7 characters)
    if (trimmed.length < 7) {
        return { valid: false, error: "DNS name format is invalid. Expected: At least 1 character before '.cfire' (minimum 7 characters total). Example: service1.cfire" };
    }

    // Extract the part before .cfire
    const hostname = trimmed.slice(0, -6); // Remove ".cfire"

    // Validate hostname part follows DNS rules
    // - Can contain lowercase letters, numbers, hyphens, and dots
    // - Cannot start or end with a hyphen or dot
    // - Cannot have consecutive dots
    // - Each label (between dots) must be 1-63 characters
    if (!/^[a-z0-9.\-]+$/.test(hostname)) {
        return { valid: false, error: "DNS name format is invalid. Expected: Only lowercase letters (a-z), numbers (0-9), dots (.), and hyphens (-) are allowed. Must end with '.cfire'. Example: service1.cfire" };
    }

    // Cannot start or end with hyphen or dot
    if (hostname.startsWith('-') || hostname.startsWith('.') ||
        hostname.endsWith('-') || hostname.endsWith('.')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Cannot start or end with a hyphen (-) or dot (.). Must end with '.cfire'. Example: service1.cfire" };
    }

    // Cannot have consecutive dots
    if (hostname.includes('..')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Cannot contain consecutive dots (..). Must end with '.cfire'. Example: service1.cfire" };
    }

    // Split by dots and validate each label
    const labels = hostname.split('.');
    for (const label of labels) {
        if (label.length === 0) {
            return { valid: false, error: "DNS name format is invalid. Expected: Cannot have empty parts between dots. Must end with '.cfire'. Example: service1.cfire" };
        }
        if (label.length > 63) {
            return { valid: false, error: "DNS name format is invalid. Expected: Each part (between dots) must be 63 characters or less. Must end with '.cfire'. Example: service1.cfire" };
        }
        if (label.startsWith('-') || label.endsWith('-')) {
            return { valid: false, error: "DNS name format is invalid. Expected: Each part cannot start or end with a hyphen (-). Must end with '.cfire'. Example: service1.cfire" };
        }
    }

    return { valid: true };
}

function validateNoDuplicates(formData) {
    const errors = [];

    // Check for duplicate images (normalize by removing prefix for comparison)
    const images = [];
    formData.instances.forEach((instance, idx) => {
        let image = instance.image.trim();
        // Normalize: remove prefix if present for comparison
        if (image.startsWith('ghcr.io/campfire-security/')) {
            image = image.replace('ghcr.io/campfire-security/', '');
        }
        if (image && image !== 'dummy') {
            if (images.includes(image)) {
                errors.push(`Duplicate image found: "${image}" is used in multiple services`);
            } else {
                images.push(image);
            }
        }
    });

    // Check for duplicate flag tags
    const flagTags = [];
    if (formData.flags) {
        formData.flags.forEach((flag, idx) => {
            const tag = flag.tag.trim();
            if (tag) {
                if (flagTags.includes(tag)) {
                    errors.push(`Duplicate flag tag found: "${tag}" is used in multiple flags`);
                } else {
                    flagTags.push(tag);
                }
            }
        });
    }

    // Check for duplicate DNS names across all services
    const dnsNames = [];
    if (!formData.static) {
        formData.instances.forEach((instance, serviceIdx) => {
            instance.dns.forEach((dns, dnsIdx) => {
                const dnsName = dns.name.trim();
                if (dnsName) {
                    if (dnsNames.includes(dnsName)) {
                        errors.push(`Duplicate DNS name found: "${dnsName}" is used in multiple services`);
                    } else {
                        dnsNames.push(dnsName);
                    }
                }
            });
        });
    }

    if (errors.length > 0) {
        return { valid: false, error: errors.join('\n') };
    }
    return { valid: true };
}

// Translation helper functions
function createLanguageSelect(selectedLang = '') {
    let options = '<option value="">Select Language...</option>';
    LANGUAGES.forEach(lang => {
        const selected = lang.code === selectedLang ? 'selected' : '';
        const safeLangCode = escapeHtml(lang.code);
        const safeLangName = escapeHtml(lang.name);
        const safeNativeName = escapeHtml(lang.nativeName);
        options += `<option value="${safeLangCode}" ${selected}>${safeLangName} (${safeNativeName}) - ${safeLangCode}</option>`;
    });
    return options;
}

function addImageTranslation(instanceId) {
    const sanitizedId = String(instanceId).replace(/[^0-9]/g, '');
    const translationsContainer = document.getElementById(`image-translations-${sanitizedId}`);
    if (!translationsContainer) return;
    
    translationCounter++;
    const translationDiv = document.createElement('div');
    translationDiv.className = 'translation-entry';
    translationDiv.id = `image-translation-${translationCounter}`;
    translationDiv.setAttribute('data-instance-id', sanitizedId);
    
    const safeTranslationCounter = escapeHtml(String(translationCounter));
    const nameSlug = getChallengeNameSlug();
    
    translationDiv.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
            <div style="flex: 1; min-width: 150px;">
                <label>Language *</label>
                <select class="image-translation-lang" required onchange="checkDuplicateLanguages(${sanitizedId}, 'image')">
                    ${createLanguageSelect()}
                </select>
            </div>
            <div style="flex: 2; min-width: 250px;">
                <label>Translated Image Tag *</label>
                <input type="text" class="image-translation-value" placeholder="${nameSlug}:service${instanceId}-de" required>
            </div>
            <button type="button" class="btn remove-btn" onclick="removeImageTranslation(${safeTranslationCounter}, ${sanitizedId})">Remove</button>
        </div>
    `;
    
    translationsContainer.appendChild(translationDiv);
}

function removeImageTranslation(translationId, instanceId) {
    const sanitizedTranslationId = String(translationId).replace(/[^0-9]/g, '');
    const sanitizedInstanceId = String(instanceId).replace(/[^0-9]/g, '');
    const translation = document.getElementById(`image-translation-${sanitizedTranslationId}`);
    if (translation) {
        translation.remove();
        checkDuplicateLanguages(sanitizedInstanceId, 'image');
    }
}

function addTdTranslation(flagId) {
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    const translationsContainer = document.getElementById(`td-translations-${sanitizedId}`);
    if (!translationsContainer) return;
    
    translationCounter++;
    const translationDiv = document.createElement('div');
    translationDiv.className = 'translation-entry';
    translationDiv.id = `td-translation-${translationCounter}`;
    translationDiv.setAttribute('data-flag-id', sanitizedId);
    
    const safeTranslationCounter = escapeHtml(String(translationCounter));
    
    translationDiv.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 15px;">
            <div style="flex: 1; min-width: 150px;">
                <label>Language *</label>
                <select class="td-translation-lang" required onchange="checkDuplicateLanguages(${sanitizedId}, 'td')">
                    ${createLanguageSelect()}
                </select>
            </div>
            <div style="flex: 3; min-width: 300px;">
                <label>Translated Description *</label>
                <textarea class="td-translation-value" rows="3" placeholder="Translated challenge description..." required></textarea>
            </div>
            <button type="button" class="btn remove-btn" onclick="removeTdTranslation(${safeTranslationCounter}, ${sanitizedId})" style="margin-top: 23px;">Remove</button>
        </div>
    `;
    
    translationsContainer.appendChild(translationDiv);
}

function removeTdTranslation(translationId, flagId) {
    const sanitizedTranslationId = String(translationId).replace(/[^0-9]/g, '');
    const sanitizedFlagId = String(flagId).replace(/[^0-9]/g, '');
    const translation = document.getElementById(`td-translation-${sanitizedTranslationId}`);
    if (translation) {
        translation.remove();
        checkDuplicateLanguages(sanitizedFlagId, 'td');
    }
}

function addMcTranslation(flagId) {
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    const flagEntry = document.getElementById(`flag-${sanitizedId}`);
    if (!flagEntry) return;
    
    const translationsContainer = document.getElementById(`mc-translations-${sanitizedId}`);
    if (!translationsContainer) return;
    
    // Get the original answers to create matching translation structure
    const originalAnswersContainer = document.getElementById(`mc-answers-${sanitizedId}`);
    if (!originalAnswersContainer) return;
    
    const originalAnswers = originalAnswersContainer.querySelectorAll('.mc-answer-entry');
    if (originalAnswers.length < 2) {
        showAlert('Please add at least 2 answers to the original multiple choice before adding translations', 'Missing Answers');
        return;
    }
    
    translationCounter++;
    const translationDiv = document.createElement('div');
    translationDiv.className = 'mc-translation-entry';
    translationDiv.id = `mc-translation-${translationCounter}`;
    translationDiv.setAttribute('data-flag-id', sanitizedId);
    
    const safeTranslationCounter = escapeHtml(String(translationCounter));
    
    // Build answer translation fields
    let answerFields = '';
    originalAnswers.forEach((answerEntry, index) => {
        const key = `answer-${index + 1}`;
        const isCorrect = answerEntry.querySelector('.answer-correct').checked;
        const correctLabel = isCorrect ? ' ✓ (correct)' : '';
        answerFields += `
            <div style="margin-bottom: 10px;">
                <label>Answer ${index + 1}${correctLabel} *</label>
                <input type="text" class="mc-translation-answer" data-answer-key="${key}" placeholder="Translated answer ${index + 1}" required>
            </div>
        `;
    });
    
    translationDiv.innerHTML = `
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #475569;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="flex: 1; min-width: 150px; margin-right: 10px;">
                    <label>Language *</label>
                    <select class="mc-translation-lang" required onchange="checkDuplicateLanguages(${sanitizedId}, 'mc')">
                        ${createLanguageSelect()}
                    </select>
                </div>
                <button type="button" class="btn remove-btn" onclick="removeMcTranslation(${safeTranslationCounter}, ${sanitizedId})">Remove Translation</button>
            </div>
            <div style="margin-bottom: 15px;">
                <label>Translated Wrong Answers Feedback *</label>
                <textarea class="mc-translation-wrong-feedback" rows="2" placeholder="Translated wrong feedback..." required></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label>Translated Correct Answer Explanation *</label>
                <textarea class="mc-translation-correct-explanation" rows="2" placeholder="Translated correct explanation..." required></textarea>
            </div>
            <div>
                <h5 style="color: #ff6b35; margin-bottom: 10px;">Translated Answers</h5>
                ${answerFields}
            </div>
        </div>
    `;
    
    translationsContainer.appendChild(translationDiv);
}

function removeMcTranslation(translationId, flagId) {
    const sanitizedTranslationId = String(translationId).replace(/[^0-9]/g, '');
    const sanitizedFlagId = String(flagId).replace(/[^0-9]/g, '');
    const translation = document.getElementById(`mc-translation-${sanitizedTranslationId}`);
    if (translation) {
        translation.remove();
        checkDuplicateLanguages(sanitizedFlagId, 'mc');
    }
}

function checkDuplicateLanguages(entityId, type) {
    // Check for duplicate language selections
    const sanitizedId = String(entityId).replace(/[^0-9]/g, '');
    let selector, container;
    
    if (type === 'image') {
        selector = `#image-translations-${sanitizedId} .image-translation-lang`;
        container = document.getElementById(`image-translations-${sanitizedId}`);
    } else if (type === 'td') {
        selector = `#td-translations-${sanitizedId} .td-translation-lang`;
        container = document.getElementById(`td-translations-${sanitizedId}`);
    } else if (type === 'mc') {
        selector = `#mc-translations-${sanitizedId} .mc-translation-lang`;
        container = document.getElementById(`mc-translations-${sanitizedId}`);
    }
    
    if (!container) return;
    
    const langSelects = container.querySelectorAll(selector);
    const selectedLangs = new Set();
    let hasDuplicate = false;
    
    langSelects.forEach(select => {
        select.style.borderColor = '';
        const value = select.value;
        if (value && selectedLangs.has(value)) {
            select.style.borderColor = '#ef4444';
            hasDuplicate = true;
        } else if (value) {
            selectedLangs.add(value);
        }
    });
    
    return !hasDuplicate;
}

function validateTranslations(formData) {
    const errors = [];
    
    // Validate instance image translations
    if (!formData.static) {
        formData.instances.forEach((instance, idx) => {
            if (instance.imageByLanguages) {
                // Check for duplicate languages
                const langs = Object.keys(instance.imageByLanguages);
                const uniqueLangs = new Set(langs);
                if (langs.length !== uniqueLangs.size) {
                    errors.push(`Service ${idx + 1}: Duplicate language codes found in image translations`);
                }
                
                // Check that all translations have values
                for (const [lang, value] of Object.entries(instance.imageByLanguages)) {
                    if (!value || value.trim().length === 0) {
                        errors.push(`Service ${idx + 1}: Translation for language '${lang}' is empty`);
                    }
                }
            }
        });
    }
    
    // Validate flag translations
    if (formData.flags) {
        formData.flags.forEach((flag, flagIdx) => {
            const flagNum = flagIdx + 1;
            
            // Validate TD translations
            if (flag.tdByLanguages) {
                const tdLangs = Object.keys(flag.tdByLanguages);
                const uniqueTdLangs = new Set(tdLangs);
                if (tdLangs.length !== uniqueTdLangs.size) {
                    errors.push(`Flag ${flagNum} (${flag.tag}): Duplicate language codes found in description translations`);
                }
                
                for (const [lang, value] of Object.entries(flag.tdByLanguages)) {
                    if (!value || value.trim().length === 0) {
                        errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' description is empty`);
                    }
                }
            }
            
            // Validate multiple choice translations
            if (flag.multipleChoiceByLanguages && flag.multipleChoice) {
                const mcLangs = Object.keys(flag.multipleChoiceByLanguages);
                const uniqueMcLangs = new Set(mcLangs);
                if (mcLangs.length !== uniqueMcLangs.size) {
                    errors.push(`Flag ${flagNum} (${flag.tag}): Duplicate language codes found in multiple choice translations`);
                }
                
                // Get original answer keys
                const originalAnswerKeys = Object.keys(flag.multipleChoice.answers);
                const originalAnswerCount = originalAnswerKeys.length;
                
                for (const [lang, mcData] of Object.entries(flag.multipleChoiceByLanguages)) {
                    // Check required fields
                    if (!mcData.wrongAnswersFeedback || mcData.wrongAnswersFeedback.trim().length === 0) {
                        errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' is missing wrong answers feedback`);
                    }
                    if (!mcData.correctAnswerExplanation || mcData.correctAnswerExplanation.trim().length === 0) {
                        errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' is missing correct answer explanation`);
                    }
                    
                    // Check that all answers are translated
                    const translatedAnswerKeys = Object.keys(mcData.answers);
                    if (translatedAnswerKeys.length !== originalAnswerCount) {
                        errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' has ${translatedAnswerKeys.length} answers but original has ${originalAnswerCount}`);
                    }
                    
                    // Check that answer keys match
                    for (const originalKey of originalAnswerKeys) {
                        if (!mcData.answers[originalKey]) {
                            errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' is missing answer '${originalKey}'`);
                        } else {
                            // Check that answer text is not empty
                            if (!mcData.answers[originalKey].answerText || mcData.answers[originalKey].answerText.trim().length === 0) {
                                errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' has empty text for answer '${originalKey}'`);
                            }
                            
                            // Check that correctness matches original
                            const originalCorrect = flag.multipleChoice.answers[originalKey].correct;
                            const translatedCorrect = mcData.answers[originalKey].correct;
                            if (originalCorrect !== translatedCorrect) {
                                errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' answer '${originalKey}' correctness (${translatedCorrect}) doesn't match original (${originalCorrect})`);
                            }
                        }
                    }
                    
                    // Check for extra answers in translation
                    for (const translatedKey of translatedAnswerKeys) {
                        if (!originalAnswerKeys.includes(translatedKey)) {
                            errors.push(`Flag ${flagNum} (${flag.tag}): Translation for language '${lang}' has extra answer '${translatedKey}' not in original`);
                        }
                    }
                }
            }
        });
    }
    
    if (errors.length > 0) {
        return { valid: false, error: errors.join('\n') };
    }
    return { valid: true };
}

function updateTagPreview() {
    const category = sanitizeForText(document.getElementById('category').value);
    const tag = sanitizeForText(document.getElementById('tag').value);
    const prefix = categoryPrefixes[category] || 'we_';
    const preview = document.getElementById('tagPreview');

    if (tag) {
        preview.textContent = `Full tag: ${prefix}${tag}`;
    } else {
        preview.textContent = '';
    }
}

function getChallengeNameSlug() {
    const name = sanitizeForText(document.getElementById('name').value) || 'challenge-template';
    return name.toLowerCase().replace(/[^a-z0-9\-_]/g, '').replace(/\s+/g, '-');
}

// Initialize with one instance
document.addEventListener('DOMContentLoaded', function () {
    addInstance();
    // Don't add a flag by default - user will add as needed

    // Set up event listeners
    document.getElementById('category').addEventListener('change', updateTagPreview);
    document.getElementById('tag').addEventListener('input', updateTagPreview);
    document.getElementById('static').addEventListener('change', function () {
        updateAllInstancesForStatic();
    });
    document.getElementById('name').addEventListener('input', function () {
        updateAllInstanceImages();
        // Real-time validation
        const validation = validateChallengeName(this.value);
        if (!validation.valid && this.value.length > 0) {
            this.setCustomValidity(validation.error);
        } else {
            this.setCustomValidity('');
        }
    });

    document.getElementById('tag').addEventListener('input', function () {
        const validation = validateTag(this.value);
        if (!validation.valid && this.value.length > 0) {
            this.setCustomValidity(validation.error);
        } else {
            this.setCustomValidity('');
        }
    });

    updateTagPreview();
});

function addInstance() {
    const isStatic = document.getElementById('static').checked;

    // Prevent adding more services when static (only one dummy service allowed)
    if (isStatic) {
        const existingCards = document.querySelectorAll('.instance-card');
        if (existingCards.length > 0) {
            showAlert('Static challenges can only have one service (dummy). If this is not a static challenge, please uncheck the "Static" checkbox.', 'Static Challenge Restriction');
            return;
        }
    }

    instanceCounter++;
    const container = document.getElementById('instancesContainer');
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'instance-card';
    instanceDiv.id = `instance-${instanceCounter}`;
    const nameSlug = getChallengeNameSlug();
    const imageValue = isStatic ? 'dummy' : `${nameSlug}:service${instanceCounter}`;

    // Sanitize values before inserting into HTML
    const safeInstanceCounter = escapeHtml(String(instanceCounter));
    const safeImageValue = sanitizeForAttribute(imageValue);
    const safeNameSlug = sanitizeForAttribute(nameSlug);
    const staticAttr = isStatic ? 'style="display: none;"' : '';
    const readonlyAttr = isStatic ? 'readonly' : 'required';
    const requiredAttr = isStatic ? '' : 'required';

    const dockerImageHelp = isStatic
        ? 'Automatically set to "dummy" for static challenges'
        : 'Only enter the suffix (e.g., challenge-template:service1). Prefix "ghcr.io/campfire-security/" will be added automatically.';
    const dnsHelp = 'Must end with .cfire (e.g., service1.cfire). Lowercase letters, numbers, dots, and hyphens only.';

    instanceDiv.innerHTML = `
        <div class="instance-header">
            <h3>Service ${safeInstanceCounter}</h3>
            <button type="button" class="btn btn-danger" onclick="removeInstance(${safeInstanceCounter})" ${staticAttr}>Remove</button>
        </div>
        <div class="form-group">
            ${createLabelWithInfo(`Docker Image ${isStatic ? '(auto: dummy)' : '*'}`, dockerImageHelp)}
            <input type="text" class="instance-image" data-instance-id="${safeInstanceCounter}" 
                   value="${safeImageValue}" 
                   ${readonlyAttr} 
                   placeholder="${isStatic ? 'dummy' : 'challenge-template:service1'}">
        </div>
        <div class="form-group" ${staticAttr}>
            ${createLabelWithInfo('DNS Name *', dnsHelp)}
            <input type="text" class="dns-name" data-instance-id="${safeInstanceCounter}" placeholder="service1.cfire" ${requiredAttr} pattern="[a-z0-9.\-]+\.cfire$">
        </div>
        <div class="form-group translation-section" ${staticAttr}>
            <button type="button" class="btn btn-secondary translation-toggle" onclick="toggleTranslationSection('image-${safeInstanceCounter}', this)">
                + Image Translations (Optional)
            </button>
            <div id="image-translations-section-${safeInstanceCounter}" class="translation-container" style="display: none;">
                <div id="image-translations-${safeInstanceCounter}" class="translations-list">
                    <!-- Image translations will be added here -->
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addImageTranslation(${safeInstanceCounter})">+ Add Translation</button>
            </div>
        </div>
    `;

    container.appendChild(instanceDiv);
}

function toggleTranslationSection(sectionId, button) {
    const section = document.getElementById(`${sectionId}-translations-section`);
    if (section && button) {
        if (section.style.display === 'none') {
            section.style.display = 'block';
            button.textContent = button.textContent.replace('+', '−');
        } else {
            section.style.display = 'none';
            button.textContent = button.textContent.replace('−', '+');
        }
    }
}

function updateAllInstancesForStatic() {
    const isStatic = document.getElementById('static').checked;
    const container = document.getElementById('instancesContainer');
    const instanceCards = document.querySelectorAll('.instance-card');
    const addButton = container.parentElement.querySelector('button[onclick="addInstance()"]');

    if (isStatic) {
        // Remove all but the first service
        if (instanceCards.length > 1) {
            for (let i = instanceCards.length - 1; i > 0; i--) {
                instanceCards[i].remove();
            }
        }

        // Update the remaining service
        const firstCard = document.querySelector('.instance-card');
        if (firstCard) {
            const imageInput = firstCard.querySelector('.instance-image');
            const dnsInput = firstCard.querySelector('.dns-name');
            const dnsGroup = dnsInput ? dnsInput.closest('.form-group') : null;
            const removeButton = firstCard.querySelector('.btn-danger');

            if (imageInput) {
                imageInput.value = 'dummy';
                imageInput.readOnly = true;
                imageInput.required = false;
            }
            if (dnsGroup) {
                dnsGroup.style.display = 'none';
                if (dnsInput) {
                    dnsInput.value = '';
                    dnsInput.required = false;
                }
            }
            // Hide remove button for static services
            if (removeButton) {
                removeButton.style.display = 'none';
            }
        }

        // Hide the "Add Service" button when static
        if (addButton) {
            addButton.style.display = 'none';
        }
    } else {
        // Show DNS fields and update images
        instanceCards.forEach((card, index) => {
            const imageInput = card.querySelector('.instance-image');
            const dnsInput = card.querySelector('.dns-name');
            const dnsGroup = dnsInput ? dnsInput.closest('.form-group') : null;
            const removeButton = card.querySelector('.btn-danger');
            const nameSlug = getChallengeNameSlug();

            if (imageInput) {
                const safeNameSlug = sanitizeForAttribute(nameSlug);
                imageInput.value = `${safeNameSlug}:service${index + 1}`;
                imageInput.readOnly = false;
                imageInput.required = true;
            }
            if (dnsGroup) {
                dnsGroup.style.display = 'block';
                if (dnsInput) {
                    dnsInput.required = true;
                }
            }
            // Show remove button for non-static services
            if (removeButton) {
                removeButton.style.display = 'inline-block';
            }
        });

        // Show the "Add Service" button when not static
        if (addButton) {
            addButton.style.display = 'inline-block';
        }
    }
}

function updateAllInstanceImages() {
    const isStatic = document.getElementById('static').checked;
    if (isStatic) return; // Don't update if static

    const instanceCards = document.querySelectorAll('.instance-card');
    const nameSlug = getChallengeNameSlug();

    instanceCards.forEach((card, index) => {
        const imageInput = card.querySelector('.instance-image');
        if (imageInput && !imageInput.readOnly) {
            const currentValue = imageInput.value;
            // Only update if it matches the pattern (was auto-generated)
            if (currentValue.includes(':service')) {
                const safeNameSlug = sanitizeForAttribute(nameSlug);
                imageInput.value = `${safeNameSlug}:service${index + 1}`;
            }
        }
    });
}

function removeInstance(instanceId) {
    // Sanitize instanceId to prevent XSS
    const sanitizedId = String(instanceId).replace(/[^0-9]/g, '');
    if (!sanitizedId) {
        return;
    }

    const isStatic = document.getElementById('static').checked;

    // Prevent removing the only service when static
    if (isStatic) {
        const remainingCards = document.querySelectorAll('.instance-card');
        if (remainingCards.length <= 1) {
            showAlert('Static challenges must have exactly one service (dummy). Cannot remove the last service.', 'Cannot Remove Service');
            return;
        }
    }

    const instance = document.getElementById(`instance-${sanitizedId}`);
    if (instance) {
        instance.remove();
    }
}


function addFlag() {
    flagCounter++;
    const container = document.getElementById('flagsContainer');
    const flagDiv = document.createElement('div');
    flagDiv.className = 'flag-entry';
    flagDiv.id = `flag-${flagCounter}`;

    // Sanitize flag counter before inserting into HTML
    const safeFlagCounter = escapeHtml(String(flagCounter));

    flagDiv.innerHTML = `
        <div class="form-group">
            ${createLabelWithInfo('Flag Tag *', 'Lowercase letters, numbers, hyphens, and underscores only')}
            <input type="text" class="flag-tag" placeholder="challenge-template-1" required pattern="[a-z0-9\-_]+">
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Flag Name *', 'Display name shown on the platform')}
            <input type="text" class="flag-name" placeholder="Challenge name" required>
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Flag Type *', 'Choose between a static flag value or multiple choice quiz')}
            <select class="flag-type" required onchange="toggleFlagType(${safeFlagCounter})">
                <option value="static" selected>Static Flag</option>
                <option value="multipleChoice">Multiple Choice</option>
            </select>
        </div>
        
        <!-- Static Flag Fields -->
        <div class="static-flag-fields" id="static-flag-${safeFlagCounter}">
            <div class="form-group">
                ${createLabelWithInfo('Static Flag Value *', 'Must be FIRE{...} or DDC{...} format with 6-50 characters inside braces. Allowed characters: letters (a-z, A-Z), numbers (0-9), hyphens (-), underscores (_).\\n\\nExample flags:\\n\\n• FIRE{flag_here_in_1337speak}\\n• DDC{h4nds_up_7h1s_15_4_r0pp3ry}\\n• FIRE{771b2f7a-d8f2-48f9-856e-70a83c9dd65c}')}
                <input type="text" class="flag-static" placeholder="FIRE{flag_here_in_1337speak}" pattern="^(FIRE|DDC)\\{[a-zA-Z0-9\\-_]{6,50}\\}$">
            </div>
        </div>
        
        <!-- Multiple Choice Fields -->
        <div class="multiple-choice-fields" id="mc-flag-${safeFlagCounter}" style="display: none; flex-basis: 100%;">
            <div class="form-group" style="flex-basis: 100%;">
                ${createLabelWithInfo('Wrong Answers Feedback *', 'Message shown when an incorrect answer is selected')}
                <textarea class="mc-wrong-feedback" rows="2">That's not correct. Try again!</textarea>
            </div>
            <div class="form-group" style="flex-basis: 100%;">
                ${createLabelWithInfo('Correct Answer Explanation *', 'Message shown when the correct answer is selected')}
                <textarea class="mc-correct-answer-explanation" rows="2">Correct! Well done!</textarea>
            </div>
            <div style="flex-basis: 100%;">
                <h4 style="color: #ff6b35; margin: 10px 0;">Answers (2-5 required)</h4>
                <div class="mc-answers" id="mc-answers-${safeFlagCounter}">
                    <!-- Answers will be added here -->
                </div>
                <button type="button" class="btn btn-secondary" onclick="addAnswerToFlag(${safeFlagCounter})" style="margin-top: 10px;">+ Add Answer</button>
            </div>
        </div>
        
        <div class="form-group">
            ${createLabelWithInfo('Points *', 'Points awarded for capturing this flag')}
            <input type="number" class="flag-points" value="20" placeholder="20" min="0" required>
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Category *', 'Category shown on the platform')}
            <select class="flag-category" required>
                <option value="Starters">Starters</option>
                <option value="Forensics">Forensics</option>
                <option value="Web exploitation" selected>Web exploitation</option>
                <option value="Cryptography">Cryptography</option>
                <option value="Boot 2 Root">Boot 2 Root</option>
                <option value="Reverse Engineering">Reverse Engineering</option>
                <option value="Binary (PWN)">Binary (PWN)</option>
                <option value="Misc">Misc</option>
                <option value="Operational Technologies">Operational Technologies</option>
            </select>
        </div>
        <div class="form-group" style="flex-basis: 100%;">
            ${createLabelWithInfo('Flag Description (TD) *', 'Description formatted in markdown. For static challenges, include links to handouts along with SHA256 checksums for verification.')}
            <textarea class="flag-td" rows="4" placeholder="Challenge description goes here in markdown format." required></textarea>
        </div>
        
        <!-- TD Translation Section -->
        <div class="form-group translation-section" style="flex-basis: 100%;">
            <button type="button" class="btn btn-secondary translation-toggle" onclick="toggleTranslationSection('td-${safeFlagCounter}', this)">
                + Description Translations (Optional)
            </button>
            <div id="td-translations-section-${safeFlagCounter}" class="translation-container" style="display: none;">
                <div id="td-translations-${safeFlagCounter}" class="translations-list">
                    <!-- TD translations will be added here -->
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addTdTranslation(${safeFlagCounter})">+ Add Translation</button>
            </div>
        </div>
        
        <!-- MC Translation Section (only shown for multiple choice) -->
        <div class="mc-translation-section" id="mc-translation-section-${safeFlagCounter}" style="display: none; flex-basis: 100%;">
            <button type="button" class="btn btn-secondary translation-toggle" onclick="toggleTranslationSection('mc-${safeFlagCounter}', this)">
                + Multiple Choice Translations (Optional)
            </button>
            <div id="mc-translations-section-${safeFlagCounter}" class="translation-container" style="display: none;">
                <div id="mc-translations-${safeFlagCounter}" class="translations-list">
                    <!-- MC translations will be added here -->
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addMcTranslation(${safeFlagCounter})">+ Add Translation</button>
            </div>
        </div>
        
        <button type="button" class="btn remove-btn" onclick="removeFlag(${safeFlagCounter})" style="align-self: flex-start;">Remove</button>
    `;

    container.appendChild(flagDiv);
}

function removeFlag(flagId) {
    // Sanitize flagId to prevent XSS
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    if (!sanitizedId) {
        return;
    }

    const flag = document.getElementById(`flag-${sanitizedId}`);
    if (flag) {
        flag.remove();
    }
}

function toggleFlagType(flagId) {
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    const flagEntry = document.getElementById(`flag-${sanitizedId}`);
    if (!flagEntry) return;
    
    const flagTypeSelect = flagEntry.querySelector('.flag-type');
    const staticFields = flagEntry.querySelector(`#static-flag-${sanitizedId}`);
    const mcFields = flagEntry.querySelector(`#mc-flag-${sanitizedId}`);
    const mcTranslationSection = flagEntry.querySelector(`#mc-translation-section-${sanitizedId}`);
    const staticInput = flagEntry.querySelector('.flag-static');
    const mcWrongFeedback = flagEntry.querySelector('.mc-wrong-feedback');
    const mcCorrectAnswerExplanation = flagEntry.querySelector('.mc-correct-answer-explanation');
    
    if (flagTypeSelect.value === 'multipleChoice') {
        // Show multiple choice, hide static
        staticFields.style.display = 'none';
        mcFields.style.display = 'flex';
        if (mcTranslationSection) mcTranslationSection.style.display = 'block';
        if (staticInput) staticInput.removeAttribute('required');
        if (mcWrongFeedback) mcWrongFeedback.setAttribute('required', 'required');
        if (mcCorrectAnswerExplanation) mcCorrectAnswerExplanation.setAttribute('required', 'required');
        
        // Initialize with 2 answers if none exist
        const answersContainer = flagEntry.querySelector(`#mc-answers-${sanitizedId}`);
        if (answersContainer && answersContainer.children.length === 0) {
            addAnswerToFlag(sanitizedId);
            addAnswerToFlag(sanitizedId);
        }
    } else {
        // Show static, hide multiple choice
        staticFields.style.display = 'block';
        mcFields.style.display = 'none';
        if (mcTranslationSection) mcTranslationSection.style.display = 'none';
        if (staticInput) staticInput.setAttribute('required', 'required');
        if (mcWrongFeedback) mcWrongFeedback.removeAttribute('required');
        if (mcCorrectAnswerExplanation) mcCorrectAnswerExplanation.removeAttribute('required');
    }
}

function addAnswerToFlag(flagId) {
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    const answersContainer = document.getElementById(`mc-answers-${sanitizedId}`);
    if (!answersContainer) return;
    
    // Check if we already have 5 answers
    const existingAnswers = answersContainer.querySelectorAll('.mc-answer-entry');
    if (existingAnswers.length >= 5) {
        showAlert('Maximum of 5 answer options allowed for multiple choice flags', 'Maximum Reached');
        return;
    }
    
    // Auto-assign the next answer key based on count
    const nextKeyIndex = existingAnswers.length + 1;
    const answerKey = `answer-${nextKeyIndex}`;
    
    answerCounter++;
    const answerDiv = document.createElement('div');
    answerDiv.className = 'mc-answer-entry';
    answerDiv.id = `answer-${answerCounter}`;
    answerDiv.setAttribute('data-flag-id', sanitizedId);
    answerDiv.setAttribute('data-answer-key', answerKey);
    
    const safeAnswerCounter = escapeHtml(String(answerCounter));
    const safeAnswerKey = escapeHtml(answerKey);
    
    answerDiv.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <div style="flex: 1; min-width: 200px;">
                ${createLabelWithInfo('Answer Text *', 'The text displayed for this answer choice')}
                <input type="text" class="answer-text" placeholder="Enter answer text" required>
            </div>
            <div style="flex: 0 0 auto;">
                <label style="display: flex; align-items: center; cursor: pointer; color: #e2e8f0; margin-top: 20px;">
                    <input type="checkbox" class="answer-correct" style="margin-right: 8px;">
                    Correct
                </label>
            </div>
            <button type="button" class="btn remove-btn" onclick="removeAnswerFromFlag(${safeAnswerCounter}, ${sanitizedId})" style="margin-top: 20px;">Remove</button>
        </div>
    `;
    
    answersContainer.appendChild(answerDiv);
}

function removeAnswerFromFlag(answerId, flagId) {
    const sanitizedAnswerId = String(answerId).replace(/[^0-9]/g, '');
    const sanitizedFlagId = String(flagId).replace(/[^0-9]/g, '');
    if (!sanitizedAnswerId) return;
    
    const answersContainer = document.getElementById(`mc-answers-${sanitizedFlagId}`);
    if (!answersContainer) return;
    
    const existingAnswers = answersContainer.querySelectorAll('.mc-answer-entry');
    if (existingAnswers.length <= 2) {
        showAlert('Multiple choice flags must have at least 2 answer options', 'Cannot Remove');
        return;
    }
    
    const answer = document.getElementById(`answer-${sanitizedAnswerId}`);
    if (answer) {
        answer.remove();
        // Reindex remaining answers
        const remainingAnswers = answersContainer.querySelectorAll('.mc-answer-entry');
        remainingAnswers.forEach((answerEntry, index) => {
            const newKey = `answer-${index + 1}`;
            answerEntry.setAttribute('data-answer-key', newKey);
        });
    }
}



function collectFormData() {
    // Sanitize all inputs when collecting form data
    const formData = {
        name: sanitizeForYaml(document.getElementById('name').value.trim()),
        category: sanitizeForYaml(document.getElementById('category').value),
        tag: sanitizeForYaml(document.getElementById('tag').value.trim()),
        static: document.getElementById('static').checked,
        od: sanitizeForYaml(document.getElementById('od').value),
        instances: []
    };

    // Collect instances
    const instanceCards = document.querySelectorAll('.instance-card');
    const isStatic = formData.static;

    instanceCards.forEach((card, index) => {
        const imageInput = card.querySelector('.instance-image');
        let imageValue = sanitizeForYaml(imageInput.value.trim());

        // For non-static, remove prefix if user included it
        if (!isStatic && imageValue.startsWith('ghcr.io/campfire-security/')) {
            imageValue = imageValue.replace('ghcr.io/campfire-security/', '');
        }

        const instance = {
            image: imageValue,
            dns: []
        };

        // Collect DNS entry (only one per service, only for non-static)
        if (!isStatic) {
            const dnsInput = card.querySelector('.dns-name');
            if (dnsInput) {
                const dnsName = sanitizeForYaml(dnsInput.value.trim());
                if (dnsName) {
                    instance.dns.push({
                        name: dnsName,
                        type: "A"  // Always use A record
                    });
                }
            }
            
            // Collect image translations (only for non-static)
            const instanceId = card.id.replace('instance-', '');
            const imageTranslationsContainer = card.querySelector(`#image-translations-${instanceId}`);
            if (imageTranslationsContainer) {
                const imageTranslations = imageTranslationsContainer.querySelectorAll('.translation-entry');
                if (imageTranslations.length > 0) {
                    instance.imageByLanguages = {};
                    imageTranslations.forEach(translationEntry => {
                        const lang = sanitizeForYaml(translationEntry.querySelector('.image-translation-lang').value.trim());
                        let translationValue = sanitizeForYaml(translationEntry.querySelector('.image-translation-value').value.trim());
                        if (lang && translationValue) {
                            // Remove prefix if user included it
                            if (translationValue.startsWith('ghcr.io/campfire-security/')) {
                                translationValue = translationValue.replace('ghcr.io/campfire-security/', '');
                            }
                            instance.imageByLanguages[lang] = translationValue;
                        }
                    });
                }
            }
        }

        formData.instances.push(instance);
    });

    // Collect flags from the flags container
    formData.flags = [];
    const flagEntries = document.querySelectorAll('#flagsContainer .flag-entry');
    flagEntries.forEach(flagEntry => {
        const tag = sanitizeForYaml(flagEntry.querySelector('.flag-tag').value.trim());
        if (tag) {
            const flagType = flagEntry.querySelector('.flag-type').value;
            const flagId = flagEntry.id.replace('flag-', '');
            const flag = {
                tag: tag,
                name: sanitizeForYaml(flagEntry.querySelector('.flag-name').value),
                points: parseInt(flagEntry.querySelector('.flag-points').value) || 20,
                category: sanitizeForYaml(flagEntry.querySelector('.flag-category').value),
                td: sanitizeForYaml(flagEntry.querySelector('.flag-td').value)
            };
            
            // Collect TD translations
            const tdTranslationsContainer = flagEntry.querySelector(`#td-translations-${flagId}`);
            if (tdTranslationsContainer) {
                const tdTranslations = tdTranslationsContainer.querySelectorAll('.translation-entry');
                if (tdTranslations.length > 0) {
                    flag.tdByLanguages = {};
                    tdTranslations.forEach(translationEntry => {
                        const lang = sanitizeForYaml(translationEntry.querySelector('.td-translation-lang').value.trim());
                        const translationValue = sanitizeForYaml(translationEntry.querySelector('.td-translation-value').value.trim());
                        if (lang && translationValue) {
                            flag.tdByLanguages[lang] = translationValue;
                        }
                    });
                }
            }
            
            if (flagType === 'multipleChoice') {
                // Collect multiple choice data for this flag
                flag.multipleChoice = {
                    wrongAnswersFeedback: sanitizeForYaml(flagEntry.querySelector('.mc-wrong-feedback').value),
                    correctAnswerExplanation: sanitizeForYaml(flagEntry.querySelector('.mc-correct-answer-explanation').value),
                    answers: {}
                };
                
                const answersContainer = flagEntry.querySelector('.mc-answers');
                if (answersContainer) {
                    const answerEntries = answersContainer.querySelectorAll('.mc-answer-entry');
                    answerEntries.forEach((answerEntry, index) => {
                        const key = `answer-${index + 1}`;
                        const text = sanitizeForYaml(answerEntry.querySelector('.answer-text').value.trim());
                        const correct = answerEntry.querySelector('.answer-correct').checked;
                        
                        if (text) {
                            flag.multipleChoice.answers[key] = {
                                answerText: text,
                                correct: correct
                            };
                        }
                    });
                }
                
                // Collect MC translations
                const mcTranslationsContainer = flagEntry.querySelector(`#mc-translations-${flagId}`);
                if (mcTranslationsContainer) {
                    const mcTranslations = mcTranslationsContainer.querySelectorAll('.mc-translation-entry');
                    if (mcTranslations.length > 0) {
                        flag.multipleChoiceByLanguages = {};
                        mcTranslations.forEach(translationEntry => {
                            const lang = sanitizeForYaml(translationEntry.querySelector('.mc-translation-lang').value.trim());
                            if (lang) {
                                const wrongFeedback = sanitizeForYaml(translationEntry.querySelector('.mc-translation-wrong-feedback').value.trim());
                                const correctExplanation = sanitizeForYaml(translationEntry.querySelector('.mc-translation-correct-explanation').value.trim());
                                
                                if (wrongFeedback && correctExplanation) {
                                    flag.multipleChoiceByLanguages[lang] = {
                                        wrongAnswersFeedback: wrongFeedback,
                                        correctAnswerExplanation: correctExplanation,
                                        answers: {}
                                    };
                                    
                                    // Collect translated answers
                                    const translatedAnswers = translationEntry.querySelectorAll('.mc-translation-answer');
                                    translatedAnswers.forEach(translatedAnswer => {
                                        const answerKey = translatedAnswer.getAttribute('data-answer-key');
                                        const answerText = sanitizeForYaml(translatedAnswer.value.trim());
                                        if (answerKey && answerText) {
                                            // Get the correctness from the original answer
                                            const originalAnswer = answersContainer.querySelector(`.mc-answer-entry[data-answer-key="${answerKey}"]`);
                                            const isCorrect = originalAnswer ? originalAnswer.querySelector('.answer-correct').checked : false;
                                            
                                            flag.multipleChoiceByLanguages[lang].answers[answerKey] = {
                                                answerText: answerText,
                                                correct: isCorrect
                                            };
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            } else {
                // Static flag
                flag.static = sanitizeForYaml(flagEntry.querySelector('.flag-static').value);
            }
            
            formData.flags.push(flag);
        }
    });

    return formData;
}

// Generate YAML from form data (client-side)
function generateYamlFromData(formData) {
    try {
        // Get category and apply prefix to tag
        const category = formData.category;
        let tagSuffix = formData.tag.trim();
        const prefix = categoryPrefixes[category] || 'we_';

        // Remove existing prefix if present
        for (const [cat, pre] of Object.entries(categoryPrefixes)) {
            if (tagSuffix.startsWith(pre)) {
                tagSuffix = tagSuffix.substring(pre.length);
                break;
            }
        }

        // Build full tag with prefix
        const fullTag = prefix + tagSuffix;
        const isStatic = formData.static;

        // Build challenge structure (values already sanitized in collectFormData)
        const challenge = {
            name: sanitizeForYaml(formData.name),
            tag: sanitizeForYaml(fullTag),
            static: isStatic,
            secret: true,
            od: sanitizeForYaml(formData.od),
            instance: []
        };

        // Process instances
        const challengeNameSlug = formData.name.toLowerCase()
            .replace(/[^a-z0-9\-_]/g, '')
            .replace(/\s+/g, '-') || 'challenge-template';

        formData.instances.forEach((instanceData, idx) => {
            let instance;

            if (isStatic) {
                instance = { image: 'dummy' };
            } else {
                let imageSuffix = sanitizeForYaml(instanceData.image.trim());
                if (!imageSuffix) {
                    imageSuffix = `${challengeNameSlug}:service${idx + 1}`;
                }
                instance = {
                    image: `ghcr.io/campfire-security/${imageSuffix}`
                };

                // Add imageByLanguages if present
                if (instanceData.imageByLanguages && Object.keys(instanceData.imageByLanguages).length > 0) {
                    instance.imageByLanguages = {};
                    for (const [lang, imageValue] of Object.entries(instanceData.imageByLanguages)) {
                        instance.imageByLanguages[lang] = `ghcr.io/campfire-security/${imageValue}`;
                    }
                }

                // Process DNS entry (only one per service) - only add if DNS is provided
                if (instanceData.dns && instanceData.dns.length > 0) {
                    const dnsEntry = instanceData.dns[0];
                    if (dnsEntry.name && dnsEntry.name.trim()) {
                        instance.dns = [{
                            name: sanitizeForYaml(dnsEntry.name.trim()),
                            type: 'A'
                        }];
                    }
                }
                // If no DNS provided, don't add dns field at all
            }

            challenge.instance.push(instance);
        });

        // Add flags to the last service
        if (formData.flags && formData.flags.length > 0) {
            const flags = formData.flags.map(flagData => {
                const flag = {
                    tag: sanitizeForYaml(flagData.tag.trim()),
                    name: sanitizeForYaml(flagData.name),
                    points: parseInt(flagData.points) || 20,
                    category: sanitizeForYaml(flagData.category),
                    td: sanitizeForYaml(flagData.td)
                };
                
                // Add tdByLanguages if present
                if (flagData.tdByLanguages && Object.keys(flagData.tdByLanguages).length > 0) {
                    flag.tdByLanguages = {};
                    for (const [lang, tdValue] of Object.entries(flagData.tdByLanguages)) {
                        flag.tdByLanguages[lang] = sanitizeForYaml(tdValue);
                    }
                }
                
                // Add either static flag or multipleChoice
                if (flagData.multipleChoice) {
                    flag.multipleChoice = {
                        wrongAnswersFeedback: sanitizeForYaml(flagData.multipleChoice.wrongAnswersFeedback),
                        correctAnswerExplanation: sanitizeForYaml(flagData.multipleChoice.correctAnswerExplanation),
                        answers: {}
                    };
                    
                    for (const [key, value] of Object.entries(flagData.multipleChoice.answers)) {
                        flag.multipleChoice.answers[key] = {
                            answerText: sanitizeForYaml(value.answerText),
                            correct: value.correct
                        };
                    }
                    
                    // Add multipleChoiceByLanguages if present
                    if (flagData.multipleChoiceByLanguages && Object.keys(flagData.multipleChoiceByLanguages).length > 0) {
                        flag.multipleChoiceByLanguages = {};
                        for (const [lang, mcData] of Object.entries(flagData.multipleChoiceByLanguages)) {
                            flag.multipleChoiceByLanguages[lang] = {
                                wrongAnswersFeedback: sanitizeForYaml(mcData.wrongAnswersFeedback),
                                correctAnswerExplanation: sanitizeForYaml(mcData.correctAnswerExplanation),
                                answers: {}
                            };
                            
                            for (const [answerKey, answerValue] of Object.entries(mcData.answers)) {
                                flag.multipleChoiceByLanguages[lang].answers[answerKey] = {
                                    answerText: sanitizeForYaml(answerValue.answerText),
                                    correct: answerValue.correct
                                };
                            }
                        }
                    }
                } else {
                    flag.static = sanitizeForYaml(flagData.static);
                }
                
                return flag;
            });

            // Add flags to the last service entry
            if (challenge.instance.length > 0) {
                challenge.instance[challenge.instance.length - 1].flags = flags;
            } else {
                // If no services, create a dummy service for flags
                challenge.instance.push({
                    image: isStatic ? 'dummy' : `ghcr.io/campfire-security/${challengeNameSlug}:service1`,
                    flags: flags
                });
            }
        }

        // Convert to YAML with proper formatting
        let yaml = jsyaml.dump(challenge, {
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
            quotingType: '"',
            forceQuotes: false
        });

        // Replace "|-" with "|" for od and td fields (literal block scalars without strip)
        // Handle both "od: |-" and "od:|-" formats
        yaml = yaml.replace(/^(\s*)od:\s*\|\-/gm, '$1od: |');
        yaml = yaml.replace(/^(\s*)td:\s*\|\-/gm, '$1td: |');
        // Also handle nested td fields (inside flags)
        yaml = yaml.replace(/(\s+)td:\s*\|\-/g, '$1td: |');

        return yaml;
    } catch (error) {
        throw new Error('Failed to generate YAML: ' + error.message);
    }
}

function previewYaml() {
    const formData = collectFormData();

    // Validation
    const nameValidation = validateChallengeName(formData.name);
    if (!nameValidation.valid) {
        showAlert(nameValidation.error, 'Validation Error');
        return;
    }

    const tagValidation = validateTag(formData.tag);
    if (!tagValidation.valid) {
        showAlert(tagValidation.error, 'Validation Error');
        return;
    }

    if (!formData.od || formData.od.trim().length === 0) {
        showAlert('Please fill in the challenge description', 'Missing Information');
        return;
    }

    // Validate services
    if (formData.instances.length === 0) {
        showAlert('Please add at least one service', 'Missing Service');
        return;
    }

    // Validate static: only one service allowed when static
    if (formData.static && formData.instances.length > 1) {
        showAlert('Static challenges can only have one service (dummy). Please remove extra services.', 'Too Many Services');
        return;
    }

    // Validate flags - at least one flag required
    if (!formData.flags || formData.flags.length === 0) {
        showAlert('Please add at least one flag', 'Missing Flag');
        return;
    }

    for (let j = 0; j < formData.flags.length; j++) {
        const flag = formData.flags[j];
        const flagTagValidation = validateFlagTag(flag.tag);
        if (!flagTagValidation.valid) {
            showAlert(`Flag ${j + 1} - Tag: ${flagTagValidation.error}`, 'Validation Error');
            return;
        }
        
        // Validate based on flag type
        if (flag.multipleChoice) {
            // Validate multiple choice flag
            if (!flag.multipleChoice.wrongAnswersFeedback || flag.multipleChoice.wrongAnswersFeedback.trim().length === 0) {
                showAlert(`Flag ${j + 1} - Please fill in the wrong answers feedback`, 'Missing Information');
                return;
            }
            if (!flag.multipleChoice.correctAnswerExplanation || flag.multipleChoice.correctAnswerExplanation.trim().length === 0) {
                showAlert(`Flag ${j + 1} - Please fill in the correct answer explanation`, 'Missing Information');
                return;
            }
            
            const answerKeys = Object.keys(flag.multipleChoice.answers);
            if (answerKeys.length < 2) {
                showAlert(`Flag ${j + 1} - Multiple choice flags require at least 2 answer options`, 'Too Few Answers');
                return;
            }
            if (answerKeys.length > 5) {
                showAlert(`Flag ${j + 1} - Multiple choice flags can have at most 5 answer options`, 'Too Many Answers');
                return;
            }
            
            const hasCorrectAnswer = Object.values(flag.multipleChoice.answers).some(answer => answer.correct);
            if (!hasCorrectAnswer) {
                showAlert(`Flag ${j + 1} - Please mark at least one answer as correct`, 'No Correct Answer');
                return;
            }
        } else {
            // Validate static flag
            const flagStaticValidation = validateFlagStatic(flag.static);
            if (!flagStaticValidation.valid) {
                showAlert(`Flag ${j + 1} - Flag Value: ${flagStaticValidation.error}`, 'Validation Error');
                return;
            }
        }
    }

    // Validate DNS entries for non-static services (max one per service)
    if (!formData.static) {
        for (let i = 0; i < formData.instances.length; i++) {
            const instance = formData.instances[i];
            if (instance.dns.length > 1) {
                showAlert(`Service ${i + 1} can only have one DNS entry. Please remove extra DNS entries.`, 'Too Many DNS Entries');
                return;
            }
            for (let j = 0; j < instance.dns.length; j++) {
                const dns = instance.dns[j];
                const dnsValidation = validateDnsName(dns.name);
                if (!dnsValidation.valid) {
                    showAlert(`Service ${i + 1}, DNS Entry: ${dnsValidation.error}`, 'Validation Error');
                    return;
                }
            }
        }
    }

    // Check for duplicates (images, flag tags, DNS names)
    const duplicateValidation = validateNoDuplicates(formData);
    if (!duplicateValidation.valid) {
        showAlert(duplicateValidation.error, 'Duplicate Values Found');
        return;
    }

    // Validate translations
    const translationValidation = validateTranslations(formData);
    if (!translationValidation.valid) {
        showAlert(translationValidation.error, 'Translation Validation Error');
        return;
    }

    try {
        const yaml = generateYamlFromData(formData);
        previewYamlData = formData;
        document.getElementById('yamlPreview').textContent = yaml;
        document.getElementById('previewModal').style.display = 'block';
    } catch (error) {
        showAlert(error.message, 'Error Generating Preview');
    }
}

function generateYaml() {
    const formData = collectFormData();

    // Validation (same as preview)
    const nameValidation = validateChallengeName(formData.name);
    if (!nameValidation.valid) {
        showAlert(nameValidation.error, 'Validation Error');
        return;
    }

    const tagValidation = validateTag(formData.tag);
    if (!tagValidation.valid) {
        showAlert(tagValidation.error, 'Validation Error');
        return;
    }

    if (!formData.od || formData.od.trim().length === 0) {
        showAlert('Please fill in the challenge description', 'Missing Information');
        return;
    }

    // Validate services
    if (formData.instances.length === 0) {
        showAlert('Please add at least one service', 'Missing Service');
        return;
    }

    // Validate static: only one service allowed when static
    if (formData.static && formData.instances.length > 1) {
        showAlert('Static challenges can only have one service (dummy). Please remove extra services.', 'Too Many Services');
        return;
    }

    // Validate flags - at least one flag required
    if (!formData.flags || formData.flags.length === 0) {
        showAlert('Please add at least one flag', 'Missing Flag');
        return;
    }

    for (let j = 0; j < formData.flags.length; j++) {
        const flag = formData.flags[j];
        const flagTagValidation = validateFlagTag(flag.tag);
        if (!flagTagValidation.valid) {
            showAlert(`Flag ${j + 1} - Tag: ${flagTagValidation.error}`, 'Validation Error');
            return;
        }
        
        // Validate based on flag type
        if (flag.multipleChoice) {
            // Validate multiple choice flag
            if (!flag.multipleChoice.wrongAnswersFeedback || flag.multipleChoice.wrongAnswersFeedback.trim().length === 0) {
                showAlert(`Flag ${j + 1} - Please fill in the wrong answers feedback`, 'Missing Information');
                return;
            }
            if (!flag.multipleChoice.correctAnswerExplanation || flag.multipleChoice.correctAnswerExplanation.trim().length === 0) {
                showAlert(`Flag ${j + 1} - Please fill in the correct answer explanation`, 'Missing Information');
                return;
            }
            
            const answerKeys = Object.keys(flag.multipleChoice.answers);
            if (answerKeys.length < 2) {
                showAlert(`Flag ${j + 1} - Multiple choice flags require at least 2 answer options`, 'Too Few Answers');
                return;
            }
            if (answerKeys.length > 5) {
                showAlert(`Flag ${j + 1} - Multiple choice flags can have at most 5 answer options`, 'Too Many Answers');
                return;
            }
            
            const hasCorrectAnswer = Object.values(flag.multipleChoice.answers).some(answer => answer.correct);
            if (!hasCorrectAnswer) {
                showAlert(`Flag ${j + 1} - Please mark at least one answer as correct`, 'No Correct Answer');
                return;
            }
        } else {
            // Validate static flag
            const flagStaticValidation = validateFlagStatic(flag.static);
            if (!flagStaticValidation.valid) {
                showAlert(`Flag ${j + 1} - Flag Value: ${flagStaticValidation.error}`, 'Validation Error');
                return;
            }
        }
    }

    // Validate DNS entries for non-static services (max one per service)
    if (!formData.static) {
        for (let i = 0; i < formData.instances.length; i++) {
            const instance = formData.instances[i];
            if (instance.dns.length > 1) {
                showAlert(`Service ${i + 1} can only have one DNS entry. Please remove extra DNS entries.`, 'Too Many DNS Entries');
                return;
            }
            for (let j = 0; j < instance.dns.length; j++) {
                const dns = instance.dns[j];
                const dnsValidation = validateDnsName(dns.name);
                if (!dnsValidation.valid) {
                    showAlert(`Service ${i + 1}, DNS Entry: ${dnsValidation.error}`, 'Validation Error');
                    return;
                }
            }
        }
    }

    // Check for duplicates (images, flag tags, DNS names)
    const duplicateValidation = validateNoDuplicates(formData);
    if (!duplicateValidation.valid) {
        showAlert(duplicateValidation.error, 'Duplicate Values Found');
        return;
    }

    // Validate translations
    const translationValidation = validateTranslations(formData);
    if (!translationValidation.valid) {
        showAlert(translationValidation.error, 'Translation Validation Error');
        return;
    }

    try {
        const yaml = generateYamlFromData(formData);
        const blob = new Blob([yaml], { type: 'application/x-yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'challenge.yml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        showAlert(error.message, 'Error Generating YAML');
    }
}

function downloadFromPreview() {
    if (previewYamlData) {
        generateYaml();
        closePreview();
    }
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

function resetForm() {
    showConfirm('Are you sure you want to reset the form? All data will be lost.', 'Reset Form', function (result) {
        if (result) {
            document.getElementById('challengeForm').reset();
            document.getElementById('instancesContainer').innerHTML = '';
            document.getElementById('flagsContainer').innerHTML = '';
            instanceCounter = 0;
            flagCounter = 0;
            answerCounter = 0;
            addInstance();
        }
    });
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('previewModal');
    if (event.target == modal) {
        closePreview();
    }
}

