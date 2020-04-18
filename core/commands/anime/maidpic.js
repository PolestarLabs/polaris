// const gear = require('../../utilities/Gearbox');
const init = async function (msg,args){

    args = ["maid","rating:safe"]

    return require('./safebooru').init(msg,args,{title:" ",color:0x2b2b3b});

}
module.exports={
    init
    ,pub:true
    ,cmd:'maidpic'
    ,perms:3
    ,cat:'anime'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['maid']
    ,scope: 'booru'
}