const init = async (m) => {
  m.reply("ok");
  PLX.softKill();
};

module.exports = {
  init,
  pub: false,
  cmd: "selfrestart",
  perms: 3,
  cat: "dev",
  botPerms: [],
  aliases: ["rst"],
};
