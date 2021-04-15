// @ts-nocheck
const init = async function (msg,[hash,rank]){

    if (!hash) return "nope";

    let Fanart = await DB.fanart.findOne({hash});
    if (!Fanart) return _emoji("nope") + "No such submission. :c";
    if (!rank){
        msg.channel.send("Define order rank (1 = top, 10 = bottom. default = 2");
        rank = parseInt( (await msg.channel.awaitMessages(m=> Number(m.content), {time:10e3,maxMatches:1} ))?.[0]?.content || 2 );
    }
    if (rank === -1){        
        return DB.fanart.updateOne({hash},{$set: {publish: false, 'extras.rank':99}})
            .then(_r=> msg.addReaction(_emoji('maybe').reaction))
            .catch(_r=> msg.addReaction(_emoji('nope').reaction))
    }
    await DB.fanart.updateOne({hash},{$set: {publish: true, 'extras.rank':1}})
        .then(_r=> msg.addReaction(_emoji('yep').reaction))
        .catch(_r=> msg.addReaction(_emoji('nope').reaction))

}

module.exports={
    init
    ,pub:false
    ,cmd:'fanart-approve'
    ,cat:'_botStaff'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['fnap']
}