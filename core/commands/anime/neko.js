// const gear = require('../../utilities/Gearbox');
const init = async (msg, args) => {
  args = ["cat_ears", "1girl"];

  return require("./safebooru").init(msg, args, { title: " ", color: 0xff7c75 });
};
module.exports = {
  init,
  pub: true,
  cmd: "neko",
  perms: 3,
  cat: "anime",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["catgirl"],
  scope: "booru",
};
