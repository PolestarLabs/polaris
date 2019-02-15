const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let colorChanged = $t("misc.colorChange", P)
    const getColor = require('../utility/color');

    if(msg.args[0] === "check" || msg.mentions.length > 0){
    if(msg.mentions.length > 0 || msg.args.length>1){

        let usery;
        if(msg.mentions.length>0)
            usery = msg.mentions[0];
        else
            usery = await gear.getTarget(msg,1);

        let uData = await DB.users.get(usery.id);            
        let embed = new gear.Embed;
        let x;
        if(uData)
            x = uData.modules.favcolor;
        else {
            embed.footer("User not found in Database")
            x = "---";
        }

        msg.args[0] = x
        embed.setColor("#" + x.replace(/^#/, ''))
        embed.author("Favcolor for "+usery.tag, "https://png.icons8.com/paint-brush/dusk/64")
        embed.description = "**"+(await getColor.init(msg,true)).name + "** : : " + x
      
      return msg.channel.send({embed});
    }
        let embed = new gear.Embed;
        let USERDATA = await DB.users.get(msg.author.id);
        let x = USERDATA.modules.favcolor
        msg.args[0] = x
        embed.setColor("#" + x.replace(/^#/, ''))
            embed.author("Favcolor for "+msg.author.tag, "https://png.icons8.com/paint-brush/dusk/64")
            embed.description = "**"+(await getColor.init(msg,true)).name + "** : : " + x
      
      return msg.channel.send({embed});
    }

        let res = await getColor.init(msg,true);
 
    if(res.name == "INVALID COLOR"){
        res.embed.description = gear.emoji('nope') + "INVALID COLOR";
        return msg.channel.send({embed:res.embed})
    }
    res.embed.description = gear.emoji('yep') + colorChanged;
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