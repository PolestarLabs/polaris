// const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const i18n = require('../../structures/Locales.js');

const init = async function (msg,args) {

    const P = {lngs: msg.lang};

    const language = args[0]
    const flag = args[1]
    const serverData = await DB.servers.get(msg.guild.id);

    console.log(args)

    if(language == "refresh"){
        msg.guild.LANG = serverData.modules.LANGUAGE;
        return msg.addReaction(_emoji("yep").reaction);
    }
    
    if(language == "reset"){
        msg.guild.channels.forEach(ch=>ch.LANG = null)
        return msg.addReaction(_emoji("yep").reaction);
    }

    if(language){
        let langTo = i18n.i18n.find(lang=> lang.iso == language || lang.code.includes(language) || [lang.iso.toLowerCase(),lang.name,lang["name-e"].toLowerCase(),lang.flag].includes(language.toLowerCase()) )  
        console.log(langTo)
        if (langTo){
            P.lngs[0] = langTo.iso
            P.LANGUAGE = langTo.nameContext||langTo.name
            let langJok = $t(["responses.langIntro.language_joke",''], P);
            if(langJok.length > 50) langJok = ""; 
            if(['channel','-c'].includes(flag)){
                await DB.channels.set(msg.channel.id,{'modules.LANGUAGE':langTo.iso});
                msg.channel.LANG = langTo.iso;                
                return msg.channel.send(`${langTo.flag} ${$t("responses.langIntro.channel", P)} ${langJok}`);
            }else{
                await DB.servers.set(msg.guild.id,{'modules.LANGUAGE':langTo.iso});
                msg.guild.LANG = langTo.iso;
                return msg.channel.send(`${langTo.flag} ${$t("responses.langIntro.global", P)} ${langJok}`);
            }
        }else{
            return {embed:{description: i18n.langlist.join('\n') }}
        }
    }
    
}
module.exports = {
    init
    , pub: true
    , cmd: 'lang'
    , perms: 3
    , cat: 'moderation'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ['speak']
    , argsRequired: true
}