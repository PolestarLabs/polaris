const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');

const init = async function (msg){
 msg.reply('ok')
}
module.exports={
    init
    ,pub:false
    ,cmd:'test'
    ,perms:3
    ,cat:'_botOwner'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}