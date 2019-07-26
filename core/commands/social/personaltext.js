// const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const userData =  await DB.userDB.findOne({id:msg.author.id});
    const persotxt = msg.args.join(' ')  
  
    await DB.userDB.set(msg.author.id, {$set:{'modules.persotext':persotxt}});
    P.pstext=  "*```css\n"+persotxt+"```*",
    P.prefix=  msg.prefix,
    embed = new gear.Embed
    embed.description = _emoji('yep') + rand$t('responses.verbose.interjections.acknowledged',P) + " " +  $t('profile.persotexUpdate',P) 

    msg.channel.send({embed})

}
module.exports={
    init
    ,pub:true
    ,cmd:'personaltext'
    ,perms:3
    ,cat:'social'
    ,botPerms:['embedLinks']
    ,aliases:['ptxt']
}