// TRANSLATE[epic=translations] airwaifu
const init = async (msg, args) => {
  args = ["airplane", "1girl"];

  return require("./safebooru").init(msg, args, { title: ":airplane: Airwaifu", color: 0x63bbff });
};
module.exports = {
  init,
  pub: true,
  cmd: "airwaifu",
  perms: 3,
  cat: "anime",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  scope: "booru",
};
