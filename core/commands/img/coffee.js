const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const embed = new Embed();

  const img = await Gal.randomOne("coffee", true);

  const avgcolor = await require("../../utilities/Picto").avgColor(img);

  embed.image(img);
  embed.color(avgcolor);
  embed.description(":coffee: **Coffee time!**");

  return { embed };
};

module.exports = {
  init,
  pub: true,
  cmd: "coffee",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: [],
};
