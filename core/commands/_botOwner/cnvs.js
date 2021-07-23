const Picto = require("../../utilities/Picto");

const init = async (msg) => {
  const Canvas = Picto.new(800, 600);
  // const ctx = Canvas.getContext("2d");

  msg.channel.send(".", file(await Canvas.toBuffer(), "x.png"));
};
module.exports = {
  init,
  pub: false,
  cmd: "asd",
  perms: 3,
  cat: "_botOwner",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
