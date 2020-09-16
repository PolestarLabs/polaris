const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const embed = new Embed();
  let img = {};

  if (msg.args[0] && !!parseInt(msg.args[0])) {
    const index = parseInt(msg.args[0]);
    img.file = `${paths.DASH}/random/smug/${index}`;
    img.index = index;
  } else {
    img = await Gal.randomOneIndexed("smug", true);
  }

  const avgcolor = await require("../../utilities/Picto").avgColor(img.file);

  embed.image(img.file);
  embed.color(avgcolor);
  embed.footer(`Smug Anime Girl #${img.index}`);

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: true,
  cmd: "smug",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: [],
};
