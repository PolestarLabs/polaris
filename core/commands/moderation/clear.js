const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
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

let bucket = (await msg.channel.getMessages( msg.args[0], msg.id)).map(m=>m.id);

msg.channel.send(`Deleting messages...`)
msg.channel.deleteMessages(bucket).then(x=>{
    console.log(x);
    msg.channel.send(`Deleted ${msg.args[0]} messages`)
})

}
module.exports={
    init
    ,pub:true
    ,cmd:'clear'
    ,perms:3
    ,cat:'mod'
    ,botPerms:['manageMessages']
    ,aliases:['burn']
}