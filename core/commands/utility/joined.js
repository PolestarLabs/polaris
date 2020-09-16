// const gear = require('../../utilities/Gearbox/global');
// const DB = require('../../database/db_ops');

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  const moment = require("moment");
  moment.locale(msg.lang[0]);

  const TG = await PLX.getTarget(msg.args[0] || msg.author.id, msg.guild);
  if (!TG) return msg.channel.send($t("responses.errors.kin404", P));
  const joinMoment = moment.utc(msg.guild.member(TG).joinedAt);
  moment.locale("en");
  const joinMomentNeutral = moment.utc(msg.guild.member(TG).joinedAt);
  P.target = TG.username;
  P.joinedstamp = joinMoment.format(moment.localeData().longDateFormat("LLLL"));

  const wiki = `${joinMomentNeutral.format("YYYY")}_${joinMomentNeutral.format("MMMM")}_${joinMomentNeutral.format("D")}`;

  P.joinedstamp = `[${P.joinedstamp}](https://en.wikipedia.org/wiki/Portal:Current_events/${wiki} "${$t("interface.generic.alotWentOn", P)}")`;

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
