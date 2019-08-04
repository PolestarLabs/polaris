const init = async function (msg,args){
    const Target = PLX.getTarget(msg,1,false)
    if(!Target) {msg.addReaction(_emoji('nope').reaction);return}
    await DB.users.set(Target.id,{$set:{'switches.role':'translator','switches.translator':args[0].toUpperCase()}});
    msg.addReaction(_emoji('yep').reaction);
}

module.exports={
    init
    ,pub:false
    ,cmd:'istranslator'
    ,perms:3
    ,cat:'_botOwner'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['translator']
}