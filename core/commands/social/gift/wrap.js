const init = async function (msg,args){

    let itemType = args[0];
    let itemId = args[1];
    const userData = await DB.users.findOne({id:msg.author.id});

    let destroystring = {}
    let giftItem = {
        creator: msg.author.id,
        holder: msg.author.id,
    }

    if(!itemType) return "What are you trying to wrap?";
    if(!itemId)   return "What `"+itemType+"` are you trying to wrap?";

    if(['background','bg'].includes(itemType) ){
        itemType = 'background';
        if(userData.modules.bgInventory.includes(itemId) ){

            giftItem.item =  itemId;
            giftItem.type =  'background';
            
            destroystring.$pull = {'modules.bgInventory':itemId };

        }else{
            return "You don't own this Background!";
        }
    }
    
    msg.channel.send("Please add a message to your gift!\n*(Once you wrap it you can't see it anymore!)*")
    const responses = await msg.channel.awaitMessages(msg2 =>
        msg2.author.id === msg.author.id , {
            maxMatches: 1,
            time: 30e3
        }
    );

    giftItem.message = responses.length > 0 ? responses[0].content : null;
    
    await DB.users.set(msg.author.id, destroystring);
    await DB.gifts.set( Date.now() , giftItem );
    return "OK!";

}

module.exports={
    init
    ,caseInsensitive: true
    ,argsRequired: true
    ,aliases:['wp']
}