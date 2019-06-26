const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const Gal = require('../../structures/Galleries')

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const Target = gear.getTarget(msg,0,false,false);

    const serverData = await DB.servers.get(msg.guild.id);
    P.imsorry = rand$t('responses.verbose.gomenasai')
    if (!gear.modPass(msg.member,'kickMembers',serverData)) return msg.channel.send( $t('responses.errors.insuperms',P) );

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

    let embed = new gear.Embed();
        P.user = Target.tag
        //embed.author = $('interface.kickban.kickingUser',P);
        embed.author(`👢 Kicking user [${P.user}]`,Target.avatarURL);
        embed.footer(msg.author.tag, msg.author.avatarURL);
        embed.timestamp( new Date() );
        embed.color = 0x36393f
        embed.thumbnail(await Gal.randomOne('kick',true));
        embed.description = gear.emoji('loading') + rand$t('responses.verbose.jas',P);
        
    let reason;
    let pre_msg
    if(msg.args.length == 1){

        embed.description = "*```"+ $t('interface.kickban.waitingForReason',P) +"```*"
        pre_msg = await msg.channel.send({content: gear.emoji('loading') + $t('interface.kickban.includeReason',P)  ,embed});
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

    POLLUX.kickGuildMember(msg.guild.id,Target.id,post_reason).then(m=>{
        embed.color = 0x3355EE
        embed.description = gear.emoji('yep')+"  "+ $t('interface.kickban.userKicked',P) +"\n"+ rand$t('interface.kickban.kickFlavs',P)  + "\n``` "+reason+" ```"
        if(pre_msg){
            pre_msg.edit({content:'',embed})
        }else{
            msg.channel.send( {embed} )
        }
        
    }).catch(err=>{
        msg.channel.send( $t('interface.kickban.userKickError',P) )
    })
  




}
module.exports={
    init
    ,pub:true
    ,cmd:'kick'
    ,perms:2
    ,cat:'mod'
    ,botPerms:['kickMembers']
    ,aliases:[]
}