const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const embed = new Embed();

  const img = await Gal.randomOne("ahegao", true);

  embed.image(img);
  embed.color("#FFFFFF");
  // embed.description(":coffee: **Coffee time!**");

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: false,
  cmd: "ahegao",
  perms: 3,
  cat: "nsfw",
  botPerms: ["embedLinks"],
  aliases: [],
};
