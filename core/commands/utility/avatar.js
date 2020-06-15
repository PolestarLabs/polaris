// const gear = require('../../utilities/Gearbox');
const Picto = require('../../utilities/Picto');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const Target = await PLX.getTarget(msg.args[0] || msg.author.id);
    if (!Target) return msg.channel.send($t("responses.errors.kin404", P));

    const embed = new Embed()
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
    ,botPerms:['embedLinks']
    ,aliases:[]
}