const moment = require("moment");
const Timed = require("../../structures/TimedUsage");

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  let Target = await PLX.getTarget(msg.args[0] || msg.author, msg.guild, false);
  if (!Target) Target = msg.author;

  const userData = await DB.users.findOne({ id: msg.author.id }).noCache();
  const targetData = (await DB.commends.parseFull({ id: Target.id })) || { id: Target.id, whoIn: [], whoOut: [] };

  const preafter = async function preafter(M, D) {
    if (userData.modules.inventory.find((itm) => itm.id === "commendtoken")?.count >= 1) {
      if (Target.id === msg.author.id) {
        msg.channel.send(_emoji("nope") + $t("responses.commend.noSelf", P));
        return false;
      }
    } else {
      msg.reply($t("responses.commend.noItem", P));
      return false;
    }
    return true;
  };

  const after = async function after(msg, Dly) {
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

    Progression.emit("command.commend.commit", {msg,userID:msg.author.id})
    msg.channel.send({ embed });
  };

  const reject = function (msg, Daily, r) {
    P.remaining = moment.utc(r).fromNow(true);
    const dailyNope = $t("responses.commend.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description(_emoji("nope") + dailyNope);
    return msg.channel.send({ embed });
  };

  const status = async function (msg, Daily) {
    const userDaily = await Daily.userData(msg.author);
    const dailyAvailable = await Daily.available(msg.author);
    P.remaining = moment.utc(userDaily.last).add(Daily.day, "milliseconds").fromNow(true);
    const embed = new Embed();
    embed.setColor("#3b9ea5");
    embed.description(
      `${_emoji("future")} ${dailyAvailable ? _emoji("online") + $t("responses.commend.check_yes", P) : _emoji("dnd") + $t("responses.commend.check_no", P)}\   
      \n\n:reminder_ribbon: × **${userData.modules.inventory.find((i) => i.id === "commendtoken")?.count || 0}**`,
    );
    return msg.channel.send({ embed });
  };
  //TODO[epic=Constants Module] Replace
  Timed.init(msg, "commend", { day: 3.6e+6 }, after, reject, status, preafter);
};

const info = async (msg, args) => {
  const Target = await PLX.getTarget(args[0] || msg.author, msg.guild);

  const targetData = (await DB.commends.parseFull({ id: Target.id })) || { id: Target.id, whoIn: [], whoOut: [] };

  const metas = await DB.users.find({ id: { $in: targetData.whoIn.map((u) => u.id) } }, { id: 1, meta: 1 }).sort({ amt: -1 }).lean().exec();
  const commendT3 = targetData.whoIn.map((u) => ({ name: metas.find((x) => x.id === u.id)?.meta?.tag || `<@${u.id}>`, amt: u.count })).sort((c1, c2) => c2.amt - c1.amt);
  const embed = new Embed()
    .color("#3b9ea5").thumbnail(`${paths.CDN}/build/rank.png`)
    .description(
      `__**Commend Info for ${Target.mention}**__\
      \n\u2003 Total Commends Received: **${targetData.totalIn || 0}**\
      \n\u2003 Total Commends Given: **${targetData.totalOut || 0}**\
    ${commendT3.length == 0 ? ""
    : `\n\n__**Top Commenders**__\
      \n\u2003 ${commendT3[0] ? `**${commendT3[0].name}** > ${commendT3[0].amt}` : ""}\
      \n\u2003 ${commendT3[1] ? `**${commendT3[1].name}** > ${commendT3[1].amt}` : ""}\
      \n\u2003 ${commendT3[2] ? `**${commendT3[2].name}** > ${commendT3[2].amt}` : ""}`
      }`,
    );

  return { embed };
};

module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "commend",
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["com", "rec", "rep"],
  autoSubs: [
    { label: "info", gen: info },
  ],
};