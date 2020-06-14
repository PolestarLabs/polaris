// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const HEX_REGEX = /^#?[a-fA-F0-9]{3}([a-fA-F0-9]{3})?$/;

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let colorChanged = $t("misc.colorChange", P)
    const getColor = require('../utility/color');

    if (msg.args[0] === 'check' || !HEX_REGEX.test(msg.args[0])) {
        const query = msg.args[0] === 'check' ? msg.args[1] : msg.args[0];
        let usery = await PLX.getTarget(query) || msg.author;
        let uData = await DB.users.get(usery.id);

        let embed = new Embed;
        let x;
        if(uData)
            x = uData.modules.favcolor;
        else {
            embed.footer("User not found in Database")
            x = "---";
        }

        msg.args[0] = x
        embed.setColor("#" + x.replace(/^#/, ''))
        embed.author("Favcolor for "+usery.tag, "https://img.icons8.com/dusk/250/paint-brush.png")
        embed.description = "**"+(await getColor.init(msg,true)).name + "** : : " + x

        return msg.channel.send({embed});
    }
    
    let res = await getColor.init(msg,true);
 
    if(res.name == "INVALID COLOR"){
        res.embed.description = _emoji('nope') + "INVALID COLOR";
        return msg.channel.send({embed:res.embed})
    }
    res.embed.description = _emoji('yep') + colorChanged;
    res.embed.footer = {}
    console.log(res)
    DB.users.set(msg.author.id,{$set:{'modules.favcolor': ("#"+res.hex).replace("##","#") }})
    msg.channel.send({embed:res.embed})
}
module.exports={
    init
    ,pub:true
    ,cmd:'favcolor'
    ,perms:3
    ,cat:'cosmetics'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}