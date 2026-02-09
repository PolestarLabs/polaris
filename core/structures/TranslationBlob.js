//FUTURE[epic=anyone] (Low Priority) - Flag Arrays

const LANGFLAGS = {
  //en: "🇬🇧/🇺🇸/🇦🇺/🇳🇿/🇨🇦",
  en: "🇨🇦",
  //es: "🇪🇸/🇲🇽/🇦🇷",
  es: "🇦🇷",
  //de: "🇩🇪/🇧🇪/🇦🇹/🇨🇭",
  de: "🇩🇪",
  //fr: "🇫🇷/🇨🇭/🇨🇦/🇧🇪",
  fr: "🇫🇷",
  ja: "🇯🇵",
  //pt: "🇵🇹/🇧🇷/🇲🇴",
  pt: "🇧🇷",
  af: "🇿🇦",
  am: "🇪🇹",
  //ar: "🇪🇬/🇶🇦/🇮🇶/🇲🇦/🇦🇪",
  ar: "🇪🇬",
  az: "🇦🇿",
  be: "🇧🇾",
  bg: "🇧🇬",
  bn: "🇧🇩",
  bs: "🇧🇦",
  ca: "🇪🇸",
  ceb: "🇵🇭",
  co: "🇫🇷",
  cs: "🇨🇿",
  cy: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", // Cymru (Welsh)
  //da: "🇩🇰/🇫🇴",
  da: "🇩🇰",
  //el: "🇬🇷/🇨🇾",
  el: "🇬🇷",
  et: "🇪🇪",
  eu: "🇪🇸",
  //fa: "🇮🇷/🇦🇫/🇹🇯",
  fa: "🇮🇷",
  fi: "🇫🇮",
  fy: "🇳🇱",
  //ga: "🇮🇪",
  ga: "🇮🇪",
  gd: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", // Scottish Gaelic
  gl: "🇪🇸",
  gu: "🇮🇳",
  //ha: "🇳🇬/🇳🇪/🇬🇭",
  ha: "🇳🇬",
  haw: "🇺🇸",
  hi: "🇮🇳",
  //hr: "🇭🇷/🇧🇦",
  hr: "🇭🇷",
  ht: "🇭🇹",
  hu: "🇭🇺",
  hy: "🇦🇲",
  id: "🇮🇩",
  //ig: "🇳🇬/🇬🇶",
  ig: "🇳🇬",
  is: "🇮🇸",
  //it: "🇮🇹/🇨🇭/🇻🇦/🇸🇲",
  it: "🇮🇹",
  iw: "🇮🇱",
  jw: "🇮🇩",
  ka: "🇬🇪",
  kk: "🇰🇿",
  km: "🇰🇭",
  kn: "🇮🇳",
  ko: "🇰🇷",
  ku: "🇹🇷",
  ky: "🇰🇬",
  la: "🇻🇦",
  lb: "🇱🇺",
  lo: "🇱🇦",
  lt: "🇱🇹",
  lv: "🇱🇻",
  mg: "🇲🇬",
  mi: "🇳🇿",
  mk: "🇲🇰",
  ml: "🇮🇳",
  mn: "🇲🇳",
  mr: "🇮🇳",
  //ms: "🇲🇾/🇸🇬/🇧🇳",
  ms: "🇲🇾",
  mt: "🇲🇹",
  my: "🇲🇲",
  ne: "🇳🇵",
  //ne: "🇳🇵/🇮🇳",
  nl: "🇳🇱",
  //nl: "🇳🇱/🇧🇪/🇸🇷",
  no: "🇳🇴",
  ny: "🇲🇼",
  //ny: "🇲🇼/🇿🇲",
  pl: "🇵🇱",
  //ps: "🇦🇫/🇵🇰",
  ps: "🇦🇫",
  ro: "🇷🇴",
  //ro: "🇷🇴/🇲🇩",
  ru: "🇷🇺",
  //sd: "🇵🇰/🇮🇳",
  sd: "🇵🇰",
  si: "🇱🇰",
  //sk: "🇸🇰/🇨🇿",
  sk: "🇸🇰",
  sl: "🇸🇮",
  //sm: "🇼🇸/🇦🇸",
  sm: "🇼🇸",
  sn: "🇿🇼",
  //so: "🇸🇴/🇩🇯",
  so: "🇸🇴",
  //sq: "🇦🇱/🇽🇰/🇲🇰/🇲🇪",
  sq: "🇦🇱",
  //sr: "🇷🇸/🇽🇰/🇲🇰/🇲🇪",
  sr: "🇷🇸",
  //st: "🇿🇦/🇱🇸/🇿🇼",
  st: "🇿🇦",
  su: "🇮🇩",
  sv: "🇸🇪",
  //sw: "🇹🇿/🇰🇪/🇷🇼/🇺🇬",
  sw: "🇹🇿",
  //ta: "🇮🇳/🇱🇰/🇸🇬",
  ta: "🇱🇰",
  te: "🇮🇳",
  tg: "🇹🇯",
  th: "🇹🇭",
  tl: "🇵🇭",
  //tr: "🇹🇷/🇨🇾",
  tr: "🇹🇷",
  uk: "🇺🇦",
  //ur: "🇵🇰/🇮🇳",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  //xh: "🇿🇦/🇿🇼",
  xh: "🇿🇦",
  //yo: "🇳🇬/🇧🇯/🇹🇬/🇬🇭",
  yo: "🇳🇬",
  //zh: "🇹🇼/🇭🇰/🇲🇴/🇨🇳",
  zh: "🇹🇼",
  "zh-CN": "🇨🇳",
  //"zh-TW": "🇹🇼/🇭🇰/🇲🇴",
  "zh-TW": "🇹🇼",
  yue: "🇭🇰",
  zu: "🇿🇦",
};

const translate = require("@vitalets/google-translate-api");
// const DB = require("../database/db_ops");
const translateLanguages = (translate && typeof translate.languages === "object" && translate.languages)
  ? translate.languages
  : {};
translate.languages = translateLanguages;
if (!translate.languages.zh) translate.languages.zh = "Chinese";

module.exports = {
  LANGNAMES: translate.languages,
  LANGFLAGS,
  flagFromLang(locale) {
    loc = locale.split("-")[0].toLowerCase();
    return {
      name: translate.languages[loc] || "Unknown",
      flag: LANGFLAGS[loc] || ":flag_white:",
    };
  },
  translate(textToTrans, langFrom, langTo, txOnly = false) {
    // const locale = require('../../utils/i18node');
    // const $t = locale.getT();
    return new Promise((resolve) => {
      translate(textToTrans, {
        from: langFrom,
        to: langTo,
      }).then((res) => {
        const langFromPost = res.from.language.iso;
        // const gear = require("../utilities/Gearbox");
        const embed = new Embed();
        embed.title("Pollux Machine Translation 5000");
        if (textToTrans.length > 1015) embed.description = $t("responses.warnings.translationTexTooLong", { lngs: [langTo, langFrom, "en", "dev"] });
        if (langFrom === "auto") langFrom = langFromPost;
        embed.field(
          `${LANGFLAGS[langFrom]} ${translate.languages[langFrom]}`,
          `${langFrom === langFromPost ? "" : `_${LANGFLAGS[langFromPost]} ${translate.languages[langFromPost]} was detected_`}${(textToTrans.length < 1015 ? "*```tex\n" : "") + textToTrans}\`\`\`*`,
        );
        embed.field(
          `${LANGFLAGS[langTo]} ${translate.languages[langTo]}`,
          `${(textToTrans.length < 1015 ? "```fix\n" : "") + res.text}\`\`\``,
        );
        if (txOnly) return resolve(res.text);
        return resolve({ embed });
      }).catch((err) => {
        console.error(err);
        return resolve("ERROR");
      });
    });
  },
  grabLang(msg) {
    let langTo; let langFrom;
    const langsAvailable = Object.fromEntries(Object.keys(translate.languages).map((l) => [l.toLowerCase(), l]));
    msg.args[0] = this.replaceLang(msg.args[0]);
    if (langsAvailable[msg.args[0].toLowerCase()]) {
      if (msg.args[1]) {
        msg.args[1] = this.replaceLang(msg.args[1]);
        langFrom = langsAvailable[msg.args[1].toLowerCase()] ? langsAvailable[msg.args.shift().toLowerCase()] : "auto";
      } else {
        langFrom = "auto";
      }
      langTo = langsAvailable[msg.args.shift().toLowerCase()];
    } else {
      langFrom = "auto";
      [langTo] = (msg.channel.LANG || msg.guild.LANG || "en").split("-");
    }
    const textToTrans = msg.args.join(" ");
    return { textToTrans, langFrom, langTo };

    /*
    function oneArg() {
      [langTo] = msg.args;
      if (langsAvailable.includes(msg.args[0].toLowerCase())) {
        textToTrans = msg.args.slice(1).join(" ");
      }
    }

    if (msg.args.length > 2) {
      if (langsAvailable.includes(msg.args[0].toLowerCase()) && langsAvailable.includes(msg.args[1].toLowerCase())) {
        [langFrom, langTo] = msg.args;
        textToTrans = msg.args.slice(2).join(" ");
      } else {
        oneArg();
      }
    } else if (msg.args.length > 1) {
      oneArg();
    }

    if (!langTo) {
      [langTo] = (msg.channel.LANG || msg.guild.LANG || "en").split("-");
      textToTrans = msg.args.join(" ");
    }
    if (langTo === "dev") langTo = "en";

    return { textToTrans, langFrom, langTo };
    */
  },

  /**
   * @param {String} key
   */
  replaceLang(key) {
    switch (key.toLowerCase()) {
      case "al": key = "sq"; return key;
      case "arm": key = "hy"; return key;
      case "baq": key = "eu"; return key;
      case "cn": key = "zh-CN"; return key;
      case "cn-hk": key = "zh-TW"; return key;
      case "cn-mo": key = "zh-TW"; return key;
      case "cro": key = "hr"; return key;
      case "cz": key = "cs"; return key;
      case "epo": key = "eo"; return key;
      case "fil": key = "tl"; return key;
      case "frr": key = "fy"; return key;
      case "frs": key = "fy"; return key;
      case "fry": key = "fy"; return key;
      case "gal": key = "gd"; return key;
      case "geo": key = "ka"; return key;
      case "gre": key = "el"; return key;
      case "hk": key = "zh-TW"; return key;
      case "ir": key = "ga"; return key;
      case "jav": key = "jw"; return key;
      case "jp": key = "ja"; return key;
      case "kaz": key = "kk"; return key;
      case "kr": key = "ka"; return key;
      case "mao": key = "mi"; return key;
      case "may": key = "ms"; return key;
      case "mo": key = "zh-TW"; return key;
      case "per": key = "fa"; return key;
      case "se": key = "sv"; return key;
      case "tj": key = "tg"; return key;
      case "tw": key = "zh-TW"; return key;
      case "wel": key = "cy"; return key;
      case "zh": key = "zh-CN"; return key;
      default: return key;
    }
  },

};
