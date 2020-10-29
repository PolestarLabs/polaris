const Picto = require("../../utilities/Picto");

const init = async (msg) => {
  let LINK = (msg.args.join(" ").match(/(http[^ |^>]+)/gm) || [""])[0];

  try {
    if (!LINK) LINK = msg.mentions[0]?.displayAvatarURL || await PLX.getChannelImg(msg) || msg.author.displayAvatarURL;
  } catch (e) {
    if (!LINK) LINK = (msg.mentions[0] || msg.author).displayAvatarURL;
  }

  const [subject, hand] = await Promise.all([
    Picto.getCanvas(LINK),
    Picto.getCanvas(`${paths.CDN}/build/assorted/estamerda.png`),
  ]);
  const canvas = Picto.new(subject.width, subject.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(subject, 0, 0);
  ctx.drawImage(hand, 0, 0, subject.height, subject.height);

  return msg.channel.send($t("responses.forFun.thisShit", { lngs: msg.lang }), file(await canvas.toBuffer(), "lats.png"));
};

module.exports = {
  init,
  pub: false,
  cmd: "thisshit",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["estamerda", "lts", "look at this shit"],
};