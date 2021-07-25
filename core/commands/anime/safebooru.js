const ax = require("axios");
const BOORU = require("../../utilities/BooruGetter");

const init = async (msg, args, ext) => {
  const QUALITY_CONTROL = `+score:>0${msg.channel.nsfw ? "" : "+-rating:questionable"}`;

  let tags = args.join("+") || "";
  let endpoint = "getRandom";

  const embed = new Embed();
  embed.color = 0xf44283;
  embed.footer(msg.author.tag + ((ext?.nsfw) ? " | Content provided as-is by Gelbooru" : " | Content provided as-is by Pixiv (via Safebooru)"), msg.author.avatarURL);
  embed.title("\\❤ \u2003 S a f e b o o r u \u2003 \\❤");

  if (ext && ext.constructor !== Array) {
    embed.title = ext.title;
    embed.description = ext.description;
    embed.color = ext.color;
    if (ext.tags) embed.description = tags ? (`\`${tags.replace(/_/g, " ").replace(/\+/g, "` | `")}\`\n`) : "";
    if (ext.nsfw && msg.channel.nsfw) {
      endpoint = "getRandomLewd";
      tags += "+-loli+-lolicon+-child+-shota+-cgi+-3d+-webm+-bestiality+-rating:safe";
    } else {
      tags += QUALITY_CONTROL;
    }
    if (!msg.channel.nsfw && ext.nsfw) embed.title = "NSFW NOT ENABLED IN THIS CHANNEL";
  } else {
    embed.description = tags ? (`\`${tags.replace(/_/g, " ").replace(/\+/g, "` | `")}\`\n`) : "";
    tags += QUALITY_CONTROL;
  }

  const res = await BOORU[endpoint](tags).catch(() => null);

  let enhancedRes;
  if (res) enhancedRes = (await ax.get(`http://danbooru.donmai.us/posts.json?md5=${res.md5 || res.hash}`).catch(() => ({ data: null }))).data;

  if (res && enhancedRes) {
    embed.image(res.sample_url);
    const elipsis = enhancedRes.tag_string_character.split(" ").length > 5 ? " (...)" : "";
    if (enhancedRes.tag_string_artist) {
      embed.field(
        "Artist",
        `**[${enhancedRes.tag_string_artist.split(" ")[0].split("_").map(capitalize).join(" ")}]()**`,
        true,
      );
    }
    if (enhancedRes.tag_string_character) {
      embed.field(
        "Characters",
        enhancedRes.tag_string_character.split(" ").map((char) => char.split("_").map(capitalize).join(" ")).slice(0, 5).join(", ") + elipsis,
        true,
      );
    }
    if (enhancedRes.tag_string_copyright) {
      embed.field(
        "Source",
        enhancedRes.tag_string_copyright.split(" ").filter((v, i, a) => !v.includes(a[(i || 5) + -1])).map((src) => src.split("_").map(capitalize)
          .join(" ")).slice(0, 3)
          .join(", "),
        true,
      );
    }
    if (msg.content.includes('--debug')) {
      embed.field(
        "Reference Link",
        enhancedRes.file_url,

      )
      embed.field(
        "Preview Link",
        enhancedRes.preview_file_url,
      )
      embed.field(
        "KEYS",
        Object.keys(res).join('\n'),
      )
    }
    if (enhancedRes.tag_string_general && ext?.tags) {
      embed.field(
        "Tags",
        `\`[${shuffle(enhancedRes.tag_string_general.slice(1).split(" ").slice(0, 10)).join("]` `[")}]\``,
        true,
      );
    }
    msg.channel.send({
      embed,
      components: [
        {
          type: 1, components: [{
            type: 2,
            style: 2,
            label: "Save to Gallery",
            custom_id: "booruSave",
            emoji: { name: "⭐" }
          }]
        }
      ]
    }).then((ms) => {
      ms.addReaction("👍").catch(() => null);
      ms.addReaction("👎").catch(() => null);
      ms.addReaction("💖").catch(() => null);
      ms.addReaction("😠").catch(() => null);
    });
  } else if (res) {
    embed.image(res.file_url);
    if (res.tags && ext?.tags) embed.field("Tags", `\`[${shuffle(res.tags.slice(1)).split(" ").slice(0, 10).join("]` `[")}]\``, true);
    msg.channel.send({ embed }).then((ms) => {
      return;
      addReactions(ms, {
        url: (res.sample_url.includes("safebooru") ? res.file_url : res.sample_url.replace("/samples", "//samples")),
        saved: Date.now(),
        tags: res.tags,
        nsfw: ext?.nsfw,

      });
    });
  } else {
    embed.description = _emoji("nope") + $t("forFun.booru404", { lngs: msg.lang, prefix: msg.prefix });
    msg.channel.send({ embed });
  }
};
module.exports = {
  init,
  pub: true,
  cmd: "safebooru",
  perms: 3,
  cat: "anime",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["safe"],
  scope: "booru",
};
