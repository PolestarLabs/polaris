module.exports = async (guild,member) =>{
    Promise.all([DB.servers.get(guild.id),DB.users.get(member.id)]).timeout(800).then( ([svData,userData]) => {

        

        if(!svData || !svData.modules.GREET.enabled) return null;
        

        let welcomeTimer   = svData.modules.GREET.timer
        let welcomeText    = svData.modules.GREET.text
                .replace(/%pfLink%/g, `${paths.CDN}/profile/${userData.personalhandle || userData.id}`)
                .replace(/%lvGlobal%/g, `${userData.modules.level}`)
                .replace(/%reputation%/g, `${userData.modules.commend ||0}`)
                .replace(/%membernumber%/g, `${guild.memberCount}`)
                .replace(/%user%/g, `<@${member.id}>`)             
                .replace(/%userid%/g, `${member.id}`)             
                .replace(/%usermention%/g, `<@${member.id}>`)                           
                .replace(/%mention%/g, `<@${member.id}>`)                           
                .replace(/%username%/g, member.user.username)
                .replace(/%tag%/g, member.user.tag)
                .replace(/%server%/g, guild.name)                
                .replace(/%servername%/g, guild.name)
                .replace(/%serverIcon%/g, `${guild.iconURL}`)
                .replace(/%userAvatar%/g, `${member.user.avatarURL}`)
                .replace(/%userBackground%/g, `${paths.CDN}/backdrops/${userData.modules.bgID}.png`)
                .split("%embed%")
        
        welcomeText[0] = welcomeText[0].replace(/[^<]#([^ |^>|^"]+)/g, (m,p1)=>'<#'+(guild.channels.find(x=>x.name == p1)||{id:'0000000'}).id+'>' )

        let embed 
        try{
            embed = JSON.parse(welcomeText[1]) || null;
        }catch(err){
            console.error(err)
            embed = undefined
        }   

        welcomeText =welcomeText[0]||welcomeText;
        
        let welcomeChannel = svData.modules.GREET.channel
        let welcomeSkin    = svData.modules.GREET.type
        let welcomeImage    = svData.modules.GREET.image
        welcomeImage&&embed? embed.image={url:"attachment://in.png"}: null;

        embed.color = embed.color == 0 ? parseInt((userData.modules.favcolor||'#FF3355').replace('#',''),16) : embed.color;
        
        const P={ lngs: [svData.modules.LANGUAGE || "en", "dev"] };
        let txt = $t('logs.userJoin',P).replace(/\*/g,"");
        
        let url = `${paths.CDN}/generators/userio/in/${member.id}/${welcomeSkin||"minimal"}.png?text=${encodeURIComponent(txt)}`
      
        resolveFile(url).then(async buffer=>{
 
            PLX.getChannel(welcomeChannel).send({content:welcomeText, embed}, (welcomeImage ? file(buffer,"in.png") : null)).then(ms=>{
                if(welcomeTimer) ms.deleteAfter(welcomeTimer).catch(e=>null);
            }).catch(console.error)
        }).catch(console.error);

    }).catch(e=>null);
}










