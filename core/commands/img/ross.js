const Gal = require("../../structures/Galleries");

const init = async (msg) => {
  const embed = new Embed();

  const img = await Gal.randomOne("ross", true);

  embed.image(img);
  embed.color("#1b1b20");
  embed.description(
    _emoji("Rfriends").no_space
        + _emoji("friendsdotred").no_space
        + _emoji("Ofriends").no_space
        + _emoji("friendsdotblue").no_space
        + _emoji("Sfriends").no_space
        + _emoji("friendsdotyellow").no_space
        + _emoji("Sfriends").no_space,
  );

  return { embed };
};

module.exports = {
  init,
  pub: true,
  cmd: "ross",
  perms: 3,
  cat: "img",
  botPerms: ["attachFiles"],
  aliases: [],
};
