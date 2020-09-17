// const gear = require('../../utilities/Gearbox');

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  const embed = new Embed();
  embed.setDescription(`:love_letter: ${$t("CMD.inviteText", { lngs: msg.lang })}(${paths.DASH}/invite) !`);
  embed.setColor("#ea7d7d");

  msg.channel.send({ embed });
};
module.exports = {
  init,
  pub: true,
  cmd: "invite",
  perms: 3,
  cat: "infra",
  botPerms: ["attachFiles"],
  aliases: [],
};
