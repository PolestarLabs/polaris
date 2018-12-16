const LANGFLAGS = {
    "af": ":flag_za:",
    "am": ":flag_et:",
    "ar": ":flag_eg:",
    "az": ":flag_az:",
    "be": ":flag_by:",
    "bg": ":flag_bg:",
    "bn": ":flag_bd:",
    "bs": ":flag_ba:",
    "ca": ":flag_es:",
    "ceb": ":flag_ph:",
    "co": ":flag_fr:",
    "cs": ":flag_cz:",
    "cy": ":flag_gb:",
    "da": ":flag_dk:",
    "de": ":flag_de:",
    "el": ":flag_gr:",
    "en": ":flag_us:",
    "es": ":flag_es:",
    "et": ":flag_ee:",
    "eu": ":flag_es:",
    "fa": ":flag_ir:",
    "fi": ":flag_fi:",
    "fr": ":flag_fr:",
    "fy": ":flag_nl:",
    "ga": ":flag_ie:",
    "gd": ":flag_gb:",
    "gl": ":flag_es:",
    "gu": ":flag_in:",
    "ha": ":flag_ng:",
    "haw": ":flag_us:",
    "hi": ":flag_in:",
    "hr": ":flag_hr:",
    "ht": ":flag_ht:",
    "hu": ":flag_hu:",
    "hy": ":flag_am:",
    "id": ":flag_id:",
    "ig": ":flag_ng:",
    "is": ":flag_is:",
    "it": ":flag_it:",
    "iw": ":flag_il:",
    "ja": ":flag_jp:",
    "jw": ":flag_id:",
    "ka": ":flag_ge:",
    "kk": ":flag_kz:",
    "km": ":flag_kh:",
    "kn": ":flag_in:",
    "ko": ":flag_kr:",
    "ku": ":flag_tr:",
    "ky": ":flag_kg:",
    "la": ":flag_va:",
    "lb": ":flag_lu:",
    "lo": ":flag_la:",
    "lt": ":flag_lt:",
    "lv": ":flag_lv:",
    "mg": ":flag_mg:",
    "mi": ":flag_nz:",
    "mk": ":flag_mk:",
    "ml": ":flag_in:",
    "mn": ":flag_mn:",
    "mr": ":flag_in:",
    "ms": ":flag_my:",
    "mt": ":flag_mt:",
    "my": ":flag_mm:",
    "ne": ":flag_np:",
    "nl": ":flag_nl:",
    "no": ":flag_no:",
    "ny": ":flag_mw:",
    "pl": ":flag_pl:",
    "ps": ":flag_af:",
    "pt": ":flag_br:",
    "ro": ":flag_ro:",
    "ru": ":flag_ru:",
    "sd": ":flag_pk:",
    "si": ":flag_lk:",
    "sk": ":flag_sk:",
    "sl": ":flag_si:",
    "sm": ":flag_ws:",
    "sn": ":flag_zw:",
    "so": ":flag_so:",
    "sq": ":flag_al:",
    "sr": ":flag_rs:",
    "st": ":flag_za:",
    "su": ":flag_id:",
    "sv": ":flag_se:",
    "sw": ":flag_tz:",
    "ta": ":flag_in:",
    "te": ":flag_in:",
    "tg": ":flag_tj:",
    "th": ":flag_th:",
    "tl": ":flag_ph:",
    "tr": ":flag_tr:",
    "uk": ":flag_ua:",
    "ur": ":flag_pk:",
    "uz": ":flag_uz:",
    "vi": ":flag_vn:",
    "xh": ":flag_za:",
    "yo": ":flag_ng:",
    "zu": ":flag_za:"
}

const translate = require('google-translate-api');
const DB = require("../database/db_ops");

module.exports = {
    flagFromLang: function(locale){
        loc = locale.split("-")[0].toLowerCase();
        return {
            name: translate.languages[loc] || "Unknown",
            flag: LANGFLAGS[loc] || ":flag_white:"
          }
    },
    translate : function (textToTrans, langFrom, langTo) {
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
                resolve({
                    embed
                })
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