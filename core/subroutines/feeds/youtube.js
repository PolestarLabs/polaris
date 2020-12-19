const RSS = require("rss-parser");

const tubeParser = new RSS({
  customFields: {
    item: [["media:group", "media"]],
  },
});

const { ytEmbedCreate } = require("../../commands/utility/ytalert.js");

exports.run = async (feed, serverLang = "en") => {
  const P = { lngs: [serverLang, "dev"] };

  const data = await tubeParser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${feed.url}`,
  ).timeout(3120).catch(() => null);

  if (feed.last.link !== data?.items[0]?.link) {
    const embed = await ytEmbedCreate(data.items[0], data);
    P.tuber = data.items[0].author;
    const LastVideoLink = `
        ${$t("interface.feed.newYoutube", P)}
        ${data.items[0].link}`;
    data.items[0].media = null;
    await DB.feed.updateOne(
      { server: feed.server, url: feed.url },
      { $set: { last: data.items[0], thumb: embed.thumbnail.url } },
    ).catch(console.error);

    const ping = feed.pings || feed.pings || "";
    PLX.getChannel(feed.channel).send({
      content: ping + LastVideoLink,
    })
      .then((m) => m.channel.send({ embed }))
      .catch(() => null);
  }
};
