const Premium = require('../../archetypes/Premium');

const init = async function (msg){

    let primeStatus = await Premium.checkPrimeStatus(msg.member);
    return primeStatus

}

module.exports={
    init
    ,pub:true
    ,cmd:'rewards'
    ,cat:'pollux'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}