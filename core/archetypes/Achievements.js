// @ts-nocheck
const { EventEmitter } = require("events");
let ACHIEVEMENTS = DB.achievements.find({}).noCache().lean().then(a=> ACHIEVEMENTS = a);


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
    return !!(userData?.modules?.achievements?.find((a) => a.id === achievementID));
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

  check(userData, awardRightAway,opts = {}) {
    const {debug,filter} = opts;
    return new Promise( async (resolve, reject) => {
      
      if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.findOne( {id: userData.id || userData} ).noCache().lean();
      if (!userData) reject(new Error("[AchievementsManager] UserData is Null"));
      const user = userData;
      const statistics = (await DB.control.findOne({id:userData.id}).noCache()).data.statistics;

      console.log(`Achievements Check [${userData?.id||userData}]`.gray);
      
      const res = ACHIEVEMENTS.map((achiev) => {

        if (!achiev?.condition) return;
        console.log({achiev})
        const SCOPES = {user,statistics};
        const isRevealed = userData.modules.level >= achiev.reveal_level;
        
        const [scope,category,unit,ticker] = achiev?.condition?.split('.') || [];
        let checkedValue = achiev.target;

        let tracker = SCOPES?.[scope]?.[category]?.[unit]?.[ticker];
        tracker ??= SCOPES?.[scope]?.[category]?.[unit];
        tracker ??= SCOPES?.[scope]?.[category];
        //tracker ??= SCOPES?.[scope];

        
        let conditionMet = false; 
        if (typeof Number(checkedValue) === 'number') checkedValue = Number(checkedValue), conditionMet = tracker >= checkedValue;
        if (typeof checkedValue === 'string') conditionMet = checkedValue.includes(conditionMet);
        
        const C1 = conditionMet;

        //  && (this.has(achiev.id,userData) || true) && !!eval(achiev.reveal_requisites); // eslint-disable-line no-eval
        //&& (this.has(userData.id, achiev.achiev_requisites) || true) && !!eval(achiev.reveal_requisites); // eslint-disable-line no-eval
        //const C1 = eval(`try{${achiev.condition}}catch(err){false}`); // eslint-disable-line no-eval
        let C2;
        if (achiev.advanced_conditions?.length > 0) {
         // C2 = achiev.advanced_conditions.every((acv) => eval(`try{${acv}}catch(err){false}`)); // eslint-disable-line no-eval
        } else C2 = true;
        C2=true;
        
        const awarded = userData.modules.achievements.find((b) => b.id === achiev.id)?.unlocked;

        const switcher = (c) => (c ? "✔️" : "❌");

        //if (awardRightAway && C1 && C2 && !awarded) this.emit("award", achiev.id, user.id,opts);
        if (debug == 2){
           return `//${isRevealed ? achiev.name.padEnd(40, " ") : "".padEnd(achiev.name.length,"•").padEnd(40," ") }\n   Lv:${(achiev.reveal_level+"").padStart(3," ")} 🔒:${switcher((C1 && C2))} 🏅:${switcher(awarded)} `;
        } else if (debug) {
          if(!filter || awarded) return `${achiev.id.padEnd(20, " ")} Lv:${(achiev.reveal_level+"").padStart(3," ")}  👁:${switcher(isRevealed)}  🔒:${switcher((C1 && C2))} 🏅:${switcher(awarded)} `;
          else return null;
        };

        return {
          achievement: achiev.id, revealed: isRevealed, unlocked: (C1 && C2), awarded, progress: this.progress(achiev.id, userData, statistics),
        };

      });
      if (debug){
        return resolve(res.filter(x=>x).join('\n'));
      }
      return resolve(res.filter(x=>x));
    });
  }
}




async function init(){
  await ACHIEVEMENTS;
  global.Achievements = new AchievementsManager();

  Achievements.on("award", async (achievement, uID, options = { msg: {}, DM: false }) => {
  
    //if(uID !="88120564400553984") return;
    if( !options?.msg?.guild || options.msg.guild != '789382326680551455' ) return;
    //FIXME Temporary switch, must be uncommented later;
    if (await Achievements.has(achievement,uID)) return null;
    
    const { DM, msg } = options;
    const userData = await DB.users.get(uID);
    const awarded = await Achievements.give(userData, achievement);
    DB.users.set(uID, { $inc: { "modules.exp": awarded.exp || 100 } });
    const DMchannel = await PLX.getDMChannel(uID);
    const channel = DM ? DMchannel : msg.channel || DMchannel;
  
    //console.log(options)
  
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
        console.error(e);
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
