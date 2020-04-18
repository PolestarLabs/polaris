const {Embed} = require('eris')
//const locale = require('../../utils/i18node');
//const $t = locale.getT();
const coinbase = require("../../resources/lists/discoin.json");
const $d = require("./infra.json").decoration;
const langlistage = require('./Locales').langlist;


exports.run = function run(cmd, m, third, extras) {

  const ICONSET = "dusk"

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
    emb.thumbnail($d[third].thumb.replace('%ICONSET%',ICONSET))
  } catch (e) {
    emb.setColor("#eee")
  }
 
  emb.footer(`${v.mod}: ${v.name} | ${third.toUpperCase()} > ${cmd}`, "https://img.icons8.com/"+ICONSET+"/250/puzzle.png");
  emb.author($t("help.commUsage", {
    lngs: m.lang,
    comm: m.prefix + cmd
  }), PLX.user.displayAvatarURL, "http://Pollux.fun/commands");

  emb.description($t(["commands:help." + cmd, "commands:meta.notDocumented"], {
    lngs: m.lang,
    prefix: m.prefix
  }) + "\n\n");

  emb.field("**" + $t("dict.usage", {
    lngs: m.lang
  }) + "**", $t(["commands:usage." + cmd, `commands:addends.${extras.scope}`,`\`${m.prefix}${cmd}\`` ], {
    lngs: m.lang,
    prefix: m.prefix,
    command: cmd,
    prepend: i18n.exists("commands:usage." + cmd)?'':"`{{prefix}}{{command}}` -",
    websiteRoot: paths.CDN, 
    squad: "- PurpleCat\n - Shamisu\n - Pollyanna\n - Kurono\n - Yuki\n - Celeste"
  }), false);
  
  extras.aliases?emb.field("Aliases:",extras.aliases.map(y=>`\`${y}\``).join(' '),false):false;
console.log({extras})
  if(extras.related){
    emb.field("**" + $t(["dict.seeAlso","See Also"], {lngs: m.lang}) + "**", 
      extras.related.map(ex=> `\n\u200b • \`${m.prefix}${ex}\``).join('')
    , false)
  }

  

  if (cmd == "exchange") {
    
    let litzka = "\u200b"
    
    for (i in coinbase) {
      if (i != "DISCOIN" && i != "RBN") litzka += "  `" + i + "`  " + coinbase[i].icon + `  **${coinbase[i].bot}**  ${coinbase[i].name}` + "\n"
    };

    emb.field("\u200b", litzka, false)

  }
  
  if (third === "lang") {
    emb.field("**" + $t("usage.speakAvailable", {
      lngs: m.lang
    }) + "**", langlistage.languages.join('\n'), false)
  }
  m.channel.send({
    embed: emb
  })
}