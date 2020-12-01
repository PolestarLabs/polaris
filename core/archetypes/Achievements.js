const { EventEmitter } = require("events");

class AchievementsManager extends EventEmitter {
  get(ach) {
    return DB.achievements.findOne({ id: ach }).lean().exec();
  }

  async give(user, ach) {
    await DB.achievements.award(user, ach);
    return this.get(ach);
  }

  has(ach, user) {
    return DB.users.get(user.id || user).then((userData) => !!(userData?.modules.achievements?.find((a) => a.id === ach)));
  }

  async progress(ach, user) {
    if ((!user?.modules && user.id) || typeof user === "string") user = await DB.users.get(user.id || user);
    const achiev = await this.get(ach);
    const conditions = achiev.condition?.split(">=") || 0;
    const goal = conditions?.[1] || 1;
    const current = eval(`try{${conditions[0] || 0}}catch(err){0}`); // eslint-disable-line no-eval
    const percent = (Math.floor((current * 100) / goal) / 100) || 0;

    return { current, goal, percent };
  }

  async check(userData, beau, awardRightAway) {
    if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.get(userData.id || userData);
    if (!userData) reject("[AchievementsManager] UserData is Null");

    const res = await DB.achievements.find({}, {
      _id: 0, id: 1, reveal_requisites: 1, reveal_level: 1, advanced_conditions: 1, condition: 1,
    }).lean().exec().then((a) => Promise.all(
      a.map(async (achiev) => {
        const user = userData;
        const revealed = userData.modules.level >= achiev.reveal_level
        && (this.has(userData.id, achiev.achiev_requisites) || true) && !!eval(achiev.reveal_requisites); // eslint-disable-line no-eval
        const C1 = eval(`try{${achiev.condition}}catch(err){false}`); // eslint-disable-line no-eval
        let C2;
        if (achiev.advanced_conditions?.length > 0) {
          C2 = achiev.advanced_conditions.every((acv) => eval(`try{${acv}}catch(err){false}`)); // eslint-disable-line no-eval
        } else C2 = true;
        const awarded = userData.modules.achievements.find((b) => b.id === achiev.id)?.unlocked;
        const switcher = (c) => (c ? "✔️" : "❌");

        if (awardRightAway && C1 && C2) this.emit("award", achiev.id, user.id);
        if (beau) return `${achiev.id.padEnd(20, " ")} 👁:${switcher(revealed)}  🔒:${switcher((C1 && C2))} 🏅:${switcher(awarded)} `;

        return {
          achievement: achiev.id, revealed, unlocked: (C1 && C2), awarded, progress: await this.progress(achiev.id, userData),
        };
      }),
    ));
    return resolve(res);
  }
}

global.Achievements = new AchievementsManager();

Achievements.on("award", async (achievement, uID, options = { msg: {}, DM: false }) => {
  const { DM, msg } = options;
  const userData = await DB.users.get(uID);
  const awarded = await Achievements.give(userData, achievement);
  DB.users.set(uID, { $inc: { "modules.exp": awarded.exp || 100 } });
  const DMchannel = await PLX.getDMChannel(uID);
  const channel = DM ? DMchannel : msg.channel || DMchannel;

  if (!channel) return awarded;

  const embed = {
    title: $t("interface.achievementUnlocked", { lngs: msg.lang || ["dev"] }),
    description: `**${awarded.name}**\n> *${$t(`achievements:${awarded.id}.howto`, { lngs: msg.lang || ["dev"] })}*`,
    thumbnail: { url: `${paths.CDN}/build/achievements/${awarded.icon}.png` },
    timestamp: new Date(),
    color: awarded.color || 0xEf9f8a,
    footer: msg.author ? { text: msg.author.tag, icon_url: msg.author.avatarURL } : {},
  };

  if (!((channel.DISABLED || []).includes("ACHIEVEMENTS")) || msg?.command) {
    channel.createMessage({ embed }).catch((e) => {
      console.log(e);
      return DMchannel.createMessage({ embed }).catch(() => null);
    });
  } else if (userData.allowDMs !== false) {
    console.log("X");
    return DMchannel.createMessage({ embed }).catch(() => null);
  }
  return null;
});

module.exports = AchievementsManager;
