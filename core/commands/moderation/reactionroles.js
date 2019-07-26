// const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');

const init = async function (msg,args){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    const subcommand = msg.args[0]
    const arg1 = msg.args[1] // channel
    const arg2 = msg.args[2] // message
    const arg3 = msg.args[3] // emoji
    const arg4 = msg.args[4] // role    

    const serverData = await DB.servers.get(msg.guild.id,{'modules.MODROLE':1});
    if(!PLX.modPass(msg.member,'manageRoles',serverData)) return msg.addReaction(gear.nope);   

    const rolefind = (x)=> (msg.guild.roles.find(rl => args.slice(x).join(' ').toLowerCase() === rl.name.toLowerCase()) || msg.guild.roles.find(rl=> rl.id==msg.roleMentions[0]) );

    let ACK = rand$t('responses.verbose.interjections.acknowledged',P)+" ";
    let YATT = rand$t('responses.verbose.interjections.yatta',P)+" ";
    let OHNOE = rand$t('responses.verbose.interjections.ohmy_negative',P);
    let noChannelError =  $t('responses.errors.cantFindChannel',P);
    let noReactionsMessageError = $t('responses.errors.cantFindMessageID',P);
    let emojiError = OHNOE+" "+$t('responses.errors.emojiError',P);
    let nosuchrole = $t('responses.errors.nosuchrole',P);
    let reactionRemoveSuccess = ACK+$t('interface.reactroles.removed',P);
    let noReactionDelete = $t('interface.reactroles.noReactionDel',P);
    let success = YATT+$t('interface.reactroles.success',P);
    let disROLE = $t('terms.discord.role',P);
    let disREACT = $t('terms.discord.reaction',P);


    if (subcommand == "add"){
        try{
        if (/^<#[0-9]{11,19}>$/.test(arg1)){
            let channel = msg.channelMentions[0];     
            PLX.getMessage(channel,arg2).then(message=>{
                if( msg.guild.roles.find(r=>r.id== rolefind(4).id )){
                    let role = rolefind(4);
                    argmoji =  arg3.replace("<:a:","").replace(">","").replace("<:","");
                    message.addReaction( argmoji ).then(ok=>{
                        console.log({message:message.id,channel})
                        DB.reactRoles.set({message:message.id,channel,server:msg.guild.id}, {$addToSet:{'rolemoji':{role:role.id,emoji:argmoji }}} ).then(db=>{
                            msg.channel.send({
                                content: success,
                                embed: {
                                    author:{
                                        name:message.author.username,
                                        icon_url:message.author.avatarURL
                                    },
                                    description: `
                                    ${"```"+message.content+"```"}
                                    ${disROLE}: <@&${role.id}> | ${disREACT}: ${arg3}
                                    `
                                }
                            })
                        })
                    }).catch(err=>{
                        msg.channel.send(emojiError)
                    })

                }else{
                    msg.channel.send(nosuchrole);  
                }

            }).catch(e=>{
                msg.channel.send(nosuchrole);
                console.log(e)
            })
        }else{
            return msg.channel.send(noChannelError)
        }
        
        }catch(err){
            console.error(err);
            return msg.channel.send(_emoji('nope') + "**ERROR** Please Contact Support~")
        }
        
        return null;
    }

    const ReactionData = await DB.reactRoles.find({server:msg.guild.id});
    
    if (subcommand == "del"){

        let emojiQuery = (arg2||"") //.replace("<:a:","").replace(">","").replace("<:","");

        let messageReactionData = ReactionData.find(r=>r.message==arg1);
        if(arg1 && messageReactionData){

            let reactionItem = messageReactionData.rolemoji.find(e=>e.emoji==emojiQuery);           
            if(arg2 && reactionItem ){
                DB.reactRoles.set({server:msg.guild.id,message:arg1},{$pull:{rolemoji:reactionItem}});
                PLX.removeMessageReaction(messageReactionData.channel,arg1,emojiQuery).catch(e=>null);
                msg.channel.send(reactionRemoveSuccess);
                
            }else{
                msg.channel.send("")
                await DB.reactRoles.remove({server:msg.guild.id,message:arg1});
                PLX.removeMessageReactions(messageReactionData.channel,arg1).catch(e=>null);
                P.id = arg1
                msg.channel.send(ACK+$t('interface.reactroles.removedAllFrom',P));               
                
            }
        }else{
            msg.channel.send(noReactionDelete)
            list(ReactionData,msg)
        }
        
    }
    if (subcommand == "list"){
        return list(ReactionData,msg);
    }
    if (subcommand == "clear"){
        await DB.reactRoles.remove({server:msg.guild.id});
        msg.channel.send(ACK + $t('interface.reactroles.removeAll',P));
        
        
    }

    

}
module.exports={
    init
    ,pub:true
    ,cmd:'reactionroles'
    ,perms:3
    ,cat:'mod'
    ,botPerms:['manageRoles','manageMessages']
    ,aliases:['rrl']
}


function list(ReactionData,msg){
    let embed=new gear.Embed();
    MS=$t('terms.discord.message',{lngs:msg.lang})
    CH=$t('terms.discord.channel',{lngs:msg.lang})
    RL=$t('terms.discord.role_plural',{lngs:msg.lang})
    RC=$t('terms.discord.reaction_plural',{lngs:msg.lang})
    if(ReactionData.length == 0){
        return msg.channel.send($t('interface.reactroles.noroleshere',{lngs:msg.lang}));
    }
    embed.description = $t('interface.reactroles.reactrolesfor',{lngs:msg.lang, server: msg.guild.name})
    embed.thumbnail(msg.guild.iconURL);
    ReactionData.forEach((rea,i)=>{
        embed.field(MS+" "+(rea.message),`
        
\u200b\u2003 **${CH}**: <#${rea.channel}>
\u200b\u2003 **${RC}/${RL}**:
\u200b\u2003\u2003 ${
            rea.rolemoji.map(rlmj=>{
                return `<:${rlmj.emoji}> <@&${rlmj.role}>`
            }).join('\n\u200b\u2003\u2003 ')
        }
        
        `,true)

    })
    msg.channel.send({embed})
}