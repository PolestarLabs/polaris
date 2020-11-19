const Drops = require("./boxDrops").lootbox;

async function incrementLocal(msg) {
  DB.localranks.get({ user: msg.author.id, server: msg.guild.id }).then(async (data) => {
    if (!data) await DB.localranks.new({ U: msg.author, S: msg.guild });
    await DB.localranks.incrementExp({ U: msg.author.id, S: msg.guild.id });
  });
}

async function levelChecks(msg) {
  if (msg.author.bot) return;

  if (msg.guild.id === "110373943822540800") return;

  let userData = DB.users.getFull({ id: msg.author.id });
  let servData = DB.servers.get(msg.guild.id);

  await Promise.all([
    userData = (await userData),
    servData = (await servData),
  ]);

  if (!servData) return;

  if (servData.switches?.chLvlUpOff?.includes(msg.channel.id) || !userData) {
    userData = null;
    servData = null;
    return;
  }

  const _FACTOR = servData.modules.UPFACTOR || 0.5;
  const _CURVE = 0.0427899;

  const LOCAL_RANK = (await DB.localranks.get({ user: msg.author.id, server: msg.guild.id }))
                    || {
                      user: msg.author.id, server: msg.guild.id, exp: 0, level: 0,
                    };

  const curLevelG = Math.floor(_CURVE * Math.sqrt(userData.modules.exp));
  // let forNext_G = Math.trunc(Math.pow((userData.modules.level + 1) / _CURVE, 2));
  const curLevelLocal = Math.floor(_FACTOR * Math.sqrt(LOCAL_RANK.exp));
  // let forNext_local = Math.trunc(Math.pow(((LOCAL_RANK.level||0) + 1) / _FACTOR, 2));

  if (!servData.switches?.chExpOff?.includes(msg.channel.id)) {
    incrementLocal(msg);
    // incrementGlobal(msg);
  }

  if (global.piggyback) return;

  /// =======  [LOCAL LVUP] ========///
  if (curLevelLocal < LOCAL_RANK.level) {
    // console.log("DELEVEL");
    await DB.localranks.set({ server: msg.guild.id, user: msg.author.id }, { $set: LOCAL_RANK });
  }

  if (curLevelLocal > LOCAL_RANK.level) {
    await DB.localranks.set({ user: msg.author.id, server: msg.guild.id }, { $set: { level: curLevelLocal } });

    if (
      servData.modules.LVUP_local
        && !servData.switches?.chLvlUpOff?.includes(msg.channel.id)
    ) {
      const embed = {
        color: 0x6699FF,
        description: `:tada: **Level Up!** >> ${curLevelLocal}`,
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
    /// ======= [GLOBAL LVUP] ========///
    if (curLevelG < userData.modules.level) {
      return;
      // console.log("DELEVEL");
      // await userDB.set(message.author.id,{$set:{'modules.level':curLevel}});
    }
    if (curLevelG > userData.modules.level) {
      await DB.userDB.set(msg.author.id, { $set: { "modules.level": curLevelG } });
      console.log("[GLOBAL LEVEL UP]".blue, (msg.author.tag).orange, msg.author.id);

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
      msg.author.getDMChannel().then((dmChan) => {
        if (!userData.switches || userData.switches?.LVUPDMoptout === true) return;
        dmChan.createMessage(`**+1** x ${_emoji("loot")}${_emoji(polizei)} Level Up Bonus!`);
      });
      // require("./modules/dev/levelUp_infra.js").init(msg);
    }
    // -------------------------------//
  }

  userData = null;
  servData = null;
}

module.exports = async (msg) => {
  if (!msg.guild) return;
  if (msg.channel.type === 1) return;

  if (msg.guild.imagetracker && !msg.channel.nsfw) {
    const hasImageURL = msg.content.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g);
    if (msg.attachments?.[0] || hasImageURL) {
      /*Do Stuff when there is image*/
    }
  }

  PLX.execQueue = PLX.execQueue.filter((itm) => itm.constructor !== Promise);
  PLX.execQueue.push(
    Promise.all([
      levelChecks(msg),
      Drops(msg),
    ]).timeout(15000).catch(() => null),
  );
};

/*
async function incrementGlobal(msg) {
  if (randomize(0, 5) === 3 && msg.content.length > 20) {
    const userData = await DB.users.getFull({ id: msg.author.id }, { _id: 1 });
    if (!userData) return null;
    await DB.users.set(msg.author.id, { $inc: { "modules.exp": 1 } });
  }
}
*/
