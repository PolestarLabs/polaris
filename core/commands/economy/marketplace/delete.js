const {marketplace} = require('../../../database/db_ops');

const init = async (msg,args)=>{ 
    let offer = await marketplace.get({id:args[0], author: msg.author.id});
    if(!offer){
        return msg.channel.send(_emoji('nope')+"`ITEM NOT FOUND`");
    }else{
        function deleteIt(){
            marketplace.remove({id:offer.id}).then(res=>{
                msg.channel.send(_emoji('yep')+"`Entry Deleted`");
            })
        }
        let item = marketbase.find(it=> offer.item_id === it.id && offer.item_type === it.type ) 
        let embed = new gear.Embed
            embed.title = "Confirm deletion of item";
            embed.description = `\`${offer.id}\``;
            embed.thumbnail("http://beta.pollux.gg"+item.img)

        
        embed.field(
            _emoji(item.rarity)+item.name,
        `
**\`${item.type.toUpperCase()}\`**
${offer.price}${_emoji(offer.currency)}
        `,true)

        msg.channel.send({embed}).then(m=>
            YesNo(m,msg,deleteIt,null,null,{
                deleteFields:false,
                strings:{
                    confirm: "Entry deleted",
                    timeout: "Timeout - Item was not deleted",
                    cancel:  "Cancelled - Item was not deleted"
                }
            })
        );
    }

}

module.exports = {
    init,
    argsRequired: false,
    caseInsensitive: true,
    cooldown: 5000,
    hooks: {
        preCommand: (msg) => msg.author.marketplacing = true,
        postExecution: (msg) => msg.author.marketplacing = false,
    }
}
