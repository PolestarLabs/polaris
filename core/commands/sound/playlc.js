const BOARD = require("../../archetypes/Soundboard.js");

const init = async function (msg, args) {
  BOARD.play(msg,args[0]);
};

module.exports = {
  init,
  pub: false,
  cmd: "playlc",
  cat: "sound",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
