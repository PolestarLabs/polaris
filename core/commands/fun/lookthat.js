const Picto = require("../../utilities/Picto");

const init = async (msg) => {
  let link = (msg.args.join(" ").match(/(http[^ |^>]+)/gm) || [""])[0];

  try {
    // link ??= msg.mentions[0]?.displayAvatarURL ?? await PLX.getChannelImg(msg) ?? msg.author.displayAvatarURL;
    if (!link) link = msg.mentions[0]?.displayAvatarURL ?? await PLX.getChannelImg(msg) ?? msg.author.displayAvatarURL;
  } catch (e) {
    // link ??= (msg.mentions[0] || msg.author).displayAvatarURL;
    if (!link) link = (msg.mentions[0] || msg.author).displayAvatarURL;
  }

  const [subject, hand] = await Promise.all([
    Picto.getCanvas(link),
    Picto.getCanvas(`${paths.CDN}/build/assorted/aquelamerda.png`),
  ]);
  const canvas = Picto.new(subject.width, subject.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(subject, 0, 0);
  ctx.drawImage(hand, subject.width - subject.height, 0, subject.height, subject.height);

  //return msg.channel.send($t("responses.forFun.thatShit", { lngs: msg.lang } ), file(await canvas.toBuffer(), "latts.png"));
  return msg.channel.send( "Olha só **aquela** merda!", file(await canvas.toBuffer(), "latts.png"));
};

module.exports = {
  init,
  pub: false,
  cmd: "thatshit",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["aquelamerda", "ltts", "look at that shit"],
};
