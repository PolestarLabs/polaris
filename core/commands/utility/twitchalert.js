/**
 * @typedef TwitchUserData
 * @property {string} id
 * @property {string} login
 * @property {string} display_name
 * @property {string} type
 * @property {string} broadcaster_type
 * @property {string} description
 * @property {string} profile_image_url
 * @property {string} offline_image_url
 * @property {string} email
 * @property {number} view_count
 */

const cfg = require(`${appRoot}/config.json`);
const YesNo = require("../../structures/YesNo");
const axios = require("axios");
const { TextChannel } = require("eris");


const twitchRoot = "https://api.twitch.tv/helix/";
const intents = ["add", "delete", "remove", "list"];
const twitchChannelREGEXP = /(?:twitch\.tv\/)(\w*)/i;
const channelREGEXP = /<#(\d+)>/;


async function init(/** @type {any} */ msg, /** @type {string[]} */ args) {
    // @ts-ignore
    const P = { lngs: msg.lang, prefix: msg.prefix, command: this.cmd };

    /** @type {import("../../subroutines/feeds/twitch").TwitchFeed[]} */
    const feedData = await DB.feed.find({ server: msg.guild.id, type: "twitch" });

    const [intent, twitchchannel, textchannel, id] = await parseArgs(args, feedData);


    switch (intent) {
        case "add":
            if (!textchannel) return msg.channel.send($t("interface.feed.noDefault", P));
            if (feedData.length >= 2) return msg.channel.send($t("interface.feed.feedLimitTwitch", P));

            break;
        case "delete":
        case "remove":
            if (feedData.length === 0) return msg.channel.send($t("interface.feed.noTwitch", P));
            if (!twitchchannel && typeof id !== "number") return msg.channel.send($t("interface.feed.stateIDorURL", P));

            // @ts-ignore
            let todelete = feedData[id];
            if (!todelete)
                for (let ind in feedData) // @ts-ignore
                    if (feedData[ind].id === twitchchannel.id) { todelete = feedData[ind]; break; };
            if (!todelete) return msg.channel.send($t("interface.feed.invalidTwitch", P)); // TODO custom string

            // @ts-expect-error
            let { profile_image_url, display_name } = twitchchannel ?? (await getStreamer(todelete.id));

            const m = await msg.channel.send({
                embed: {
                    author: {
                        url: profile_image_url,
                        name: display_name,
                    },
                    description: $t("interface.generic.confirmDelete", P),
                },
            });

            YesNo(m, msg, async () => {
                await DB.feed.deleteOne({ server: msg.guild.id, _id: todelete._id });
                // TODO add deletion message 
            });

            break;
        case "list":
            if (feedData.length === 0) return msg.channel.send($t("interface.feed.noTwitch", P));

            // TODO display if they're live

            msg.channel.send({
                embed: {
                    title: $t("interface.feed.listShowTwitch", P),
                    description: $t("interface.feed.listRemove", P),
                },
                fields: feedData.map((data, ind) => ({
                    name: `${ind}. ${data.display_name}`,
                    value: `${$t("terms.discord.channel", P)}: <#${data.channel}>`
                })),
            });

            break;
    }
};

/** @returns {Promise<[string?, TwitchUserData?, TextChannel?, number?]>} */
async function parseArgs(/** @type {string[]} */ args, /** @type {import("../../subroutines/feeds/twitch").TwitchFeed[]} */ data) {
    let intent, twitch, channel, id;

    for (let arg of args) {
        arg = arg.toLowerCase();

        if (intents.includes(arg)) intent = arg;

        // @ts-ignore - this isn't even correct from ts...
        else if ((!channel || typeof id !== "number") && (parseInt(arg) !== NaN || (channelREGEXP.test(arg) && (arg = arg.match(channelREGEXP)[1])))) {
            if (arg.length < 2 && typeof id !== "number") id = parseInt(arg); // NOTE if limit >= 10 this needs updating.
            if (!(channel = PLX.getChannel(arg)) && !twitch) twitch = await getStreamer(arg);
        }

        // NOTE - Check twitch last since the getStreamer is time intensive
        else if (data.some((d, ind) => arg.includes(d.url) && (id = ind))) continue; // @ts-ignore
        else if (twitchChannelREGEXP.test(arg)) twitch = (await getStreamer(arg.match(twitchChannelREGEXP)[1])) ?? twitch;
        else if (!twitch) twitch = await getStreamer(arg);

        if (intent === "list") break;
    }

    // Return the right types
    if (channel?.type !== 0) channel = undefined;
    if (twitch === null) twitch = undefined;

    return [intent, twitch, channel, id];
}

// TODO move this to utilities
/** @returns {TwitchUserData | null} */
function getStreamer(/** @type {string} */ query) { // @ts-ignore
    return axios.get(
        `${twitchRoot}/users?login=${query}&id=${query}`, // TODO check it works with both id & login attempt
        {
            headers: {
                "User-Agent": "Pollux@Polaris.beta-0.1",
                "Authorization": `Bearer ${cfg.twitch.secret}`,
                "Client-Id": cfg.twitch.client,
            },
        },
    ).timeout(3000)
        .then((/** @type {{ data: TwitchUserData[] }} */res) => res?.data[0] ?? null) // TODO maybe add: ?? res?.data[1]
        .catch(() => null);
}

module.exports = {
    init,

    cmd: "twitchalert",
    cat: "utility",
    aliases: ["twitch"],
    //REVIEW[epic=mitchell] does this work already?
    disabled: true, 
    pub: true,
    perms: 3,

    argsRequired: true,
    botPerms: ["embedLinks"],
};