const {Embed} = require('eris')
const locale = require('../../utils/i18node');
const $t = locale.getT();
const coinbase = require("../../resources/lists/discoin.json");
const $d = require("./infra.json").decoration;
const langlistage = require('./Locales').langlist;


exports.run = function run(cmd, m, third) {

  const v = {}
  third = third || "misc"
  v.mod = $t("dict.module", {
    lngs: m.lang
  });
  v.name = $t("modules." + third, {
    lngs: m.lang
  });

  let emb = new Embed;
  try {
    emb.setColor($d[third].color)
  } catch (e) {
    emb.setColor("#eee")
  }
 
  emb.thumbnail($d[third].thumb)
  emb.footer(`${v.mod}: ${v.name} | ${third.toUpperCase()} > ${cmd}`, "https://png.icons8.com/puzzle/color/16");
  emb.author($t("help.commUsage", {
    lngs: m.lang,
    comm: m.prefix + cmd
  }), POLLUX.user.displayAvatarURL, "http://Pollux.fun/commands");
  emb.description($t("commands:help." + cmd, {
    lngs: m.lang,
    prefix: m.prefix
  }) + "\n\n")
  emb.field("**" + $t("dict.usage", {
    lngs: m.lang
  }) + "**", $t("commands:usage." + cmd, {
    lngs: m.lang,
    prefix: m.prefix,
    squad: "- PurpleCat\n - Shamisu\n - Pollyanna\n - Kurono\n - Yuki\n - Celeste"
  }), false)
  third.aliases?emb.field("**Aliases:**",third.aliases,false):false;

  if (cmd == "exchange") {
    
    let litzka = "\u200b"
    
    for (i in coinbase) {
      if (i != "DISCOIN" && i != "RBN") litzka += "  `" + i + "`  " + coinbase[i].icon + `  **${coinbase[i].bot}**  ${coinbase[i].name}` + "\n"
    };

    emb.field("\u200b", litzka, false)

  }
  
  if (third === "language") {
    emb.field("**" + $t("usage.speakAvailable", {
      lngs: m.lang
    }) + "**", langlistage.languages.join('\n'), false)
  }
  m.channel.send({
    embed: emb
  })
}