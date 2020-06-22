const Picto = require("../../utilities/Picto");

const init = async function (msg, args) {
  const Canvas = Picto.new(800, 600);
  const ctx = Canvas.getContext("2d");

  msg.channel.send(".", file(Canvas.toBuffer(), "x.png"));
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
