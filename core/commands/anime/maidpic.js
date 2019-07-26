// const gear = require('../../utilities/Gearbox');
const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    msg.args = ["maid","rating:safe"]

    return require('./safebooru').init(msg,{title:" ",color:0x2b2b3b});

}
module.exports={
    init
    ,pub:true
    ,cmd:'maidpic'
    ,perms:3
    ,cat:'anime'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['maid']
}