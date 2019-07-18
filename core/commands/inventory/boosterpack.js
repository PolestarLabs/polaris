const { Embed } = require('../../utilities/Gearbox');
const INVENTORY = require('../../archetypes/Inventory');




const init = async function (msg, args, userID) {
    if (userID && (args[10] || {}).id != userID) return "Only the owner can see inside";

    const userInventory = new INVENTORY(userID || msg.author.id, "booster");
    const Inventory = await userInventory.listItems(args[0]);

    let embed =
    {
        description: Inventory.map(i => `${_emoji(i.rarity)}  **${i.name}** × ${i.count} \`${msg.prefix || args[1]}open booster ${i.rarity}\``).join('\n')
    }

    return { content: `${_emoji('BOOSTER')} ${$t('responses.inventory.browsingBooster',{lngs:msg.lang})}`, embed }

}


const open = async function (msg, args) {

    const userInventory = new INVENTORY(msg.author.id, "booster");
    const Inventory = await userInventory.listItems();

    if (!Inventory.find(bx => bx.id == args[0])) return "No such pack";

    (require("../cosmetics/openbooster.js")).init(msg, { rarity: args[0] })


}



module.exports = {
    init
    , pub: true
    , cmd: 'boosterpack'
    , perms: 3
    , cat: 'inventory'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ['booster']
    , autoSubs: [
        {
            label: 'open',
            gen: open,
            options: {
                argsRequired: true,
                invalidUsageMessage: (msg) => { gear.autoHelper('force', { msg, cmd: "boosterpack", opt: "cosmetics" }) }
            }
        }
    ]
}