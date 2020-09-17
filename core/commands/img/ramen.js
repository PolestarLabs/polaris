const Gal = require("../../structures/Galleries");

const init = async (msg) => {
  const embed = new Embed();

  const img = await Gal.randomOne("ramen", true);

  const avgcolor = await require("../../utilities/Picto").avgColor(img);

  embed.image(img);
  embed.color(avgcolor);
  embed.description("🍜 **Yummy ramen time!**");

  return { embed };
};

module.exports = {
  init,
  pub: true,
  cmd: "ramen",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: [],
};
