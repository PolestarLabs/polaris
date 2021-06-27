const format = require("date-fns/format");
const locale = require("date-fns/locale/en-GB");

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const TG = await PLX.getTarget(msg.args[0] || msg.author.id, msg.guild);
  if (!TG) return msg.channel.send($t("responses.errors.kin404", P));
  P.target = TG.username;

  const member = msg.guild.member(TG).joinedAt;
  const wiki = format(member, "yyyy_MMMM_d")
  P.joinedstamp = `[${format(member, "ccc PPpp", { locale })}](https://en.wikipedia.org/wiki/Portal:Current_events/${wiki} "${$t("interface.generic.alotWentOn", P)}")`; // TODO[epic=bsian] Proper localisation support

  msg.channel.send({ embed: { description: $t("misc.memberSince", P), color: 11237342 } });
};
module.exports = {
  init,
  pub: true,
  cmd: "joined",
  perms: 3,
  cat: "utility",
  botPerms: ["embedLinks"],
  aliases: [],
};
