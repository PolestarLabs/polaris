const BOARD = require("../../archetypes/Soundboard.js");

const init = async function (msg) {
  BOARD.play(msg, `${appRoot}/../assets/sound/bolinadegolfe.mp3`);
};

module.exports = {
  init,
  pub: false,
  cmd: "bolinha",
  cat: "sound",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
