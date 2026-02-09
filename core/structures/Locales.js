const { PolluxEmoji } = require("@polestar/emoji-grimoire/PolluxEmojiClass");

const _emoji = (name, fallback) => new PolluxEmoji(name, fallback);

const i18n = [{
  code: ["en", "en-us", "en-gb", "en-uk", "en-ca"],
  iso: "en",
  name: "english",
  "name-e": "english",
  flag: "🇬🇧",
  "site-flag": "GB",
}, {
  code: ["es"],
  iso: "es-ES",
  name: "español",
  "name-e": "spanish",
  flag: "🇪🇸",
  "site-flag": "ES",
}, {
  code: ["cr", "cree"],
  iso: "cr",
  name: "CREE",
  "name-e": "CREE",
  flag: "🤠",
  "site-flag": "CR",
}, {
  code: ["cz", "cs"],
  iso: "cs",
  name: "čeština",
  "name-e": "czech",
  flag: "🇨🇿",
  "site-flag": "CZ",
}, {
  code: ["pt", "pt-br", "caralho"],
  iso: "pt-BR",
  name: "português brasileiro",
  "name-e": "Brazilian Portuguese",
  flag: "🇧🇷",
  "site-flag": "BR",
}, {
  code: ["pt-pt", "pt-eu"],
  iso: "pt",
  name: "português europeu",
  "name-e": "European Portuguese",
  flag: "🇵🇹",
  "site-flag": "PT",
}, {
  code: ["ro"],
  iso: "ro",
  name: "română",
  "name-e": "romanian",
  flag: "🇷🇴",
  "site-flag": "RO",
}, {
  code: ["zh", "ch", "zh-tw"],
  iso: "zh-TW",
  name: "繁體中文",
  "name-e": "traditional chinese",
  flag: "🇹🇼",
  "site-flag": "TW",
}, {
  code: ["de"],
  iso: "de",
  name: "deutsch",
  "name-e": "german",
  flag: "🇩🇪",
  "site-flag": "DE",

}, {
  code: ["fr"],
  iso: "fr",
  name: "français",
  "name-e": "french",
  flag: "🇫🇷",
  "site-flag": "FR",

}, {
  code: ["hu", "my"],
  iso: "hu",
  name: "magyar",
  "name-e": "hungarian",
  flag: "🇭🇺",
  "site-flag": "HU",
}, {
  code: ["ru", "py"],
  iso: "ru",
  name: "русский",
  "name-e": "russian",
  flag: "🇷🇺",
  "site-flag": "RU",
}, {
  code: ["ko"],
  iso: "ko",
  name: "한국어",
  "name-e": "Korean",
  flag: "🇰🇷",
  "site-flag": "KR",
}, {
  code: ["by"],
  iso: "by",
  name: "белорусский",
  "name-e": "Belarusian",
  flag: "🇧🇾",
  "site-flag": "BY",
}, {
  code: ["pl", "pol"],
  iso: "pl",
  name: "Polski",
  nameContext: "polsku",
  "name-e": "Polish",
  flag: "🇵🇱",
  "site-flag": "PL",
}, {
  code: ["uk", "ua"],
  iso: "ua",
  name: "українська",
  "name-e": "Ukrainian",
  flag: "🇺🇦",
  "site-flag": "UA",
}, {
  code: ["bg"],
  iso: "bg",
  name: "українська",
  "name-e": "български",
  flag: "🇧🇬",
  "site-flag": "BG",
}, {
  code: ["jp", "ja"],
  iso: "ja",
  name: "Japanese",
  "name-e": "Japanese",
  flag: "🇯🇵",
  "site-flag": "JP",
}, {
  code: ["tr", "tur"],
  iso: "tr",
  name: "Türkçe",
  "name-e": "Turkish",
  flag: "🇹🇷",
  "site-flag": "TR",
}, {
  code: ["id", "ind"],
  iso: "id",
  name: "Bahasa Indonesia",
  "name-e": "Indonesian",
  flag: "🇮🇩",
  "site-flag": "ID",
}, {
  code: ["owo", "uwu"],
  iso: "owo",
  name: "OwO",
  "name-e": "OwO",
  flag: _emoji("owo","🏳"),
  "site-flag": "OWO",
},
];

module.exports = {

  i18n,

  langlist: i18n.map((lang) => `${lang.flag} **\`${lang.iso}\`** ${lang.name} `),

};
