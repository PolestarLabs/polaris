const { Embed } = require('../../utilities/Gearbox');
const INVENTORY = require('../../archetypes/Inventory');




const init = async function (msg, args, userID) {
    if (userID && (args[10] || {}).id != userID) return "Only the owner can see inside";
    const P =  {lngs:msg.lang};

    const userInventory = new INVENTORY(userID || msg.author.id, "boosterpack");
    const Inventory = await userInventory.listItems(args[10]);
    const embed = {color: 0xeb546d}

    embed.description =
        Inventory.length > 0 
            ? Inventory.map(i => `${_emoji(i.rarity)}  **${i.name}** × ${i.count} \`${msg.prefix || args[11]}open booster ${i.rarity}\``).join('\n')
            :  `*${rand$t('responses.inventory.emptyJokes',P)}*`

    embed.footer = { 
        text: (args[12]||msg).author.tag
        ,icon_url: (args[12]||msg).author.avatarURL
    }

    return { content: `${_emoji('BOOSTER')} ${$t('responses.inventory.browsingBooster',P)}`, embed }

}


const open = async function (msg, args) {

    const userInventory = new INVENTORY(msg.author.id, "booster");
    const Inventory = await userInventory.listItems();

    if (!Inventory.find(bx => bx.id == args[0])) return "No such pack";

    (require("../cosmetics/openbooster.js")).init(msg, { rarity: args[0] })


}



module.exports = {
    init, open
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