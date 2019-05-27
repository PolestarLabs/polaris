const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let ServerDATA = await DB.servers.get(msg.guild.id);
    const modPass = gear.modPass(msg.member,null, ServerDATA);
    if (!modPass) return msg.reply($t('CMD.moderationNeeded', P)).catch(e=>null);

    if ((/<#[0-9]{16,19}>/.test(msg.args[0]))){
        nex_msg = msg;
        nex_msg.channel = msg.guild.channels.find(c=>c.id===msg.channelMentions[0]);
        if(!nex_msg.channel) return msg.channel.send(gear.emoji('nope')+" `ERROR :: Channel not set`");
        nex_msg.args = msg.args.slice(1)
        nex_msg.delete = ()=>null;
        require('./say').init(nex_msg);
    }else{
        msg.reply ( $t('responses.errors.cantFindChannel',P) );
    }


}
module.exports={
    init
    ,pub:true
    ,cmd:'saytochannel'
    ,perms:2
    ,cat:'util'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['stc','sayto']
}