const i18n = [{
    "code": ["en", "en-us", "en-gb", "en-uk", "en-ca"],
    "iso": "en",
    "name": "english",
    "name-e": "english",
    "flag": ":flag_gb:",
    "site-flag": "GB"
}, { 
    "code": ["es"],
    "iso": "es-ES",
    "name": "español",
    "name-e": "spanish",
    "flag": ":flag_es:",
    "site-flag": "ES"
}, {
    "code": ["cr", "cree"],
    "iso": "cr",
    "name": "CREE",
    "name-e": "CREE",
    "flag": ":cowboy:",
    "site-flag": "CR"
}, {
    "code": ["cz", "cs"],
    "iso": "cs",
    "name": "čeština",
    "name-e": "czech",
    "flag": ":flag_cz:",
    "site-flag": "CZ"
}, {
    "code": ["pt", "pt-br", "caralho"],
    "iso": "pt-BR",
    "name": "português brasileiro",
    "name-e": "Brazilian Portuguese",
    "flag": ":flag_br:",
    "site-flag": "BR"
}, {
    "code": ["pt-pt", "pt-eu"],
    "iso": "pt",
    "name": "português europeu",
    "name-e": "European Portuguese",
    "flag": ":flag_pt:",
    "site-flag": "PT"
}, {
    "code": ["ro"],
    "iso": "ro",
    "name": "română",
    "name-e": "romanian",
    "flag": ":flag_ro:",
    "site-flag": "RO"
}, {
    "code": ["zh", "ch", "zh-tw"],
    "iso": "zh-TW",
    "name": "繁體中文",
    "name-e": "traditional chinese",
    "flag": ":flag_tw:",
    "site-flag": "TW"
}, {
    "code": ["de"],
    "iso": "de",
    "name": "deutsch",
    "name-e": "german",
    "flag": ":flag_de:",
    "site-flag": "DE"

}, {
    "code": ["fr"],
    "iso": "fr",
    "name": "français",
    "name-e": "french",
    "flag": ":flag_fr:",
    "site-flag": "FR"

}, {
    "code": ["hu", "my"],
    "iso": "hu",
    "name": "magyar",
    "name-e": "hungarian",
    "flag": ":flag_hu:",
    "site-flag": "HU"
}, {
    "code": ["ru", "py"],
    "iso": "ru",
    "name": "русский",
    "name-e": "russian",
    "flag": ":flag_ru:",
    "site-flag": "RU"
  }, {
    "code": ["ko"],
    "iso": "ko",
    "name": "한국어",
    "name-e": "Korean",
    "flag": ":flag_kr:",
    "site-flag": "KR"
  }, {
    "code": ["by"],
    "iso": "by",
    "name": "белорусский",
    "name-e": "Belarusian",
    "flag": ":flag_by:",
    "site-flag": "BY"
  }, {
    "code": ["pl", "pol"],
    "iso": "pl",
    "name": "Polski",
    "nameContext": "polsku",
    "name-e": "Polish",
    "flag": ":flag_pl:",
    "site-flag": "PL"
  }, {
    "code": ["uk", "ua"],
    "iso": "ua",
    "name": "українська",
    "name-e": "Ukrainian",
    "flag": ":flag_ua:",
    "site-flag": "UA"
   }, {
    "code": ["bg"],
    "iso": "bg",
    "name": "українська",
    "name-e": "български",
    "flag": ":flag_bg:",
    "site-flag": "BG"
   }, {
    "code": ["jp", "ja"],
    "iso": "jp",
    "name": "Japanese",
    "name-e": "Japanese",
    "flag": ":flag_jp:",
    "site-flag": "JP"
}, {
    "code": ["tr", "tur"],
    "iso": "tr",
    "name": "Türkçe",
    "name-e": "Turkish",
    "flag": ":flag_tr:",
    "site-flag": "TR"
}, {
    "code": ["id", "ind"],
    "iso": "id",
    "name": "Bahasa Indonesia",
    "name-e": "Indonesian",
    "flag": ":flag_id:",
    "site-flag": "ID"
}
]

module.exports = {

  i18n,

  langlist: i18n.map(lang => {
    return `${ lang.flag } **\`${ lang.iso }\`** ${lang.name} `
  })

}