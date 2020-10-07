// const gear = require("../utilities/Gearbox");
// const DB   = require("../database/db_ops");
const moment = require("moment");
// const locale = require(appRoot+'/utils/i18node');
// const $t = locale.getT();

class DailyCmd {
  constructor(command, options) {
    this.command = command;
    this.day = options.day || 7.2e+7;
    this.expiration = options.expiration || null;
    this.streak = options.streak || false;
  }

  async userData(user) {
    const USERDATA = await DB.users.get({ id: user.id }, undefined, "users");
    const userDaily = USERDATA.counters?.[this.command] || { last: 1, streak: 1 };
    return userDaily;
  }

  async dailyAvailable(user) {
    const now = Date.now();
    const userDaily = await this.userData(user);
    return now - (userDaily.last || 0) >= this.day;
  }

  async keepStreak(user) {
    const now = Date.now();
    const userDaily = await this.userData(user);
    return now - (userDaily.last || 0) <= this.expiration;
  }
}
exports.init = async function init(message, cmd, opts, success, reject, info, presuccess) {
  const P = { lngs: message.lang };
  const lang = message.lang[0];
  moment.locale(lang);

  const Daily = new DailyCmd(cmd, opts);
  const v = {
    last: $t("interface.daily.lastdly", P),
    next: $t("interface.daily.next", P),
    streakcurr: $t("interface.daily.streakcurr", P),
    expirestr: $t("interface.daily.expirestr", P),
  };

  const Author = message.author;
  if (Author.dailing === true) return message.channel.send(`There's already a \`${Daily.command}\` request going on!`);

  const DAY = Daily.day;

  const userDaily = (await Daily.userData(Author)).last || Date.now();
  const dailyAvailable = await Daily.dailyAvailable(Author);

  const embed = new Embed();
  embed.setColor("#d83668");
  if (message.args.includes("status") || message.args.includes("stats") || message.args.includes("info")) {
    
    const remain = userDaily + DAY;
    if (info) return info(message, Daily, remain);
    const embe2 = new Embed();
    embe2.setColor("#e35555");
    embe2.description(`
${_emoji("time")} ${_emoji("offline")} **${v.last}** ${moment.utc(userDaily).fromNow()}
${_emoji("future")} ${dailyAvailable
  ? _emoji("online")
  : _emoji("dnd")} **${v.next}** ${moment.utc(userDaily).add((DAY / 1000 / 60 / 60), "hours").fromNow()}
  `);
    return message.channel.send({ embed: embe2 });
  }

  if (!dailyAvailable && !( PLX.timerBypass?.includes(Author.id) )/**/) {
    const remain = userDaily + DAY;
    Daily.userDataStatic = userDaily;
    return reject(message, Daily, remain);
  }
  if (presuccess) {
    const pre = await presuccess(message, Daily);
    if (pre !== true) return null;
  }

  Author.dailing = true;
  await wait(1);
  const now = Date.now();
  DB.users.set(Author.id, { $set: { [`counters.${Daily.command}.last`]: now } });
  if (Daily.streak && await Daily.keepStreak(Author)) {
    DB.users.set(Author.id, { $inc: { [`counters.${Daily.command}.streak`]: 1 } });
  } else if (Daily.streak && !(await Daily.keepStreak(Author))) {
    DB.users.set(Author.id, { $set: { [`counters.${Daily.command}.streak`]: 1 } });
  }

  success(message, Daily);

  Author.dailing = false;
  return null;
};
