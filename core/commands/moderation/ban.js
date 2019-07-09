const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const Gal = require('../../structures/Galleries')

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let Target = gear.getTarget(msg,0,false,false);

    const serverData = await DB.servers.get(msg.guild.id);
    P.imsorry = rand$t('responses.verbose.gomenasai')
    if (!gear.modPass(msg.member,'banMembers',serverData)) return msg.channel.send( $t('responses.errors.insuperms',P) );

    if(!msg.args[0]){
        return msg.channel.send( $t('responses.errors.kinNone',P) );
    }
    if(!Target){
        return msg.channel.send( $t('responses.errors.kin404',P) );
    }
    if(Target.id == msg.author.id){
        return msg.channel.send( $t('responses.errors.cantKickSelf',P) );
    }
    if(!(msg.guild.member(Target).kickable)){
        return msg.channel.send( $t('responses.errors.cantKickHim',P) );
    }

    let clear = 0
    let soft = false
    let isFalse = false

    function isParam(arg){
        if(arg === "-purge" || arg == "-p"){
            clear = 7
            msg.args.splice(1,1)
            return true;
        }
        if(arg === '-soft' || arg === '-s') {
            soft = true
            msg.args.splice(1,1)
            return true;
        }
        if(arg === '-false' || arg === '-f') {
            isFalse = true
            msg.args.splice(1,1)
            return true;
        }
        return false;
    }

    while (isParam(msg.args[1]));

    if(isFalse) return console.log('false ban');
    
    P.user = Target.tag
    let embed = new gear.Embed();
        //embed.author = $('interface.kickban.kickingUser',P);
        embed.author(`🔨 Banning user [${P.user}]`,Target.avatarURL);
        embed.footer(msg.author.tag, msg.author.avatarURL);
        embed.timestamp( new Date() );
        embed.color = 0x36393f
        embed.thumbnail(await Gal.randomOne('kick',true));
        embed.description = _emoji('loading') + rand$t('responses.verbose.jas',P);
        
    let reason;
    let pre_msg
    if(msg.args.length == 1){

        embed.description = "*```"+ $t('interface.kickban.waitingForReason',P) +"```*"
        pre_msg = await msg.channel.send({content: _emoji('loading') + $t('interface.kickban.includeReason',P)  ,embed});
        const resp = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id
            , {maxMatches: 1,time: 30e3}
        );

        reason = (resp&&(resp[0]||{}).content) || false;
    }else{
        reason = msg.args.slice(1).join(" ");
    }

    if(!reason) {
        embed.color = 0xee1225
        embed.description=""
        if(pre_msg){
            embed.description = "\u200b\n"+ $t('interface.kickban.noReason',P) +"\n\u200b"
            pre_msg.edit( {
                content: "~~"+$t('interface.kickban.includeReason',P)+"~~",
                embed
            });
        }else{
            msg.channel.send( $t('interface.kickban.noReason',P) );
        }
        return null;

    }else if(reason && reason == "cancel"){
        embed.color = 0xee1225;
        if(!pre_msg) return null;
        embed.description = "\u200b\n"+ $t('interface.kickban.cancelled',P) +"\n\u200b"
        pre_msg.edit( {
            content: "~~"+$t('interface.kickban.includeReason',P)+"~~",
            embed
        });
        return;
    }

    if(!pre_msg){
        pre_msg =  await msg.channel.send({embed});
    }

    let post_reason = reason + `\n  [MOD: ${msg.author.tag}]`

     POLLUX.banGuildMember(msg.guild.id,Target.id, clear ,post_reason).then(banned=>{

            if (soft) {
                POLLUX.unbanGuildMember(msg.guild.id, Target.id, "SOFTBAN REMOVAL")
        }
        embed.color = 0xDD8A55
        embed.description = _emoji('yep')+"  "+ $t('interface.kickban.'+(soft?"userSoftBanned":"userBanned"),P) +" "+ rand$t('interface.kickban.banFlavs',P)  + "\n``` "+reason+" ```"
        if(pre_msg){
            pre_msg.edit({content:'',embed})
        }else{
            msg.channel.send( {embed} )
        }
        
        userBanned = null;
        Target = null;      
    }).catch(err=>{
        msg.channel.send( $t('interface.kickban.userKickError',P)); console.error(err);
    });

}

module.exports={
    init
    ,pub:true
    ,cmd:'ban'
    ,perms:2
    ,cat:'mod'
    ,botPerms:['banMembers']
    ,aliases:[]
}