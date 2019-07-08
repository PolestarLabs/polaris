const {emoji} = require('../../utilities/Gearbox');
const init = async function (msg){
 
    POLLUX.registerCommands(true);
    msg.addReaction(emoji("yep").reaction);

}
module.exports={
    init
    ,pub:false
    ,cmd:'reload'
    ,perms:3
    ,cat:'_botStaff'
    ,aliases:['rld']
}