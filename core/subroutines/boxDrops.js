// const gear = require("../utilities/Gearbox");
// const DB = require("../database/db_ops");
// const locale = require(appRoot+'/utils/i18node');
const _EVT = require("../archetypes/Events");

function eventChecks(event) {
  if (!event) return 1;
  if (!event.enabled) return 1;
  if (!event.channel) return 1;
  if (!event.iterations) return 1;
  const I = Math.round(event.iterations);
  return I || 1;
}

const EVENT = _EVT.ongoing || false;
const EVENTBOX = _EVT.box_identification || "O";
const EVENTICON = _EVT.box_picture || "chest";

function convertToEvent(i, box) {
  box.id = box.id.replace("O", EVENTBOX);
  box.text += `\n${i.eventDrop}`;
  box.pic = `${EVENTICON}.png`;
  // box.pic  = "chest.png"
  return box;
}

module.exports = {
  lootbox: async function loot(trigger) {
    // const $t = locale.getT();

    if (PLX.restarting) return false;

    if (trigger.content === "pick" && !trigger.channel.natural) {
      return DB.users.set(trigger.author.id, { $inc: { "modules.exp": -10 } });
    }

    const regexes = [
      /^[a-zA-Z0-9]{0,3}[`¬¦!"£$€%^&*()-_=+[{\]}#~;:'@,<.>/?|]/, // Possible bot prefixes
      /([\s\S]+)\1{2,}/, // Duplicate text
      "pick", // "pick" spam
      /^([\s\S]){0,10}$/, // Extra short messages
    ];
    const msg = trigger.content.toLowerCase();

    if (regexes.some((r) => msg.match(r))) return false;

    const SVR = trigger.guild;
    const CHN = trigger.channel;

    const mC = SVR.memberCount;
    const bC = SVR.members.filter((m) => m.bot).length;

    if (mC - bC < 10) return false; // Guilds with few humans
    if (bC / mC <= 0.1) return false; // Guilds with "excessive" human to bot ratio

    // FIXME This is pooling the DB on every message
    if (!trigger.guild.switches || !trigger.guild.event) {
      const serverDATA = await DB.servers.findOne({ id: SVR.id }).lean()
        .exec();
      if (!serverDATA) return undefined;
      trigger.guild.switches = serverDATA.switches;
      trigger.guild.event = serverDATA.event || {};
      setTimeout(() => (trigger.guild.switches = false), 60e3 * 60);
    }
    if (trigger.guild.switches?.chLootboxOff?.includes(trigger.channel.id)) return undefined;

    const prerf = trigger.prefix;
    const _DROPMIN = 1;
    const _DROPMAX = 1000;
    const _RAREMAX = 250;
    const P = {
      lngs: trigger.lang,
      prefix: trigger.prefix,
    };

    const v = {
      dropLoot: $t(`loot.lootDrop.${randomize(1, 5)}`, P) + $t("loot.lootPick", P).replace(prerf, ""),
      disputing: $t("loot.contesting", P),
      oscarGoesTo: $t("loot.goesTo", P),
      gratz: $t("loot.congrats", P),
      morons: $t("loot.morons", P),
      eventDrop: $t("loot.eventDrop", P),
      suprareDrop: $t("loot.suprareDrop", P) + $t("loot.lootPick", P),
      rareDrop: $t("loot.rareDrop", P) + $t("loot.lootPick", P),
      ultraRareDrop: $t("loot.ultraRareDrop", P) + $t("loot.lootPick", P),
    };

    let droprate = 777;
    droprate = randomize(_DROPMIN, _DROPMAX);

    let BOX = { id: "lootbox_C_O", text: v.dropLoot, pic: "chest.png" };
    // console.log(droprate)

    const iterations = eventChecks(trigger.guild.event);
    for (let i = 0; i < iterations / 5; i += 1) {
      droprate = randomize(_DROPMIN, _DROPMAX);
      if (droprate === 777) break;
    }
    if (droprate !== 777 && !trigger.guild.large) {
      droprate = randomize(_DROPMIN, _DROPMAX);
    }

    if (EVENT) {
      const dropevent = randomize(1, 5);
      if (dropevent >= 2) BOX = convertToEvent(false, BOX);
    }

    const rarity = randomize(0, _RAREMAX);
    switch (true) {
      case rarity <= 8:
        BOX.id = "lootbox_UR_O";
        BOX.text = v.ultraRareDrop;
        break;
      case rarity <= 16:
        BOX.id = "lootbox_SR_O";
        BOX.text = v.suprareDrop;
        break;
      case rarity <= 32:
        BOX.id = "lootbox_R_O";
        BOX.text = v.rareDrop;
        break;
      case rarity <= 64:
        BOX.id = "lootbox_U_O";
        BOX.text = v.dropLoot;
        break;
      case rarity <= 128:
        BOX.id = "lootbox_C_O";
        BOX.text = v.dropLoot;
        break;
      default:
        BOX.id = "lootbox_C_O";
        BOX.text = v.dropLoot;
    }

    // if(trigger.channel.id=="426308107992563713") droprate= 777;
    const dropcondition = droprate === 777 || (trigger.content === "fdropt" && trigger.author.id === "88120564400553984");

    if (dropcondition) console.log(`>> DROPRATE [${droprate}] >> ${trigger.guild.name} :: #${trigger.channel.name} `.red.bgYellow);
    if (dropcondition) {
      console.log("DROPPE!!!".green);

      if (!BOX) return false;
      trigger.channel.natural = true;

      const lootMessage = await CHN.send(
        BOX.text,
        // paths.BUILD + (BOX.pic || "chest.png")
        // {file: (paths.BUILD + (BOX.pic || "chest.png")),name:"LOOTBOX.png"}
        file(await resolveFile(paths.BUILD + (BOX.pic || "chest.png")), "Lootbox.png"),
      ).catch(() => false);
      if (!lootMessage) return false;

      const ballotMessage = await CHN.send(v.disputing).catch(() => false);
      if (!ballotMessage) return CHN.send("An error has occurred at `LOOT_BALLOT.get`");

      // COLLECT PICKERS
      let pickers = [];
      let balContent = ballotMessage.content;
      const responses = await CHN.awaitMessages(async (pickMsg) => {
        if (!pickMsg.author.bot
          && !pickers.find((u) => u.id === pickMsg.author.id)
          && pickMsg.content.toLowerCase().includes("pick")) {
          if (ballotMessage) {
            const confirmBmessage = await PLX.getMessage(ballotMessage.channel?.id, ballotMessage.id);
            if (!confirmBmessage) return false;
            ballotMessage.edit(`${balContent}\n${pickMsg.author.username}`).then((newmsg) => {
              balContent = newmsg.content;
            });
          }
          pickMsg.addReaction(_emoji("loot").reaction).catch();

          pickers.push({ id: pickMsg.author.id, name: pickMsg.author.username, mention: `<@${pickMsg.author.id}>` });
        }
        // pickMsg.delete().catch(e=>null);
      }, { time: 15000 });

      console.log(pickers);

      if (pickers.length === 0) {
        CHN.send(v.morons);
        return true;
      }

      try {
        CHN.deleteMessages(responses).catch(() => false);
      } catch (e) {
        // if(responses.first()) responses.first().delete().catch(e=>false);
      }

      lootMessage.delete().catch(() => { });
      ballotMessage.delete().catch(() => { });

      const pSz = pickers.length - 1;
      let rand = randomize(0, pSz);
      rand = randomize(0, pSz);
      rand = randomize(0, pSz);
      pickers = shuffle(pickers);

      const luckyOne = pickers[rand];

      const drama = pickers.map((user) => user.name);
      const ids = pickers.map((user) => user.id);
      const dramaMessage = `\u200b\n• ${drama.join("\n• ")}`;
      // const mention = pickers.map((user) => user.mention);
      // drama[rand] = mention[rand];
      // const mention_message = `• ${drama.join("\n• ")}`;

      const goesto = await CHN.send(v.oscarGoesTo);
      const dramaMsg = await CHN.send(dramaMessage);
      console.log("WINNER PICKED!!!".green);
      await wait(4);

      // dramaMsg.edit("||"+drama[rand]+"||");
      // await wait(1);

      /*
      dropHook.send("---\nLootbox Drop at **"+trigger.guild.name+"** ("+trigger.guild.id+") - `#"
        +trigger.channel.name+"` ("+trigger.channel.id+") \n Message to trigger: ```"+trigger.content+"```" +`
Participants:
\`\`\`
${pickers.map(x=>x.name+" - "+x.id).join("\n")}
 \`\`\`
Winner:\`${JSON.stringify(luckyOne)}\
---

`)
      */
      trigger.channel.deleteMessages(responses.map((x) => x.id));
      await DB.users.getFull({ id: luckyOne.id }).then((userdata) => userdata.addItem(BOX.id));
      console.log("BOX ADDED!!!".green);
      goesto.delete().catch(() => false);
      dramaMsg.delete().catch(() => false);
      CHN.send(`||${drama[rand]}||, ${v.gratz}`);
      await Promise.all([
        DB.users.set({ id: { $in: ids } }, { $inc: { "modules.exp": 100 } }),
        DB.users.set(luckyOne.id, { $inc: { "modules.exp": 500 } }),
        DB.control.set(
          trigger.author.id,
          {
            $inc:
              { "data.boxesLost": -1, "data.boxesTriggered": 1, "data.boxesEarned": 1 },
            $push: { "data.boxTriggerMessages": `[${pickers.length} Pickers] | ${trigger.content || "[Embeded Image]"}` },
          },
        ),
        DB.control.set({ id: { $in: ids } }, { $inc: { "data.boxesLost": 1 } }),
      ]);
      trigger.channel.natural = false;
    }
    return undefined;
  },
};
