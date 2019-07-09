const gear = require('../../../utilities/Gearbox');
const DB = require('../../../database/db_ops');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    msg.reply("OK")
}
module.exports={
    init
    ,pub:true
    ,cmd:'index'
    ,perms:3
    ,cat:'subtest'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}