const DB = require('../../../database/db_ops');
const gear = require('../../../utilities/Gearbox');
const navigator = require('../../../structures/ReactionNavigator');

const init = async  (msg, args) => {

    let filter = args[0]
    let thispage = parseInt(filter) ? Math.abs(filter) : 1;
    let query = {}

    if (filter && !parseInt(filter)) {
        switch (filter) {
            case "bg":
            case "bgs":
            case "background":
            case "backgrounds":
                query = { item_type: 'background' }
                break;
            case "booster":
            case "boosters":
            case "boostepack":
            case "boostepacks":
                query = { item_type: 'boosterpack' }
            case "sticker":
            case "stickers":
                query = { item_type: 'sticker' }
                break;
            case "medal":
            case "medals":
                query = { item_type: 'medal' }
                break;
            case "junk":
                query = { item_type: 'junk' }
                break;
            case "key":
            case "ring":
                query = { item_type: 'key' }
                break;
            case "material":
            case "materials":
                query = { item_type: 'material' }
                break;
            case "item":
            case "items":
                query = { item_type: { $in: ["key", "junk", "material"] } }
                break;
            case "mine":
                query = { author: msg.author.id }
                break;
            case "user":
                if (msg.args[2]) {
                    Target = gear.getTarget(msg, 2);
                    query = { author: Target.id }
                } else {
                    query = { author: msg.author.id }
                }
                break;
            default:
                query = { item_id: filter }
                break;
        }
    }

    const [marketbase, itemcount] = await Promise.all(
        [
            (await DB.marketbase({ fullbase: 1 })).fullbase,
            DB.marketplace.find(query).countDocuments(),
        ]
    );

    async function Pagination(page, mss, recursion = 0) {
        let tot_pages = Math.ceil(itemcount / 12);
        page = page > tot_pages ? tot_pages : page < 1 ? 1 : page;
        let pagecontent = await DB.marketplace.find(query).limit(12).skip(12 * ((page || 1) - 1)).lean().exec()
        let procedure = function (...args) {
            if (mss)
                return mss.edit(...args);
            else
                return msg.channel.send(...args);
        }
        let embed = new gear.Embed
        embed.author("User Marketplace Listings", "", "https://beta.pollux.gg")
        if (tot_pages > 0) {

            embed.description = `Showing entries (${page}/${tot_pages})
                    *Type **\`${msg.prefix}market list [PAGE]\`** for a specific page*`
        } else {
            embed.description = `No Entries were found, please check your search`

        }
        let i = 0

        while (i++ < 12) {
            let offer = pagecontent[i - 1]
            if (!offer) {
                embed.field("\u200b", "\u200b", true);
                continue;
            }
            let item = marketbase.find(it => offer.item_id === it.id && offer.item_type === it.type)
            if (!item) {
                embed.field("---", "`BAD ENTRY`", true);
                continue;
            }
            embed.field(
                _emoji(item.rarity) + item.name,
                `
        **\`${filter === 'mine' ? offer.id : item.type.toUpperCase()}\`**
        ${offer.type == "sell" ? "Selling for: " : "Buying for: "} **${gear.miliarize(offer.price, 'soft')}**${_emoji(offer.currency)}
        [\\🔗 See entry on web](https://beta.pollux.gg/shop/marketplace/entry/${offer.id})
                    `, true)
        }

        let mes = await procedure({ embed });
        let options = {
            page,
            tot_pages
        }
        navigator(mes, msg, Pagination, options, recursion);
        mes = null;
        mss = null;
    }

    Pagination(thispage).then(res => {
        console.log('ok')
    });
}


module.exports = {
    init,
    argsRequired: false,
    caseInsensitive: true,
    cooldown: 3000,
    aliases: ['ls','entries'],
    hooks: {
        preCommand: (msg) => msg.author.marketplacing = true,
        postExecution: (msg) => msg.author.marketplacing = false,
    }
}
