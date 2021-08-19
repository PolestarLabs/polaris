const { TimedUsage } = require("@polestar/timed-usage");

const init = async function (msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const timed = await new TimedUsage("commend", { day: 3.6e+6 }).loadUser(msg.author);

  if (args[0]?.toLowerCase() === "status") {
    P.remaining = `<t:${~~((timed.userDaily.last + timed.day) / 1000)}:R>`;
    const embed = new Embed();
    embed.setColor("#3b9ea5");
    embed.description(`${_emoji("future")} ${timed.available ? _emoji("online") + $t("responses.commend.check_yes", P) : _emoji("dnd") + $t("responses.commend.check_no", P)}\   
      \n\n:reminder_ribbon: × **${timed.userData.modules.inventory.find((i) => i.id === "commendtoken")?.count || 0}**`);
    return msg.channel.send({ embed });
  }

  if (!timed.available) {
    P.remaining = `<t:${~~((timed.availableAt - Date.now()) / 1000)}:R>`; // TODO[epic=bsian] Clean up the Math.abs
    const dailyNope = $t("responses.commend.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description(_emoji("nope") + dailyNope);
    return msg.channel.send({ embed });
  }

  const Target = await PLX.resolveMember(msg.guild.id, args[0], { enforceDB: true }).catch(() => {});
  if (!Target) return msg.reply($t("responses.errors.kin404", P));

  if (Target.id === msg.author.id) {
    return msg.channel.send(_emoji("nope") + $t("responses.commend.noSelf", P));
  }
  if (timed.userData.modules.inventory.find((itm) => itm.id === "commendtoken")?.count < 1) {
    return msg.reply($t("responses.commend.noItem", P));
  }

  const userData = await DB.users.findOne({ id: msg.author.id });
  const targetData = await DB.commends.parseFull({ id: Target.id }) || { id: Target.id, whoIn: [], whoOut: [] };
  if (!userData || !targetData) return "Error, one of the users are not present in Database";

  await Promise.all([
    userData.removeItem("commendtoken"),
    DB.commends.add(userData.id, Target.id, 1),
  ]);

  P.target = Target.nick || (Target.user || Target).username;
  P.author = msg.member.nick || msg.author.username;
  P.cmcount = (targetData.totalIn + 1) || 0;
  P.pplcount = targetData.whoIn.length + 1;

  const embed = new Embed()
    .thumbnail(`${paths.DASH}/build/rank.png`)
    .color("#3b9ea5")
    .timestamp(new Date())
    .description(`
          ${$t("responses.commend.give", P)}
          ${$t("responses.commend.totals", P)}
          `);

  Progression.emit("command.commend.commit", { msg, userID: msg.author.id });
  return msg.channel.send({ embed });
};

const info = async (msg, args) => {
  const Target = await PLX.getTarget(args[0] || msg.author, msg.guild);

  const targetData = await DB.commends.parseFull({ id: Target.id }) || { id: Target.id, whoIn: [], whoOut: [] };

  const metas = await DB.users.find({ id: { $in: targetData.whoIn.map((u) => u.id) } }, { id: 1, meta: 1 }).sort({ amt: -1 })
    .lean()
    .exec();
  const commendT3 = targetData.whoIn.map((u) => ({ name: metas.find((x) => x.id === u.id)?.meta?.tag || `<@${u.id}>`, amt: u.count })).sort((c1, c2) => c2.amt - c1.amt);
  const embed = new Embed()
    .color("#3b9ea5")
    .thumbnail(`${paths.CDN}/build/rank.png`)
    .description(`__**Commend Info for ${Target.mention}**__\
      \n\u2003 Total Commends Received: **${targetData.totalIn || 0}**\
      \n\u2003 Total Commends Given: **${targetData.totalOut || 0}**\
    ${commendT3.length == 0 ? ""
    : `\n\n__**Top Commenders**__\
      \n\u2003 ${commendT3[0] ? `**${commendT3[0].name}** > ${commendT3[0].amt}` : ""}\
      \n\u2003 ${commendT3[1] ? `**${commendT3[1].name}** > ${commendT3[1].amt}` : ""}\
      \n\u2003 ${commendT3[2] ? `**${commendT3[2].name}** > ${commendT3[2].amt}` : ""}`
}`);

  return { embed };
};

module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "commend",
  perms: 3,
  cat: "social",
  botPerms: [ "attachFiles", "embedLinks" ],
  aliases: [ "com", "rec", "rep" ],
  autoSubs: [
    { label: "info", gen: info },
  ],
};
