const moment = require("moment");

class DailyCmd {
  /**
   * 
   * @param {string} command The name of the command/item to be timed. This string is how it is gonna be called in database, must be unique.
   * @param {object} options opts
   * @param {number|7.2e+7} options.day Cooldown time in milliseconds
   * @param {boolean|false} [options.streak]
   * @param {number|null} [options.expiration] If there is a streak tracking, the timeout of said streak
   * 
   * @returns {void}
   */

  constructor(command, options) {
    this.command = command;
    this.day = options.day || 7.2e+7;
    this.expiration = options.expiration || null;
    this.streak = options.streak || false;
  }

  async parseUserData(user) {
    const USERDATA = await DB.users.get({ id: user.id }, undefined, "users");
    const userDaily = USERDATA.counters?.[this.command] || { last: 1, streak: 1 };
    this.userDaily = userDaily
    return userDaily;
  }
  userData(user) {
    return this.parseUserData // COMPATIBILITY
  }

  available(user) {
    const now = Date.now();
    const userDaily = this.userDaily;
    return now - (userDaily.last || 0) >= this.day;
  }

  keepStreak() {
    const now = Date.now();
    const userDaily = this.userDaily;
    return now - (userDaily.last || 0) <= this.expiration;
  }

  async streakProcess(streakContinues, user) {
    if (streakContinues) {
      if (this.userDaily.streak > (this.userDaily.highest || 1)) {
        await DB.users.set(user.id, { [`counters.${this.command}.highest`]: this.userDaily.streak });
      }
      if (this.userDaily.streak == 1) return "first";
      return "pass";

    } else {
      if (this.userDaily.streak <= 1) {
        return 'pass'
      } else if (this.userDaily.insured) {
        await DB.users.set(user.id, { [`counters.${this.command}.insured`]: false });
        this.userDaily.insured = false;
        return "recovered";
      } else {
        await DB.users.set(user.id, { [`counters.${this.command}.lastStreak`]: this.userDaily.streak });
        this.userDaily.lastStreak = this.userDaily.streak
        this.userDaily.streak = 1
        return "lost";
      }
    }
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
  if (Author.dailing === true) return Author.dailing = false && message.channel.send(`There's already a \`${Daily.command}\` request going on!`);

  const DAY = Daily.day;



  await Daily.parseUserData(Author);

  const userDaily = Daily.userDaily.last || Date.now();
  const dailyAvailable = Daily.available(Author);


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

  if (!dailyAvailable && !(PLX.timerBypass?.includes(Author.id))/**/) {
    const remain = userDaily + DAY;
    Daily.userDataStatic = userDaily;
    return reject(message, Daily, remain);
  }
  if (presuccess) {
    const pre = await presuccess(message, Daily);
    if (pre !== true) return null;
  }

  // NOTE debug - delete later
  const DEBUG_LOG = () => hook.info(`${Author.id} - dailing = ${Author.dailing}`);

  Author.dailing = true; // end function is for scope
  const end = () => Author.dailing = false;

  DEBUG_LOG();
  Author.dailing = false;
  try {
    await wait(.2);
    const now = Date.now();
    DB.users.set(Author.id, { $set: { [`counters.${Daily.command}.last`]: now } });

    let streakStatus = await Daily.streakProcess(Daily.keepStreak(), Author);

    if (Daily.streak && streakStatus !== 'lost') {
      if (streakStatus === 'recovered') Daily.insuranceUsed = true;
      DB.users.set(Author.id, { $inc: { [`counters.${Daily.command}.streak`]: 1 } });
    } else if (Daily.streak && streakStatus === 'lost') {
      DB.users.set(Author.id, { $set: { [`counters.${Daily.command}.streak`]: 1 } });
    }
    Daily.streakStatus = streakStatus;

    end();
    success(message, Daily);
    DEBUG_LOG();
    return null;
  } catch (e) {
    end();
    DEBUG_LOG();
    throw e;
  }


};


