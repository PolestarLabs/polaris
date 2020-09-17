const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const embed = new Embed();

  const img = await Gal.randomOne("tea", true);
  const avgcolor = await require("../../utilities/Picto").avgColor(img);

  embed.image(img);
  embed.color(avgcolor);
  embed.description(":tea: **Tea time!**");

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: true,
  cmd: "tea",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: [],
};
