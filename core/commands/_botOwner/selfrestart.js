
const init = async function (){
   POLLUX.softKill()
}

module.exports={
    init
    ,pub:false
    ,cmd:'selfrestart'
    ,perms:3
    ,cat:'dev'
    ,botPerms:[ ]
    ,aliases:['rst']
}