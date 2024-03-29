const { FORFEIT, parseQuestItem } = require('./_meta.js');

const { TimedUsage } = require("@polestar/timed-usage");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
//const Progression = require("../../archetypes/Progression.js");

const INTERVAL = 60e3 * 5 //8 * 60 * 60e3 // 8 Hours


const init = async function (msg, args) {
    let userErrands = await Progression.getUserQuests(msg.author.id);
    let completed = userErrands.filter(e => e.completed);

    const DYN_TIMER = Math.max(userErrands.length - completed.length, 1) * 30 * 60e3;

    const newErrand = await new TimedUsage("errands", { day: DYN_TIMER }).loadUser(msg.author);
    const newForfeit = await new TimedUsage("errandForfeit", { day: FORFEIT }).loadUser(msg.author);


    Progression.checkStatusAll(msg.author.id, msg);

    if (newErrand.available) {
        let availableErrands = await Progression.available(msg.author.id);
        availableErrands = JSON.parse(JSON.stringify(shuffle(availableErrands.filter(e => !userErrands.map(x => x.id).includes(e.id)))));


        if (userErrands.length >= 5 && completed.length) {
            await Progression.remove(completed[0].id, msg.author.id);
        }
        if (userErrands.length - completed.length < 5) {
            await Progression.assign(availableErrands[0].id, msg.author.id);
            await newErrand.process();
            wait(2).then(_ => {
                msg.channel.send(`⭐ **New Errand Available:** \`#${availableErrands[0].id}\` ${availableErrands[0].INSTRUCTION || "UNK"}`);
            });
            userErrands = await Progression.getUserQuests(msg.author.id);
        }


    }


    let errandsData = await DB.quests.find({ id: { $in: userErrands.map(e => e.id) } }).noCache().lean();


    const embed = {};

    embed.description = "**Errands Pool**" + ` [${userErrands.filter(e => e.completed).length}/${Math.min(5, userErrands.length)}]` +
        "\n*Complete all of them for an extra bonus*\n\n";

    const parseQuest = (errand) => {
        return parseQuestItem(errandsData, errand);
    };

    embed.fields = [];
    embed.fields.push({ name: '\u200b', value: 'Ongoing', inline: false });
    embed.fields.push(...userErrands.filter(e => e.progress > 0 && !e.completed).map(parseQuest));

    embed.fields.push({ name: '\u200b', value: 'Not Started', inline: false });
    embed.fields.push(...userErrands.filter(e => e.progress == 0).map(parseQuest));

    embed.fields.push({ name: '\u200b', value: 'Completed', inline: false });
    embed.fields.push(...userErrands.filter(e => e.completed).map(parseQuest));

    embed.fields.push({
        name: '\u200b', value: `
\`${msg.prefix}errands forfeit\` Abandon one ongoing Errand ${newForfeit.available ? `${_emoji('ONL')} **Available**` : `${_emoji('AWY')}${formatDistanceToNow(newForfeit.availableAt)}`}
    `, inline: false
    });

    //TRANSLATE[epic=translations] Errand Cooldown
    embed.footer = {
        icon_url: `https://cdn.discordapp.com/emojis/${_emoji(newErrand.available ? 'ONL' : 'AWY').id}.png`,
        text:
            newErrand.available
                ? `A new Errand is available now. You can have 5 active errands at a time`
                : `A new errand will be available <t:${~~(newErrand.availableAt/1000)}:R>. You can have 5 active errands at a time`
    }

    let isMini = true;
    let embedMini = Object.assign({}, embed);

    embedMini.fields = embedMini.fields.slice(-1);
    embedMini.description += userErrands.map(x => parseQuestItem(errandsData, x, true)).join('\n');

    const errandMessage = await msg.channel.send({ embed: embedMini, messageReferenceID: msg.id });
    await errandMessage.setButtons([{emoji:{name:'↗️'},label:"Expand Details",custom_id:"errand_dets",style:1}]);
    const collector = errandMessage.createButtonCollector(r => r.userID === msg.author.id, { removeButtons:false, time: 6e3 });

    collector.on("click", async () => {
        await errandMessage.removeReactions();

        if (isMini) await errandMessage.edit({ embed: embed });
        else await errandMessage.edit({ embed: embedMini });

        !isMini 
            ? await errandMessage.setButtons([{emoji:{name:'↗️'},label:"Expand Details",custom_id:"errand_dets",style:1}])
            : await errandMessage.setButtons([{emoji:{name:'↙️'},label:"Collapse Details",custom_id:"errand_dets",style:2}]);
            // errandMessage.addReaction('↗️') : errandMessage.addReaction('↙️');
        isMini = !isMini;
    })
    collector.on("end", () => errandMessage.disableButtons('all',{enforce:true}));

}
module.exports = {
    init
    , pub: true
    , cmd: 'errands'
    , cat: 'pollux'
    , botPerms: ['attachFiles', 'embedLinks']
    , TEST: true
    // NAME PENDING
    , aliases: ['devoirs', 'quests', 'tasks']
    , subs: ["forfeit"]
}

