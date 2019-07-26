module.exports = async (guild,member) =>{
    DB.servers.get(guild.id).then(svData => {

        if(!svData.modules.FWELL.enabled) return null;

        let fwellTimer   = svData.modules.FWELL.timer
        let fwellText    = svData.modules.FWELL.text
                .replace(/%user%/g, `<@${member.id}>`)      
                .replace(/%userid%/g, `${member.id}`)        
                .replace(/%time%/g, `${new Date()}`)        
                .replace(/%usermention%/g, `<@${member.id}>`)                           
                .replace(/%username%/g, member.user.username)
                .replace(/%tag%/g, member.user.tag)
                .replace(/%server%/g, guild.name)
                .replace(/%servername%/g, guild.name).split("%embed%")


        let embed 
        try{
            embed = JSON.parse(fwellText[1]) || null;
        }catch(err){
            embed = null
        }
        fwellText = fwellText[0]
        
        let fwellChannel = svData.modules.FWELL.channel
        let fwellSkin    = svData.modules.FWELL.type
        let fwellImage    = svData.modules.FWELL.image
        fwellImage&&embed? embed.image={url:"attachment://out.png"}: null;

        const P={ lngs: [svData.modules.LANGUAGE,"dev"] };
        let txt = $t('logs.userLeave',P).replace(/\*/g,"");

        let url = `${paths.CDN}/generators/userio/out/${member.id}/${fwellSkin||"minimal"}.png?text=${encodeURIComponent(txt)}`
        
        resolveFile(url).then(async buffer=>{
            PLX.getChannel(fwellChannel).send({content:fwellText,embed}, (fwellImage ? file(buffer,"out.png") : null )).then(ms=>{
                if(fwellTimer) ms.deleteAfter(fwellTimer).catch(e=>null);
            }).catch(e=>null)
        });

    });
}