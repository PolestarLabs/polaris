const Gal = require("../../structures/Galleries");

const init = async function(msg) {
  const embed = new Embed();

  let img = await Gal.randomOne("ramen", true);

  let avgcolor = await require("../../utilities/Picto").avgColor(img);

  embed.image(img);
  embed.color(avgcolor);
  embed.description("🍜 **Yummy ramen time!**");

  return { embed };
};

module.exports = {
  init,
  pub: true,
  cmd: "reamen",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: []
};
