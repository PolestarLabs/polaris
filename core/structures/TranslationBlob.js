const LANGFLAGS = {
    "en" : "🇺🇸",
    "es" : "🇪🇸",
    "de" : "🇩🇪",
    "fr" : "🇫🇷",
    "ja" : "🇯🇵",
    "pt" : "🇧🇷",
    "af" : "🇿🇦",
    "am" : "🇪🇹",
    "ar" : "🇪🇬",
    "az" : "🇦🇿",
    "be" : "🇧🇾",
    "bg" : "🇧🇬",
    "bn" : "🇧🇩",
    "bs" : "🇧🇦",
    "ca" : "🇪🇸",
    "ceb" : "🇵🇭",
    "co" : "🇫🇷",
    "cs" : "🇨🇿",
    "cy" : "🇬🇧",
    "da" : "🇩🇰",
    "el" : "🇬🇷",
    "et" : "🇪🇪",
    "eu" : "🇪🇸",
    "fa" : "🇮🇷",
    "fi" : "🇫🇮",
    "fy" : "🇳🇱",
    "ga" : "🇮🇪",
    "gd" : "🇬🇧",
    "gl" : "🇪🇸",
    "gu" : "🇮🇳",
    "ha" : "🇳🇬",
    "haw" : "🇺🇸",
    "hi" : "🇮🇳",
    "hr" : "🇭🇷",
    "ht" : "🇭🇹",
    "hu" : "🇭🇺",
    "hy" : "🇦🇲",
    "id" : "🇮🇩",
    "ig" : "🇳🇬",
    "is" : "🇮🇸",
    "it" : "🇮🇹",
    "iw" : "🇮🇱",
    "jw" : "🇮🇩",
    "ka" : "🇬🇪",
    "kk" : "🇰🇿",
    "km" : "🇰🇭",
    "kn" : "🇮🇳",
    "ko" : "🇰🇷",
    "ku" : "🇹🇷",
    "ky" : "🇰🇬",
    "la" : "🇻🇦",
    "lb" : "🇱🇺",
    "lo" : "🇱🇦",
    "lt" : "🇱🇹",
    "lv" : "🇱🇻",
    "mg" : "🇲🇬",
    "mi" : "🇳🇿",
    "mk" : "🇲🇰",
    "ml" : "🇮🇳",
    "mn" : "🇲🇳",
    "mr" : "🇮🇳",
    "ms" : "🇲🇾",
    "mt" : "🇲🇹",
    "my" : "🇲🇲",
    "ne" : "🇳🇵",
    "nl" : "🇳🇱",
    "no" : "🇳🇴",
    "ny" : "🇲🇼",
    "pl" : "🇵🇱",
    "ps" : "🇦🇫",
    "ro" : "🇷🇴",
    "ru" : "🇷🇺",
    "sd" : "🇵🇰",
    "si" : "🇱🇰",
    "sk" : "🇸🇰",
    "sl" : "🇸🇮",
    "sm" : "🇼🇸",
    "sn" : "🇿🇼",
    "so" : "🇸🇴",
    "sq" : "🇦🇱",
    "sr" : "🇷🇸",
    "st" : "🇿🇦",
    "su" : "🇮🇩",
    "sv" : "🇸🇪",
    "sw" : "🇹🇿",
    "ta" : "🇮🇳",
    "te" : "🇮🇳",
    "tg" : "🇹🇯",
    "th" : "🇹🇭",
    "tl" : "🇵🇭",
    "tr" : "🇹🇷",
    "uk" : "🇺🇦",
    "ur" : "🇵🇰",
    "uz" : "🇺🇿",
    "vi" : "🇻🇳",
    "xh" : "🇿🇦",
    "yo" : "🇳🇬",
    "zh-cn" : "🇨🇳",
    "zh-tw" : "🇹🇼",
    "zu" : "🇿🇦"
}

const translate = require('google-translate-api');
const DB = require("../database/db_ops");

module.exports = {
    LANGNAMES : translate.languages,
    LANGFLAGS,
    flagFromLang: function(locale){
        loc = locale.split("-")[0].toLowerCase();
        return {
            name: translate.languages[loc] || "Unknown",
            flag: LANGFLAGS[loc] || ":flag_white:"
          }
    },
    translate : function (textToTrans, langFrom, langTo,txOnly=false) {
        const locale = require('../../utils/i18node');
        const $t = locale.getT();
        return new Promise(async resolve => {
            translate(textToTrans, {
                from: langFrom,
                to: langTo
            }).then(res => {
                let langFromPost = res.from.language.iso;
                const gear = require("../utilities/Gearbox");
                const embed = new gear.Embed;
                embed.title("Pollux Machine Translation 5000")
                if(textToTrans.length>1015) embed.description = $t('responses.warnings.translationTexTooLong',{lngs:[langTo,langFrom,'en','dev']});
                embed.field(`${LANGFLAGS[langFromPost]} ${translate.languages[langFromPost]}`, (textToTrans.length<1015?"*```tex\n":"") + textToTrans + "```*")
                embed.field(`${LANGFLAGS[langTo]} ${translate.languages[langTo]}`,  (textToTrans.length<1015?"```fix\n":"")  + res.text + "```")
                if (txOnly) return resolve(res.text);                
                resolve({embed});
            }).catch(err => {
                console.error(err);
                resolve("ERROR");
            });
        })
    },
    grabLang : async function (msg) {

        let svData, chData, langTo, langFrom, textToTrans;
        await Promise.all([
            svData = (await DB.channels.get(msg.channel.id)),
            chData = (await DB.servers.get(msg.guild.id))
        ]);

        let langsAvailable = Object.keys(translate.languages);
        if (msg.args.length > 2) {
            if (langsAvailable.includes(msg.args[0]) && langsAvailable.includes(msg.args[1])) {
                langFrom = msg.args[0]
                langTo = msg.args[1]
                textToTrans = msg.args.slice(2).join(' ')
            } else {
                oneArg()
            }
        } else if (msg.args.length > 1) {
            oneArg()
        }

        function oneArg() {
            if (langsAvailable.includes(msg.args[0])) {
                langTo = msg.args[0]
                textToTrans = msg.args.slice(1).join(' ')
            }
        }

        if (!langTo) {
            langTo = (chData.LANGUAGE || svData.modules.LANGUAGE || 'en').split('-')[0];
            textToTrans = msg.args.join(' ')
        }
        if (langTo === "dev") langTo = "en";

        return {textToTrans,langFrom,langTo};
        
    }

}