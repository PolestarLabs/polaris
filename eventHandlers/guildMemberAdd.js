// const DB = require('../core/database/db_ops')
const {resolveFile,file} = require('../core/utilities/Gearbox')

module.exports = async (guild,member) =>{
    DB.servers.get(guild.id).then(svData => {

        if(!svData.modules.GREET.enabled) return null;

        let welcomeTimer   = svData.modules.GREET.timer
        let welcomeText    = svData.modules.GREET.text
                .replace(/%user%/g, `<@${member.id}>`)             
                .replace(/%userid%/g, `${member.id}`)             
                .replace(/%usermention%/g, `<@${member.id}>`)                           
                .replace(/%username%/g, member.user.username)
                .replace(/%tag%/g, member.user.tag)
                .replace(/%server%/g, guild.name)
                .replace(/%servername%/g, guild.name).split("%embed%")
                


        let embed 
        try{
            embed = JSON.parse(welcomeText[1]) || null;
        }catch(err){
            embed = null
        }   
        welcomeText =welcomeText[0]
        
        let welcomeChannel = svData.modules.GREET.channel
        let welcomeSkin    = svData.modules.GREET.type
        let welcomeImage    = svData.modules.GREET.image
        console.log(embed)
        welcomeImage&&embed? embed.image={url:"attachment://in.png"}: null;


        const P={ lngs: [svData.modules.LANGUAGE,"dev"] };
        let txt = $t('logs.userJoin',P).replace(/\*/g,"");
        
        let url = `${paths.CDN}/generators/userio/in/${member.id}/${welcomeSkin||"minimal"}.png?text=${encodeURIComponent(txt)}`
      
        resolveFile(url).then(async buffer=>{
            PLX.getChannel(welcomeChannel).send({content:welcomeText,embed}, (welcomeImage ? file(buffer,"in.png") : null)).then(ms=>{
                if(welcomeTimer) ms.deleteAfter(welcomeTimer);
            }).catch(console.error)
        }).catch(console.error);

    });
}