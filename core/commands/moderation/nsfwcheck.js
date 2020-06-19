const NSFW = require("../../utilities/CheckNSFW.js");

const init = async function (msg, args) {
  const imgOrigin = args[0];

  msg.delete();

  const ICONS = {
    Hentai: "<:HNT:692761594991738970> ",
    Neutral: "<:NTL:692761380524130394> ",
    Drawing: "<:DRW:692761597088628816> ",
    Sexy: "<:SXY:692763568067575829> ",
    Porn: "<:PNY:692763772992880682> ",
  };

  NSFW(imgOrigin, 5).then(async (predictions) => {
    const
      H = (predictions.find((x) => x.className == "Hentai") || {}).probability || 0;
    const P = (predictions.find((x) => x.className == "Porn") || {}).probability || 0;
    const S = (predictions.find((x) => x.className == "Sexy") || {}).probability || 0;

    const D = (predictions.find((x) => x.className == "Drawing") || {}).probability || 0;
    const N = (predictions.find((x) => x.className == "Neutral") || {}).probability || 0;

    let score = ~~((H + P + S) / 1.5 * 100 - N * 100);
    score = score > 0 ? score : 0;

    const classification = score > 80 ? "Completely Degenerated" : score > 60 ? "Definitely NSFW!" : score > 50 ? "Lewd!" : score > 30 ? "*Questionable*" : "Safe";

    const color = parseInt([(score * 2 + 55), (100 - score + (N * 125)), 50]
      .map((x) => (~~x).toString(16).padStart(2, 0)).join(""), 16);

    msg.channel.send({
      embed: {
        description: `\`${score}%\` | **${classification}**`,
        color,
        thumbnail: { url: imgOrigin },
        fields: predictions.map((p) => ({ name: ICONS[p.className] + p.className, value: `${parseInt(p.probability * 100)}%`, inline: false })),
      },
    });
  });
};

module.exports = {
  init,
  pub: false,
  cmd: "nsfwcheck",
  perms: 3,
  cat: "_botStaff",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["nsc"],
};
