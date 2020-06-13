// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    let ServerDATA = await DB.servers.get(msg.guild.id);
    const modPass = PLX.modPass(msg.member,"manageMessages", ServerDATA);
    if (!modPass) {
        return msg.reply($t('responses.errors.insuperms', P)).catch(console.error);
    };

    
    let filter, censor, Target,endMessage,revFil;
    if(msg.args[0]==="reverse_filter" || msg.args[0]==="!"){
        revFil = true;
        msg.args.shift();
    }

    if(msg.args[0]=="bots"){
        filter = mes=>mes.author.bot;
        count = msg.args[1] || 100;
        endMessage = `${revFil?"Filtered":"Purged %X"} messages from Bots`
    }
    else if(msg.args[0]=="content"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 250;
        endMessage = `${revFil?"Filtered":"Purged %X"} messages including *\`${censor}\`*`
        filter =  mes=>mes.content.includes(censor);
    }
    else if(msg.args[0]=="images"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 100;
        endMessage = `${revFil?"Filtered":"Purged %X"} messages including Images`
        filter =  mes=> {
            if (mes.attachments && mes.attachments.length>0) {
              if (mes.attachments[0].url) {
                return true
              }
            }
            if (mes.embeds && mes.embeds.length>0) {
              if (mes.embeds[0].type === 'image' && mes.embeds[0].url) {
                return true
              }
            }
        }
    }
    else if(msg.args[0]=="images"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 100;
        endMessage = `Purged %X messages **not** including any images`
        filter =  mes=> {
            if (mes.attachments && mes.attachments.length>0) {
                if (mes.attachments[0].url) {
                    return false
                }
            }
            if (mes.embeds && mes.embeds.length>0) {
                if (mes.embeds[0].type === 'image' && mes.embeds[0].url) {
                    return false
                }
            }
            return true;
        }
    }
    else if(msg.args[0]=="links"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 100;
        endMessage = `${revFil?"Filtered":"Purged %X"} messages including Links`
        filter =  mes=> mes.content.includes("http");
    }
    else {
        Target = await PLX.getTarget(msg.args[0], msg.guild);
        if(Target){
            count = parseInt(msg.args[1]) || 100;
            endMessage = `${revFil?"Filtered":"Purged %X"} messages from user ${Target.tag}`
            filter = mes=>mes.author.id == Target.id;
        }
    }

    let newFilter;
if(revFil){
    newFilter = function(x){
        return !filter(x);
    }
}else{
    newFilter = filter
}

msg.channel.send(`Deleting messages...`)
msg.channel.purge( count, newFilter, msg.id).then(x=>{
    console.log(x);
    msg.channel.send(endMessage.replace("%X",x))
})

}
module.exports={
    init
    ,pub:true
    ,cmd:'purge'
    ,perms:3
    ,cat:'mod'
    ,botPerms:['manageMessages']
    ,aliases:['prune']
}