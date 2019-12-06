const ReactionMenu = require('../../../structures/ReactionMenu');

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
    
    const wrapChoices = shuffle([
        _emoji("gift_Y_S")
       ,_emoji("gift_Y_R")
       ,_emoji("gift_Y_B")
       ,_emoji("gift_R_S")
       ,_emoji("gift_R_R")
       ,_emoji("gift_R_B")
       ,_emoji("gift_P_S")
       ,_emoji("gift_P_R")
       ,_emoji("gift_P_B")
    ]).slice(0,4);

    const menuMessage = await msg.channel.send("**Choose your wrapping**");
    const res = await ReactionMenu(menuMessage,msg,wrapChoices,{time:10000});

    let emoji;
    if(!res) emoji = shuffle(wrapChoices)[0];
    else emoji = wrapChoices[res.index];

    giftItem.emoji = emoji;
    
    menuMessage.edit(emoji+"")
    let noteMessage = await msg.channel.send("**Please add a message to your gift!**\n*(Once you wrap it you can't see it anymore!)*");
    const responses = await msg.channel.awaitMessages(msg2 =>
        msg2.author.id === msg.author.id , {
            maxMatches: 1,
            time: 30e3
        }
    );
    
    menuMessage.delete()
    giftItem.message = responses.length > 0 ? responses[0].content : null;
    noteMessage.edit(
        {
            content:'\u200b',
            embed:{
                description:"*```"+giftItem.message+'```*'
                ,thumbnail:{url: `https://cdn.discordapp.com/emojis/${emoji.id}.png`}
            }
        });
    
    if(responses[0]) responses[0].delete();

    await DB.users.set(msg.author.id, destroystring);
    await DB.gifts.set( Date.now() , giftItem );
    msg.addReaction(_emoji('yep').reaction);
    

    
}

module.exports={
    init
    ,caseInsensitive: true
    ,argsRequired: true
    ,aliases:['wp']
}