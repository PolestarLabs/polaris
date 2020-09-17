const moment = require("moment");
const Timed = require("../../structures/TimedUsage");

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  let Target = await PLX.getTarget(msg.args[0] || msg.author, msg.guild, false);
  if (!Target) {
    Target = msg.author
  }

  const userData = await DB.users.getFull({ id: msg.author.id });
  const targetData = (await DB.users.getFull({ id: Target.id })) || (await DB.users.new(Target));
  const targetDataC = (await DB.commends.findOne({ id: Target.id })) || { id: Target.id, whoIn: [], whoOut: [] };

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
      userData.incrementAttr("commended", 1),
      targetData.incrementAttr("commend", 1),
      targetData.upCommend(msg.author),

    ]);

    P.target = Target.nick || (Target.user || Target).username;
    P.author = msg.member.nick || msg.author.username;
    P.cmcount = (targetData.modules.commend + 1) || 0;
    P.pplcount = targetDataC.whoIn.length;

    const embed = new Embed()
      .thumbnail("https://pollux.fun/build/rank.png")
      .color("#3b9ea5")
      .timestamp(new Date())
      .description(`
            ${$t("responses.commend.give", P)}
            ${$t("responses.commend.totals", P)}
            `);
    console.log(embed);
    msg.channel.send({ embed });
  };

  const reject = (msg, Daily, r) => {
    P.remaining = moment.utc(r).fromNow(true);
    const dailyNope = $t("responses.commend.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description(_emoji("nope") + dailyNope);
    return msg.channel.send({ embed });
  };

  const status = async function (msg, Daily) {
    const userDaily = await Daily.userData(msg.author);
    const dailyAvailable = await Daily.dailyAvailable(msg.author);
    P.remaining = moment.utc(userDaily.last).add(Daily.day, "milliseconds").fromNow(true);
    const embe2 = new Embed();
    embe2.setColor("#3b9ea5");
    embe2.description(`
    ${_emoji("future")} ${dailyAvailable ? _emoji("online") + $t("responses.commend.check_yes", P) : _emoji("dnd") + $t("responses.commend.check_no", P)} 
       
    :reminder_ribbon: × **${userData.modules.inventory.find((i) => i.id === "commendtoken")?.count || 0}**
         `);
    return msg.channel.send({ embed: embe2 });
  };

  Timed.init(msg, "commend", { day: 3.6e+6 }, after, reject, status, preafter);
};

const info = async (msg, args) => {

  const Target = await PLX.getTarget(args[0]||msg.author, msg.guild) ;

  const [targetData, targetDataC] = await Promise.all([
    (await DB.users.getFull({ id: Target.id })) || (await DB.users.new(Target)),
    ((await DB.commends.findOne({ id: Target.id }).lean().exec()) || { id: Target.id, whoIn: [], whoOut: [] }),
  ]);

  const metas = await DB.users.find({ id: { $in: targetDataC.whoIn.map((u) => u.id) } }, { id: 1, meta: 1 }).sort({ amt: -1 }).lean().exec();
  const commendT3 = targetDataC.whoIn.map((u) => ({ name: metas.find((x) => x.id === u.id).meta.tag, amt: u.count }));
  const embed = new Embed()
    .color("#3b9ea5").thumbnail(`${paths.CDN}/build/rank.png`)
    .description(
      `__**Commend Info for ${Target.mention}**__
\u2003        Total Commends Received: **${targetData.modules.commend || 0}**
\u2003        Total Commends Given: **${targetData.modules.commended || 0}**
    ${
  commendT3.length > 0 ? `
            __**Top Commenders**__
\u2003        ${commendT3[0] ? `**${commendT3[0].name}** > ${commendT3[0].amt}` : ""}  
\u2003        ${commendT3[1] ? `**${commendT3[1].name}** > ${commendT3[1].amt}` : ""}  
\u2003        ${commendT3[2] ? `**${commendT3[2].name}** > ${commendT3[2].amt}` : ""}  

` : ""}`,
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
  aliases: ["com", "rec"],
  autoSubs: [
    { label: "info", gen: info },
  ],
};
