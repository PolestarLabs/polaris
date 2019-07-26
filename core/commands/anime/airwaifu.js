// const gear = require('../../utilities/Gearbox');
const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    msg.args = ["airplane","1girl"]

    return require('./safebooru').init(msg,{title:":airplane: Airwaifu",color:0x63bbff});

}
module.exports={
    init
    ,pub:true
    ,cmd:'airwaifu'
    ,perms:3
    ,cat:'anime'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}