// const DB = require('../../database/db_ops');
// const gear = require('../../utilities/Gearbox/global');
const RSS = require("rss-parser");
const YesNo = require("../../structures/YesNo");

const parser = new RSS();

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix, command: this.cmd };

  const feedData = await DB.feed.find({ server: msg.guild.id, type: "rss" }).lean().exec();

  // +RSS add (LINK)
  if (msg.args[0] === "add") {
    const str = msg.args[1];
    const destination = msg.channelMentions[0];
    const feed = await parser.parseURL(str).catch((e) => false);
    if (!feed) return msg.channel.send($t("interface.feed.invalidRSS", P));
    channel = destination || msg.channel.id; // feedData.defaultChannel;
    feed.items = feed.items.filter((x) => x.link.startsWith("http"));
    if (!channel) return msg.channel.send($t("interface.feed.noDefault", P));

    const payload = {
      type: "rss", url: str, last: feed.items[0], channel,
    };

    if (feedData && feedData.find((fdd) => fdd.url === str)) {
      await DB.feed.set({ server: msg.guild.id, url: str }, { $set: { channel } });
      return msg.channel.send($t("interface.feed.urlPresent", P));
    }
    const embed = await feedEmbed(feed.items[0], feed);
    payload.server = msg.guild.id;
    payload.thumb = feed.logo || feed.image?.url || "";
    payload.name = feed.title || feed.image?.title || "RSS Feed";

    await DB.feed.new(payload);

    P.channelID = `<#${channel}>`;
    msg.channel.send(_emoji("yep") + $t("interface.feed.savedSubLastRSS", P));
    return PLX.getChannel(channel).send({ embed });
  }

  // +RSS remove (link || index)
  if (msg.args[0] === "remove" || msg.args[0] === "delete") {
    if (!feedData || feedData.length === 0) return msg.channel.send($t("interface.feed.noFeed", P));
    const target = msg.args[1];
    if (!target) return msg.channel.send($t("interface.feed.stateIDorURL", P));
    const toDelete = feedData[target] || feedData.find((f) => f.type === "rss" && (f.url === target || f.url.includes(target)));
    if (!toDelete) return msg.channel.send($t("interface.feed.stateIDorURL", P));

    const embed = new Embed();
    embed.description = `
                URL: \`${toDelete.url}\`
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
    if (feedData && feedData.length > 0) {
      msg.channel.send(`
            **${_emoji("todo") + $t("interface.feed.listShowRSS", P)}**
\u2003${feedData.map((x, i) => `\`\u200b${(`${i}`).padStart(2, " ")}\` <${x.url}> @ <#${x.channel}>`).join("\n\u2003")}        

*${$t("interface.feed.listRemove", P)}*
`);
    } else {
      msg.channel.send($t("interface.feed.noFeed", P));
    }
  }
  // +RSS defaultchannel (#channel)
  if (msg.args[0] === "channel") {
    const channel = msg.channelMentions[0];
    await DB.servers.set({ id: msg.guild.id }, { $set: { "modules.defaultRSSChannel": channel } });
    P.channelID = `<#${channel}>`;
    msg.channel.send(rand$t("responses.verbose.interjections.acknowledged", P) + $t("interface.feed.channelUpdate", P));
  }
};

async function feedEmbed(item, data) {
  const embed = new Embed();
  const ogs = require("open-graph-scraper");
  embed.color("#ff8a42");
  embed.title = item.title;
  embed.url = item.url || item.link || item.guid;
  embed.footer(item.author || item.creator || "Pollux RSS Feed Tool");
  embed.timestamp(item.isoDate);
  embed.description = (item.contentSnippet || item.content || "").split("\n")[0];
  embed.author(data.title);

  const [results, res_thumb] = await Promise.all([
    ogs({ url: embed.url }).catch((e) => { console.error(e); return false; }),
    ogs({ url: data.link || (embed.url.split(`${"//"[1]}`).split("/")[0]) }).catch((e) => { console.error(e); return false; }),
  ]);

  embed.thumbnail = normalizeImage(res_thumb) || { url: data.image?.url || data.logo || "https://img.icons8.com/dusk/344/rss.png" };
  embed.image = { url: item["media:content"]?.$?.url } || normalizeImage(results);
  embed.author.icon_url = "https://img.icons8.com/dusk/344/rss.png";

  return embed;
}

function normalizeImage(results) {
  const img_link = results?.result?.ogImage?.url || null;
  const res = img_link ? { url: img_link.startsWith("//") ? img_link.replace("//", "http://") : img_link } : null;
  return res;
}

module.exports = {
  init,
  embedGenerator: feedEmbed,
  pub: true,
  argsRequired: true,
  cmd: "rss",
  perms: 3,
  cat: "utility",
  botPerms: ["embedLinks", "manageMessages", "manageChannels"],
  aliases: ["feed"],
};
