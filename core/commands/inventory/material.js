const INVENTORY = require('../../archetypes/Inventory');

const DB = require('../../database/db_ops');
const gear = require('../../utilities/Gearbox');
const navigator = require('../../structures/ReactionNavigator');

const ATTR = (i)=> `${ i.buyable     ?_emoji('market_ready').no_space    :_emoji('__').no_space }\
                    ${ i.tradeable   ?_emoji('can_trade').no_space       :_emoji('__').no_space }\
                    ${ i.destroyable ?_emoji('can_destroy').no_space     :_emoji('__').no_space }`;

const displayItem = (invItm,embed,P)=> 
    embed.field(
        `${invItm.emoji}  **${$t([`items:${invItm.id}.name`, invItm.name], P)}** × ${invItm.count}`,
        `
        \u2003 *${$t([`items:${invItm.id}.description`, "---"], P)}* 
        \u2003 ${ATTR(invItm)}\
        `
        , false);


const init = async function (msg, args, userID) {
    if (userID && (args[10] || {}).id != userID) return "Only the owner can see inside";
    const P = {lngs:msg.lang};    
    const userInventory = new INVENTORY(userID || msg.author.id, "material");
    let Inventory = await userInventory.listItems(args[10]);
 
        const response = { content: `${_emoji('MATERIAL')} ${$t('responses.inventory.browsingMaterial',P)} `}
        if(Inventory.length==0)  {
            response.embed = {description:`*${rand$t('responses.inventory.emptyJokes',P)}*`,color:0xEBBEFF }
             return  response;
            }
        
        return  Pagination(1);

        async function Pagination(page, mss, recursion = 0) {
            let tot_pages = Math.ceil(Inventory.length / 5);
            page = page > tot_pages ? tot_pages : page < 1 ? 1 : page;

            let pace = (5 * ((page || 1) - 1));
            let pagecontent = Inventory.slice(pace,pace+5);  
            let procedure = function (...args) {
                if (mss)
                    return mss.edit(...args);
                else
                    return msg.channel.send(...args);
            }

            let embed = new gear.Embed
            embed.thumbnail('https://via.placeholder.com/250x250')
            embed.color = 0xEBBEFF



            if (tot_pages > 0 && tot_pages < 2) {
                Inventory.forEach(itm => displayItem(itm,embed,P));
                response.embed = embed;
                return response;
            } else if(tot_pages == 0) { // soft comp to match false
                embed.description = `*${rand$t('responses.inventory.emptyJokes',P)}*`
                return {embed};    
            }
            let i = 0
            embed.fields =[]
            while (i++ < 5) {
                let invItm=pagecontent[i - 1]
                if (!invItm) {
                    embed.field("\u200b", "\u200b", true);
                    continue;
                }
                displayItem(invItm,embed,P);
            }
    
            let mes = await procedure({ content: response.content, embed });
            let options = {
                page,
                tot_pages,          
            }
            navigator(mes, args[12]||msg, Pagination, options, recursion);
            mes = null;
            mss = null;
        }
    


}
 
module.exports = {
    init
    , pub: true
    , cmd: 'material'
    , perms: 3
    , cat: 'inventory'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ["mat"]
}
