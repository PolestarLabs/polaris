const { FORFEIT, parseQuestItem } = require("./_meta.js");
const { TimedUsage } = require("@polestar/timed-usage");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const ReactionMenu = require("../../../structures/ReactionMenu.js");
const ECO = require("../../../archetypes/Economy.js");

const init = async function (msg, args) {
    const userData = await DB.users.get(msg.author.id);
    const newForfeit = await new TimedUsage("errandForfeit", { day: FORFEIT }).loadUser(msg.author);

    if (newForfeit.available) {

        let userErrands = await Progression.getUserQuests(msg.author.id);
        let notCompleted = userErrands.filter(e => !e.completed);

        let errandsData = await DB.quests.find({ id: { $in: notCompleted.map(e => e.id) } }).noCache().lean();

        const parseQuest = (errand) => {
            return parseQuestItem(errandsData, errand);
        };

        const embed = { fields: [] };
        embed.description = `**Forfeit Errands**
Forfeiting an Errand costs ${_emoji('SPH')} **5** Sapphire.
${userData.modules.SPH >= 5
                ? "Choose one errand to forfeit:"
                : _emoji('nope') + "You don't have enough Sapphires for this"}
        `

        embed.fields.push(...notCompleted.map(parseQuest));

        embed.fields.forEach((field, i) => {
            field.name = field.name.replace(/<:[A-z]+:[0-9]+>/, _emoji("swp_" + (i + 1)))
        })
        const menu = await msg.channel.send({ embed, messageReferenceID: msg.id });
        if (userData.modules.SPH < 5) return;

        let res = await ReactionMenu(
            menu,
            msg,
            [...notCompleted.map((v, i) => _emoji('swp_' + (i + 1))), _emoji('nope')],
            { avoidEdit: false, time: 15000 }
        );

        if (!res) {
            return null;
        }
        if (res?.id === _emoji('nope').id) {
            return null;
        } else {
            const selected = res.index;

            await ECO.pay(msg.author, 5, "errand_forfeit", "SPH");
            await Progression.remove(notCompleted[selected].id, msg.author.id);
            await newForfeit.process();

            embed.fields[selected].value = `${_emoji('__')} *Errand forfeited*`;
            embed.fields[selected].name = `~~${embed.fields[selected].name}~~`;
            menu.edit({ embed });
        }

    } else {
        return {
            embed: {
                description: `${_emoji('AWY')}${formatDistanceToNow(newForfeit.availableAt)} until you can forfeit an ongoing Errand`
            }, messageReferenceID: msg.id
        }
    }

}

module.exports = {
    init
    //,argsRequired
    //,aliases:[]
}