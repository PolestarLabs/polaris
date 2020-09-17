// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  const TARGET = msg.content.split(/ +/).length > 1 ? (await PLX.getTarget(msg.args[0])) : msg.author;
  const userdata = await DB.users.getFull({ id: TARGET.id });
  if (!userdata) return msg.channel.send("User not in DB");
  const adress = userdata.personalhandle || userdata.id;
  const mess = `<:Userlocation:338762651423473668> | ${paths.DASH}/p/${adress}`;
  msg.channel.send(mess);
};
module.exports = {
  init,
  pub: true,
  cmd: "profilelink",
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["pfl"],
};
