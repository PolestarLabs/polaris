// const gear = require('../../utilities/Gearbox');

const init = async function (msg) {
   
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
