const init = async function (msg){
 
    POLLUX.registerCommands(true);
    msg.addReaction(_emoji("yep").reaction);

}
module.exports={
    init
    ,pub:false
    ,cmd:'reload'
    ,perms:3
    ,cat:'_botStaff'
    ,aliases:['rld']
}