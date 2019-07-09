const DB = require('../../../database/db_ops');
const {Embed} = require('../../../utilities/Gearbox');
const YesNo = require('../../../structures/YesNo').run;

const init = async (msg,args)=>{ 
    
    const [offer,fullbase] = await Promise.all([
        DB.marketplace.get({ $or:[{id:args[0]},{item_id:args[0]}], author: msg.author.id}),
        (await DB.marketbase({ fullbase: 1 })).fullbase
    ]);

    if(!offer){
        return msg.channel.send(_emoji('nope')+"`ITEM NOT FOUND`");
    }else{
        function deleteIt(){
            DB.marketplace.remove({id:offer.id}).then(res=>{
                msg.channel.send(_emoji('yep')+"`Entry Deleted`");
            })
        }
        
        let item = fullbase.find(it=> offer.item_id === it.id && offer.item_type === it.type ) 
        let embed = new Embed
            embed.title = "Confirm deletion of item";
            embed.description = `\`${offer.id}\``;
            embed.thumbnail(paths.CDN+item.img)

        
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
    argsRequired: true,
    caseInsensitive: true,
    cooldown: 5000,
    aliases: ['del','rem','remove','unlist'],
    hooks: {
        preCommand: (msg) => msg.author.marketplacing = true,
        postExecution: (msg) => msg.author.marketplacing = false,
    }
}
