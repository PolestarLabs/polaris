const gear = require('../../utilities/Gearbox');
const Picto = require('../../utilities/Picto');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const Target = gear.getTarget(msg);

    const embed = new gear.Embed()
        .image(Target.avatarURL)
        .author(Target.tag, null, "https://pollux.fun/p/"+Target.id)
        .color(await(Picto.avgColor(Target.avatarURL)));

    msg.channel.send({embed}).catch(err=>msg.channel.send("`ERROR:: Could not send Avatar"));

}
module.exports={
    init
    ,pub:true
    ,cmd:'avatar'
    ,perms:3
    ,cat:'util'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}