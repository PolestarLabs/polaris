// const DB = require('../../database/db_ops');
// const gear = require('../../utilities/Gearbox/global');
const YesNo = require("../../structures/YesNo");
const axios = require("axios");

const googleToken = require(`${appRoot}/config.json`).google;
const RSS = require("rss-parser");

const parser = new RSS({
  customFields: {
    item: [["media:group", "media"]],
  },
});

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix, command: this.cmd };

  const feedData = await DB.feed.find({ server: msg.guild.id, type: "youtube" });

  // +RSS add (LINK)
  if (msg.args[0] === "add") {
    let channelID = msg.args[1];

    if (channelID?.startsWith("http")) {
      const pre = channelID.split("/");
      channelID = pre[pre.length - 1];
    }

    const destination = msg.channelMentions[0];

    const youtubeChannel = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelID}`).catch((e) => false);

    if (!youtubeChannel) return msg.channel.send($t("interface.feed.invalidYoutube", P));

    channel = destination || feedData.defaultChannel;
    if (!channel) return msg.channel.send($t("interface.feed.noDefault", P));

    const payload = {
      type: "youtube", url: channelID, last: youtubeChannel.items[0], channel,
    };

    if (feedData?.find((fdd) => fdd.url === channelID)) {
      await DB.feed.set({ server: msg.guild.id, url: channelID }, { $set: { channel } });
      return msg.channel.send($t("interface.feed.urlPresent", P));
    }
    const embed = await feedEmbed(payload.last, youtubeChannel);
    payload.last.media = null;
    payload.server = msg.guild.id;
    payload.thumb = embed?.thumbnail?.url;
    payload.name = embed?.author?.name;
    await DB.feed.new(payload);

    P.tuber = embed.author.name;
    const LastVideoLink = `
        ${$t("interface.feed.newYoutube", P)}
        ${payload.last.link}`;
    P.channelID = `<#${channel}>`;
    msg.channel.send(_emoji("yep") + $t("interface.feed.savedSubLastYoutube", P));

    return msg.guild.channels.find((chn) => chn.id === channel).send({ content: LastVideoLink }).then((m) => m.channel.send({ embed }));
  }
  // +RSS remove (link || index)
  if (msg.args[0] === "remove" || msg.args[0] === "delete") {
    if (!feedData?.length) return msg.channel.send($t("interface.feed.noTube", P));
    const target = msg.args[1];

    if (!target) return msg.channel.send($t("interface.feed.stateIDorURL", P));
    const toDelete = feedData[target] || feedData.find((f) => f.url === target || f.url.includes(target));
    const embed = {};
    embed.description = `
                URL: https://youtube.com/channel/${toDelete.url}
                ${$t("terms.discord.channel")}: <#${toDelete.channel}>
                `;
    const confirm = await msg.channel.send({
      content:
        $t("interface.generic.confirmDelete", P),
      embed,
    });
    YesNo(confirm, msg, async (cc) => {
      // await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
      await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
    });
  }

  if (msg.args[0] === "list") {
    if (feedData?.length > 0) {
      msg.channel.send(`
            **${_emoji("todo") + $t("interface.feed.listShowYoutube", P)}**
\u2003${feedData.filter((x) => x.type === "youtube").map((x, i) => `\`\u200b${(`${i}`).padStart(2, " ")}\` https://youtube.com/channel/${x.url} @ <#${x.channel}>`).join("\n\u2003")}        

*${$t("interface.feed.listRemove", P)}*
`);
    } else {
      msg.channel.send($t("interface.feed.noTube", P));
    }
  }
  // +RSS defaultchannel (#channel)
  if (msg.args[0] === "channel") {
    const channel = msg.channelMentions[0];
    await DB.feed.set({ server: msg.guild.id }, { $set: { defaultChannel: channel } });
    P.channelID = `<#${channel}>`;
    msg.channel.send(rand$t("responses.verbose.interjections.acknowledged", P) + $t("interface.feed.channelUpdate", P));
  }
};

async function feedEmbed(item, data) {
  const embed = {};
  embed.color= numColor("#ee1010");
  embed.title = `**${item.title}**`;
  embed.url = item.link;
  embed.author = {name:item.author, url: data.link};
  embed.timestamp = new Date(item.pubDate);
  embed.description = (item.media["media:description"][0] || "").split("\n")[0];
  embed.footer = {text:"YouTube", icon_url: "https://unixtitan.net/images/youtube-clipart-gta-5.png"};

  const ogs = require("open-graph-scraper");
  const results = await ogs({ url: data.link }).catch((e) => { console.error(e); return false; });
  const img_link = results?.data?.ogImage?.url || null;
  if (img_link) embed.thumbnail = { url: img_link.startsWith("//") ? img_link.replace("//", "http://") : img_link };

  return embed;
}

module.exports = {
  ytEmbedCreate: feedEmbed,
  argsRequired: true,
  init,
  embedGenerator: feedEmbed,
  pub: true,
  cmd: "ytalert",
  perms: 3,
  cat: "utility",
  botPerms: ["embedLinks", "manageMessages", "manageChannels"],
  aliases: ["yta"],
};
