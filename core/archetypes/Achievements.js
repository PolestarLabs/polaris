// @ts-nocheck
const { EventEmitter } = require("events");
let ACHIEVEMENTS = DB.achievements.find({}).lean().then(a=> ACHIEVEMENTS = a);


class AchievementsManager extends EventEmitter {

  get(ach) {
    return ACHIEVEMENTS.find(a=>a.id === ach);
  }

  //FIXME Consistency in USER / ACHIEVEMENT order
  async give(user, achievement) {
    await DB.achievements.award(user, achievement);
    return this.get(achievement);
    //NOTE PROPOSAL
    //  return DB.progression.set({achievement,user,type:'achievement'},{$set: {awarded:true} } );
  }

  has(achievementID, userData) {
    return !!(userData?.modules.achievements?.find((a) => a.id === achievementID));
    //NOTE PROPOSAL
    //  return !!(await DB.progression.get({achievement,user,type:'achievement'})).awarded;
  }

  //NOTE: Achievements updates may not be useful as it is retroactively detected based on persistent historic data.
  /*
    advance(achievement,user,value){
      return DB.progression.set({achievement,user,type:'achievement'},{$inc: {tracker:value} } );
    }
    update(achievement,user,value){
      //return DB.progression.set({achievement,user,type:'achievement'},{$set: {tracker:value} } );
    }
  */

  progress(achievementID, user, statistics) {
    //user = userData; used in eval
    //statistics is also used in eval

    if (!user || !user.modules) throw new Error("User must be a DB userData object");
    const achiev = this.get(achievementID);
    const conditions = achiev.condition?.split(">=") || 0;
    const goal = conditions?.[1] || 1;
    const current = eval(`try{${conditions[0] || 0}}catch(err){0}`); // eslint-disable-line no-eval
    const percent = (Math.floor((current * 100) / goal) / 100) || 0;

    return { current, goal, percent };
  }

  check(userData, awardRightAway,opts) {
    const {debug} = opts;
    return new Promise( async (resolve, reject) => {
      if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.get(userData.id || userData);
      if (!userData) reject(new Error("[AchievementsManager] UserData is Null"));
      const user = userData;
      const statistics = (await DB.control.get(userData.id)).data.statistics;

      const res = ACHIEVEMENTS.map((achiev) => {

        const revealed = userData.modules.level >= achiev.reveal_level
          && (this.has(achiev.id,userData) || true) && !!eval(achiev.reveal_requisites); // eslint-disable-line no-eval
        //&& (this.has(userData.id, achiev.achiev_requisites) || true) && !!eval(achiev.reveal_requisites); // eslint-disable-line no-eval
        const C1 = eval(`try{${achiev.condition}}catch(err){false}`); // eslint-disable-line no-eval
        let C2;
        if (achiev.advanced_conditions?.length > 0) {
          C2 = achiev.advanced_conditions.every((acv) => eval(`try{${acv}}catch(err){false}`)); // eslint-disable-line no-eval
        } else C2 = true;
        
        const awarded = userData.modules.achievements.find((b) => b.id === achiev.id)?.unlocked;
        const switcher = (c) => (c ? "✔️" : "❌");

        if (awardRightAway && C1 && C2) this.emit("award", achiev.id, user.id,opts);
        if (debug) return `${achiev.id.padEnd(20, " ")} 👁:${switcher(revealed)}  🔒:${switcher((C1 && C2))} 🏅:${switcher(awarded)} `;

        return {
          achievement: achiev.id, revealed, unlocked: (C1 && C2), awarded, progress: this.progress(achiev.id, userData, statistics),
        };

      });
      
      return resolve(res);
    });
  }
}




async function init(){
  await ACHIEVEMENTS;
  global.Achievements = new AchievementsManager();

  Achievements.on("award", async (achievement, uID, options = { msg: {}, DM: false }) => {
  
    //FIXME Temporary switch, must be uncommented later;
    //if (await Achievements.has(achievement,uID)) return null;
    
    const { DM, msg } = options;
    const userData = await DB.users.get(uID);
    const awarded = await Achievements.give(userData, achievement);
    DB.users.set(uID, { $inc: { "modules.exp": awarded.exp || 100 } });
    const DMchannel = await PLX.getDMChannel(uID);
    const channel = DM ? DMchannel : msg.channel || DMchannel;
  
    console.log(options,channel,DM)
  
    if (!channel) return awarded;
  
    //TODO Make this look better
    const embed = {
      title: $t("interface.achievementUnlocked", { lngs: msg.lang || ["dev"] }),
      description: `**${awarded.name}**\n> *${$t([`achievements:${awarded.id}.description`,awarded.description], { lngs: msg.lang || ["dev"] })}*`,
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
}

module.exports = {ACHIEVEMENTS, AchievementsManager, init};
