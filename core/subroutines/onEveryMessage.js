const Drops = require("./boxDrops").lootbox;

/**
 * @param {{ author: { id: any; }; guild: { id: any; }; }} msg
 */
async function incrementLocal(msg) {
  DB.localranks.get({ user: msg.author.id, server: msg.guild.id }).then(async (data) => {
    if (!data) await DB.localranks.new({ U: msg.author, S: msg.guild });
    await DB.localranks.incrementExp({ U: msg.author.id, S: msg.guild.id });
  });
}

/**
 * @param {{ author: { bot: any; id: any; avatarURL: any; tag: any; }; guild: { id: string; }; channel: { id: any; send: (arg0: { embed: { color: number; description: string; footer: { icon_url: any; text: any; }; }; }) => void; }; member: { addRole: (arg0: any) => Promise<any>; removeRole: (arg0: any) => Promise<any>; }; }} msg
 */
async function levelChecks(msg) {



  if (msg.author.bot) return;

  if (msg.guild.id === "110373943822540800") return;

  let servData = await DB.servers.findOne({ id: msg.guild.id }).noCache();
  if (!servData) return;

  if (servData.switches?.chLvlUpOff?.includes(msg.channel.id)) {
    servData = null;
    return;
  }


  const _FACTOR = servData.modules.UPFACTOR || 0.5;

  const LOCAL_RANK = (await DB.localranks.findOne({ user: msg.author.id, server: msg.guild.id }).noCache())
    || {
    user: msg.author.id, server: msg.guild.id, exp: 0, level: 0,
  };


  const curLevelLocal = Math.floor(_FACTOR * Math.sqrt(LOCAL_RANK.exp));
  // let forNext_local = Math.trunc(Math.pow(((LOCAL_RANK.level||0) + 1) / _FACTOR, 2));


  if (!servData.switches?.chExpOff?.includes(msg.channel.id)) {
    incrementLocal(msg);
    // incrementGlobal(msg);
  }

  // @ts-ignore
  if (global.piggyback) return;

  /// =======  [LOCAL LVUP] ========///
  if (curLevelLocal < LOCAL_RANK.level) {
    // console.log("DELEVEL");

    await DB.localranks.set({ server: msg.guild.id, user: msg.author.id }, { $set: { level: LOCAL_RANK.level, exp: LOCAL_RANK.exp } });
  }

  //TODO[epic=anyone] Add level up image
  if (curLevelLocal > LOCAL_RANK.level) {

    await DB.localranks.set({ user: msg.author.id, server: msg.guild.id }, { $set: { level: curLevelLocal } });

    console.log({
      "!!servData.modules.LVUP_local": !!servData.modules.LVUP_local,
      "!servData.switches?.chLvlUpOff?.includes(msg.channel.id)": !servData.switches?.chLvlUpOff?.includes(msg.channel.id)
      , servData
    });

    const lvupText = (servData._doc || servData).modules?.LVUP_text?.replaceAll('%lv%', curLevelLocal);

    if (
      !!servData.modules.LVUP_local
      && !servData.switches?.chLvlUpOff?.includes(msg.channel.id)
    ) {
      const embed = {
        color: 0x6699FF,
        description: lvupText || `:tada: **Level Up!** >> ${curLevelLocal}`,
        footer: { icon_url: msg.author.avatarURL, text: msg.author.tag },
      };
      msg.channel.send({ embed });
    }

    if (servData.modules.AUTOROLES) {
      // ADD AUTOROLES
      const AUTOS = servData.modules.AUTOROLES;
      const sorting = function sorting(a, b) { return b[1] - a[1]; };
      AUTOS.sort(sorting);
      const levels = AUTOS.map((r) => r[1]);

      const roleStack = servData.modules.autoRoleStack !== false;

      for (let i = 0; i < levels.length; i += 1) {
        if (!AUTOS || !AUTOS.length) return;
        msg.member.addRole(AUTOS.find((r) => r[1] === curLevelLocal)[0]).catch(() => "noperms");
        if (roleStack === true) {
          const autorole = AUTOS.find((r) => r[1] <= curLevelLocal);
          if (autorole) msg.member.addRole(autorole[0]).catch(() => "noperms");
        } else if (roleStack === false) {
          const autorole = AUTOS.find((r) => r[1] !== curLevelLocal);
          if (autorole) msg.member.removeRole(autorole[0]).catch(() => "noperms");
        }
      }
    }

    // -------------------------------//
  }

  if (servData.modules.LVUP === true) {
    globalLevelUp(msg, servData)
  }


  servData = null;
}

module.exports = async (msg) => {
  if (!msg.guild) return console.log('noguild');
  if (msg.channel.type !== 0) return console.log('channel type nonzero');


  if (msg.guild.customResponses) {
    activateResponse(msg)
  } else {
    let gResps = (await DB.responses.find({ server: msg.guild.id }).noCache()) || [];
    msg.guild.customResponses = gResps;
    activateResponse(msg)
  }

  if (msg.guild.imagetracker && !msg.channel.nsfw) {
    const hasImageURL = msg.content.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g);
    if (msg.attachments?.[0] || hasImageURL) {
      /* Do Stuff when there is image */
    }
  }

  PLX.execQueue = PLX.execQueue.filter((itm) => itm?.constructor === Promise && itm.isFulfilled() !== true);
  PLX.execQueue.push(
    Promise.all([
      // @ts-ignore
      levelChecks(msg),
      Drops(msg),
    ]).then(x => true).timeout(25000).catch((err) => console.error(err)),
  );
};

/**
 * @param {{ author: { id: any; tag: any; getDMChannel: () => Promise<any>; }; }} msg
 */
async function globalLevelUp(msg) {
  /// ======= [GLOBAL LVUP] ========///
  await wait(2);
  let { curLevelG, userData } = (await checkGlobalLevel(msg)) || {};
  if (!curLevelG || !userData) return;
  if (curLevelG < userData.modules.level) {
    return;
    // console.log("DELEVEL");
    // await userDB.set(message.author.id,{$set:{'modules.level':curLevel}});
  } else if (curLevelG > userData.modules.level) {
    await DB.users.set(msg.author.id, { $set: { "modules.level": curLevelG } });

    await wait(2);

    await msg.channel.send({
      messageReferenceID: msg.id
    }, {
      file: await resolveFile(`${paths.GENERATORS}/levelup.gif?level=${curLevelG}&cache=1&avatar=${msg.author.avatarURL}&uid=${msg.author.id}`),
      name: "levelUp.gif"
    });

    console.log("[GLOBAL LEVEL UP]".blue, (msg.author.tag).yellow, msg.author.id);

    /** @type {string} */
    let polizei;
    if (curLevelG % 25 === 0) {
      polizei = "UR";
      await userData.addItem("lootbox_UR_O");
    } else if (curLevelG % 15 === 0) {
      polizei = "SR";
      await userData.addItem("lootbox_SR_O");
    } else if (curLevelG % 10 === 0) {
      polizei = "R";
      await userData.addItem("lootbox_R_O");
    } else if (curLevelG % 5 === 0) {
      polizei = "U";
      await userData.addItem("lootbox_U_O");
    } else {
      polizei = "C";
      await userData.addItem("lootbox_C_O");
    }

    servData = null;

    // delete require.cache[require.resolve("./modules/dev/levelUp_infra.js")]
    msg.author.getDMChannel().then(async dmChan => {
      if (!userData?.switches || userData.switches?.LVUPDMoptout === true) return;

      if (await PLX.redis.aget("noDMs." + userData.id)) return;

      dmChan.createMessage(`**+1** x ${_emoji("loot")}${_emoji(polizei)} Level Up Bonus!`).catch(err => {
        PLX.redis.set("noDMs." + userData.id, true);
        PLX.redis.expire("noDMs." + userData.id, 15 * 60);
      });
    });
    // require("./modules/dev/levelUp_infra.js").init(msg);
  }
  // -------------------------------//
}
/**
 * @param {{ author: { id: any; }; }} msg
 */
async function checkGlobalLevel(msg) {
  let userData = await DB.users.findOne({ id: msg.author.id }).noCache();
  if (!userData) return;
  const _CURVE = 0.0427899;
  const curLevelG = Math.floor(_CURVE * Math.sqrt(userData.modules.exp));
  // let forNext_G = Math.trunc(Math.pow((userData.modules.level + 1) / _CURVE, 2));
  return { curLevelG, userData };
}

/*
async function incrementGlobal(msg) {
  if (randomize(0, 5) === 3 && msg.content.length > 20) {
    const userData = await DB.users.getFull({ id: msg.author.id }, { _id: 1 });
    if (!userData) return null;
    await DB.users.set(msg.author.id, { $inc: { "modules.exp": 1 } });
  }
}
*/




//TODO[epic=flicky] Use these functions later on the appropriate spots
/*
function EXPtoLEVEL(LEVEL){
  let baseline = ~~CURVE[0];
  let multiplier = ~~CURVE[1];
  let accel = ~~CURVE[2];
  let drag = ~~CURVE[3];
  return ~~(baseline* Math.pow( (LEVEL-1), (0.9 + accel / 250) ) * LEVEL * (LEVEL+1)/ (6 + Math.pow(LEVEL,2) / (50 / drag) ) + (LEVEL-1) * multiplier);
}

*/

const { executeCustomResponse } = require('../commands/fun/responses.js');

function activateResponse(msg) {
  const response = msg.guild.customResponses.find(res => res.trigger === msg.content);
  if (response) {
    executeCustomResponse(response, msg);
  }
}