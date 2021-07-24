const { Message } = require("eris");
const RSS = require("rss-parser");

/**
 * @typedef YoutubeData
 * @property {string} link
 */

/**
 * @typedef Youtube
 * @property {YoutubeData} last
 */

/** @typedef {import("./index.js").Feed & Youtube} YoutubeFeed*/

const tubeParser = new RSS({
  customFields: {
    item: [["media:group", "media"]],
  },
});

const { ytEmbedCreate } = require("../../commands/utility/ytalert.js");

exports.run = async (/** @type {YoutubeFeed} */feed, serverLang = "en") => {
  const P = { lngs: [serverLang, "dev"] };

  const data = await tubeParser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${feed.url}`, // @ts-expect-error FIXME[epic=bsian] RSS/Bluebird?
  ).timeout(3120).catch(() => null);

  if (feed.last.link !== data?.items[0]?.link) {
    const embed = await ytEmbedCreate(data.items[0], data);
    // @ts-expect-error P
    P.tuber = data.items[0].author;
    const LastVideoLink = `
        ${$t("interface.feed.newYoutube", P)}
        ${data.items[0].link}`;
    data.items[0].media = null;
    await DB.feed.updateOne(
      { server: feed.server, url: feed.url },
      { $set: { last: data.items[0], thumb: embed?.thumbnail?.url } },
    ).catch(console.error);

    const ping = feed.pings || feed.pings || "";

    if ( !msg.channel.permissionsOf(PLX.user.id).has('sendMessages') ) return;
    // @ts-expect-error eris-additions
    PLX.getChannel(feed.channel).send({
      content: ping + LastVideoLink,
    }) // @ts-expect-error eris-additions
      .then((/** @type {Message} */ m) => m.channel.send({ embed }))
      .catch(() => null);
  }
};
