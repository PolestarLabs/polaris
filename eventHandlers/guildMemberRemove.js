module.exports = async (guild,member) =>{
    Promise.all([DB.servers.get(guild.id),DB.users.get(member.id)]).timeout(800).then( ([svData,userData]) => {

     

        if(!svData ||!svData.modules.FWELL.enabled) return null;

        let fwellTimer   = svData.modules.FWELL.timer
        let fwellText    = svData.modules.FWELL.text
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


        let embed 
        try{
            embed = fwellText[1] ? JSON.parse(fwellText[1]) : null;
        }catch(err){
            embed = null
        }
        fwellText = fwellText[0]||fwellText
        
        let fwellChannel = svData.modules.FWELL.channel
        let fwellSkin    = svData.modules.FWELL.type
        let fwellImage    = svData.modules.FWELL.image
        fwellImage&&embed? embed.image={url:"attachment://out.png"}: null;

        embed.color = embed.color == 0 ? parseInt((userData.modules.favcolor||'#FF3355').replace('#',''),16) : embed.color;
       

        const P={ lngs: [svData.modules.LANGUAGE,"dev"] };        
        let txt = $t('logs.userLeave',P).replace(/\*/g,"");
        
        let url = `${paths.CDN}/generators/userio/out/${member.id}/${fwellSkin||"minimal"}.png?text=${encodeURIComponent(txt)}`
        
        resolveFile(url).then(async buffer=>{
            PLX.getChannel(fwellChannel).send({content:fwellText,embed}, (fwellImage ? file(buffer,"out.png") : null )).then(ms=>{
                if(fwellTimer) ms.deleteAfter(fwellTimer).catch(e=>null);
            }).catch(console.error)
        }).catch(console.error);

    }).catch(e=>null);
}