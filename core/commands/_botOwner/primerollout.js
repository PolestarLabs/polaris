const Premium = require("../../archetypes/Premium");
const YesNo = require("../../structures/YesNo");

function composeStickerName() {
    return `plx${Premium.RUNNING_MONTH_SHORT}${Premium.RUNNING_YEAR - 2000}`
}

const init = async function (msg) {

    const thisSticker = await DB.cosmetics.findOne({ id: composeStickerName() }).noCache();

    //if (!thisSticker) return msg.reply(`${_emoji('nope')} **Sticker \`${composeStickerName()}\` not found!** Can't release rewards.`);
    console.log({ thisSticker })
    let embed = createEmbed(thisSticker);

    const prompt = await msg.reply({ embed });


    const renamer = msg.channel.createMessageCollector(m => m.content.startsWith('-ren'), { time: 30e3 });

    let newName = null;
    renamer.on("message", async m => {
        newName = m.content.replace(/-ren\s+/, '');
        thisSticker.name = newName;
        embed = createEmbed(thisSticker);
        await prompt.edit({ embed });
        m.delete().catchReturn();
    });

    const response = await YesNo(prompt, msg);



    if (response) {
        prompt.removeReactions();
        await prompt.edit({
            content: `
${_emoji('loading')} **Publishing & updating Sticker**
        `, embeds: []
        });

        await wait(1);
        let res = await DB.cosmetics.updateOne({ id: composeStickerName() }, { $set: { name: newName || thisSticker.name, public: true } }).catch(err => null);

        if (!res) return prompt.edit(`
${_emoji('nope')} **Publishing & updating Sticker** - FAILED
        `);

        await prompt.edit(`
${_emoji('yep')} **Publishing & updating Sticker**
${_emoji('loading')} **Update all Prime players status**
        `);

        await wait(1);
        res = await Promise.all([
            DB.users.updateMany({ "prime.active": true }, { "prime.active": false }),
            DB.users.updateMany({ "donator": { $exists: true } }, { "donator": null }),
        ]).catchReturn(null);

        if (!res) return prompt.edit(`
${_emoji('yep')} **Publishing & updating Sticker**
${_emoji('nope')} **Update all Prime players status** - FAILED
        `);

        await prompt.edit(`
${_emoji('yep')} **Publishing & updating Sticker**
${_emoji('yep')} **Update all Prime players status**
        `);

        await wait(1);
        global.PRIME_ROLLOUT_OVERRIDE = Date.now();

        msg.channel.send(`${_emoji('yep')} All set! Rewards for **${capitalize(Premium.RUNNING_MONTH_LONG)}** are ready!`);


    }


}
module.exports = {
    init
    , pub: false
    , cmd: 'primerollout'
    , cat: '_botOwner'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ['rollout']
}

function createEmbed(thisSticker = {}) {
    return {
        description: `Confirm this month's sticker:
        • Display Name: **${thisSticker.name}** *(send \`-ren [name]\` to rename it)*
        • Published? ${thisSticker.public ? _emoji('yep') : _emoji('nope')}
        • ID: \`${thisSticker.id}\` 

        **File:**
        `,
        image: { url: `${paths.CDN}/stickers/${thisSticker.id}.png` },
        footer: { text: "DO NOT RELEASE IF IMAGE IS A \"SOON\" STICKER!" }
    };
}
