const gear = require('../../utilities/Gearbox');
const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    msg.args = ["cat_ears","1girl"]

    return require('./safebooru').init(msg,{title:" ",color:0xff7c75});

}
module.exports={
    init
    ,pub:true
    ,cmd:'neko'
    ,perms:3
    ,cat:'anime'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['catgirl']
}