const init = async function (msg,args){
    const inventory = await DB.gifts.find({holder:msg.author.id}).lean().exec();
    const target = (msg.mentions[0]||{}).id;
    
    if(inventory.length < 1) return "No gifts to be opened!";
    if(!target) return "You must mention who you want to send this to!";
    
    let gift = inventory[ Number(args[1]||1)-1 ||inventory.length-1];
 
    await DB.gifts.updateOne({_id:gift._id},{$set:{holder:target}});
 
    let emojiId = gift.emoji.replace('>','').split(':')[2].trim();

    return {
        embed:{
        description:  `\u200b
        🎁 <@${msg.author.id}> sent **a gift** to <@${target}>` 
        ,thumbnail:{url: `https://cdn.discordapp.com/emojis/${emojiId}.png`}
    }}
   

}

module.exports={
    init
    ,argsRequired: false
    ,aliases:['send']
}