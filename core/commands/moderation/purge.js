const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    let filter, censor, Target,endMessage;

    if(msg.args[0]=="bots"){
        filter = mes=>mes.author.bot;
        count = msg.args[1] || 100;
        endMessage = `Purged %X messages from Bots`
    }
    else if(msg.args[0]=="content"){
        censor = msg.args.slice(2).join(' ');
        count = msg.args[1] || 250;
        endMessage = `Purged %X messages including *\`${censor}\`*`
        filter =  mes=>mes.content.includes(censor);
    }
    else if(msg.args[0]=="images"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 100;
        endMessage = `Purged %X messages including Images`
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
    else if(msg.args[0]=="links"){
        censor = msg.args.slice(1).join(' ');
        count = msg.args[1] || 100;
        endMessage = `Purged %X messages including Links`
        filter =  mes=> mes.content.includes("http");
    }
    else if(gear.getTarget(msg)){
        Target = gear.getTarget(msg);
        count = parseInt(msg.args[1]) || 100;
        endMessage = `Purged %X messages from user ${Target.tag}`
        filter = mes=>mes.author.id == Target.id;
    }

msg.channel.send(`Deleting messages...`)
msg.channel.purge( count, filter, msg.id).then(x=>{
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