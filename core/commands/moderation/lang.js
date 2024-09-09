const Languages = require("../../structures/Locales.js");

async function saveLanguage(langTo,scope,interaction,P){     
  if (langTo) {
      
      P.LANGUAGE = langTo.nameContext || langTo.name;
      let langJok = $t(["responses.langIntro.language_joke", ""], P);
      if (langJok.length > 50) langJok = "";
      if (scope === "channel") {
          await DB.channels.set(interaction.message.channel.id, { "modules.LANGUAGE": langTo.iso });
          interaction.channel.LANG = langTo.iso;
          return `${langTo.flag} ${$t("responses.langIntro.channel", P)} ${langJok}`;
      }
      await DB.servers.set(interaction.guild.id, { "modules.LANGUAGE": langTo.iso });
      interaction.guild.LANG = langTo.iso;
      return `${langTo.flag} ${$t("responses.langIntro.global", P)} ${langJok}`;
  }
}

const init = async (msg, args) => {
  const P = { lngs: msg.lang };
  const language = args[0];

  const serverData = await DB.servers.get(msg.guild.id);
  if (!PLX.modPass(msg.member, "kickMembers", serverData)) return msg.channel.send($t("responses.errors.insuperms", P));

  const langOptions = shuffle(Languages.i18n).map(lang => {
    const emj = typeof lang.flag.id === 'string'
    ? { id: lang.flag.id }
    : { name: lang.flag.name || lang.flag };

      return {
          "label": capitalize(lang.name),
          "description": capitalize(lang["name-e"]),
          "value": lang.iso,
          "emoji": emj,
          "default": msg.channel.LANG === lang.iso || msg.guild.LANG === lang.iso
      }
  }).slice(0, 25);
  langOptions.forEach((v,i,a)=>{     
    if (msg.channel.LANG === v.value) v.default = true;
    else v.default = false;
    if (msg.guild.LANG === v.value && !a.filter(x=>x.default).length ) return v.default = true;
    else v.default = false;
  })
  if ( !langOptions.filter(x=>x.default).length ) langOptions.find(x=>x.value==='en').default = true;

  if (language === "refresh") {
    msg.guild.LANG = serverData.modules.LANGUAGE;
    return msg.addReaction(_emoji("yep").reaction);
  }

  if (language === "reset") {
    msg.guild.channels.forEach((ch) => ch.LANG = null);
    return msg.addReaction(_emoji("yep").reaction);
  }

  if (language) {
    const langTo = Languages.i18n.find((lang) => lang.iso === language || lang.code.includes(language) || [lang.iso.toLowerCase(), lang.name, lang["name-e"].toLowerCase(), lang.flag].includes(language.toLowerCase()));
    return await saveLanguage(langTo,args[1]==='-c'?'channel':'server',msg,P);
  }

  msg.reply({
    content: "Changing Language; Select Scope:",
    components: [
      {
        "type": 1,
        "components": [
            {
                "type": 3,
                "placeholder": "Select a scope...",
                "custom_id": "langsel:scope",
                "min_values": 1,
                "max_values": 1,
                "options":  [
                  {
                    "label": "Channel",
                    "description": `Use this language only in #${msg.channel.name}`.slice(0,50),
                    "value": "channel",                    
                    "default": false
                  },
                  {
                    "label": "Server",
                    "description": "Use this language in the entire server.",
                    "value": "server",                    
                    "default": true
                  }
                ]
                     
                
            }
        ]
    },
      {
        "type": 1,
        "components": [
            {
                "type": 3,
                "placeholder": "Select a language...",
                "custom_id": "langsel:language",
                "min_values": 1,
                "max_values": 1,
                "options": langOptions
            }
        ]
    }
    ]
  }) 


  
  
};
module.exports = {
  init,
  pub: true,
  cmd: "lang",
  perms: 3,
  cat: "moderation",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["speak"],
  saveLanguage
};


