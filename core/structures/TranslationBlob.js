const LANGFLAGS = {
  en: "🇺🇸",
  es: "🇪🇸",
  de: "🇩🇪",
  fr: "🇫🇷",
  ja: "🇯🇵",
  pt: "🇧🇷",
  af: "🇿🇦",
  am: "🇪🇹",
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
  cy: "🇬🇧",
  da: "🇩🇰",
  el: "🇬🇷",
  et: "🇪🇪",
  eu: "🇪🇸",
  fa: "🇮🇷",
  fi: "🇫🇮",
  fy: "🇳🇱",
  ga: "🇮🇪",
  gd: "🇬🇧",
  gl: "🇪🇸",
  gu: "🇮🇳",
  ha: "🇳🇬",
  haw: "🇺🇸",
  hi: "🇮🇳",
  hr: "🇭🇷",
  ht: "🇭🇹",
  hu: "🇭🇺",
  hy: "🇦🇲",
  id: "🇮🇩",
  ig: "🇳🇬",
  is: "🇮🇸",
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
  ms: "🇲🇾",
  mt: "🇲🇹",
  my: "🇲🇲",
  ne: "🇳🇵",
  nl: "🇳🇱",
  no: "🇳🇴",
  ny: "🇲🇼",
  pl: "🇵🇱",
  ps: "🇦🇫",
  ro: "🇷🇴",
  ru: "🇷🇺",
  sd: "🇵🇰",
  si: "🇱🇰",
  sk: "🇸🇰",
  sl: "🇸🇮",
  sm: "🇼🇸",
  sn: "🇿🇼",
  so: "🇸🇴",
  sq: "🇦🇱",
  sr: "🇷🇸",
  st: "🇿🇦",
  su: "🇮🇩",
  sv: "🇸🇪",
  sw: "🇹🇿",
  ta: "🇮🇳",
  te: "🇮🇳",
  tg: "🇹🇯",
  th: "🇹🇭",
  tl: "🇵🇭",
  tr: "🇹🇷",
  uk: "🇺🇦",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  xh: "🇿🇦",
  yo: "🇳🇬",
  "zh-cn": "🇨🇳",
  "zh-tw": "🇹🇼",
  zu: "🇿🇦",
};

const translate = require("@vitalets/google-translate-api");
// const DB = require("../database/db_ops");

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
        const langFromPost = (langFrom || (res.from.language.iso || "en")).toLowerCase();
        // const gear = require("../utilities/Gearbox");
        const embed = new Embed();
        embed.title("Pollux Machine Translation 5000");
        if (textToTrans.length > 1015) embed.description = $t("responses.warnings.translationTexTooLong", { lngs: [langTo, langFrom, "en", "dev"] });
        embed.field(
          `${LANGFLAGS[langFromPost]} ${translate.languages[langFromPost]}`,
          `${(textToTrans.length < 1015 ? "*```tex\n" : "") + textToTrans}\`\`\`*`,
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
    const langsAvailable = Object.keys(translate.languages);
    if (langsAvailable.includes(msg.args[0])) {
      langFrom = langsAvailable.includes(msg.args[1]) ? msg.args.shift() : "auto";
      langTo = msg.args.shift();
    } else {
      langFrom = "auto";
      [langTo] = (msg.channel.LANG || msg.guild.LANG || "en").split("-");
    }
    const textToTrans = msg.args.join(" ");
    return { textToTrans, langFrom, langTo };
  },

};
