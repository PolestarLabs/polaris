//TODO[epic=Constants Module] Replace
const DAY = 22 * 60 * 60e3;
const EXPIRE = 1 * DAY * 2.5;

const { TimedUsage, Daily } = require("@polestar/timed-usage");

const Picto = require("../../utilities/Picto.js");
const ECO = require("../../archetypes/Economy");
const Premium = require("../../archetypes/Premium");

const _ASSETS = `${paths.CDN}/build/daily/`;

const constantAssets = {
  boost: Picto.getCanvas(`${_ASSETS}boost.png`),
  expTag: Picto.getCanvas(`${_ASSETS}exptag.png`),
  expTagInsu: Picto.getCanvas(`${_ASSETS}exptag-insu.png`),
  expTagWARNING: Picto.getCanvas(`${_ASSETS}streakwarn.png`),
  expTagLOST: Picto.getCanvas(`${_ASSETS}streaklost.png`),
  donoT: Picto.getCanvas(`${_ASSETS}dono-tag.png`),
  super10: Picto.getCanvas(`${_ASSETS}super.png`),
  prev100: Picto.getCanvas(`${_ASSETS}prev100.png`),
  prev30: Picto.getCanvas(`${_ASSETS}prev30.png`),
  prev10: Picto.getCanvas(`${_ASSETS}prev10.png`),
  soft100: Picto.getCanvas(`${_ASSETS}soft100.png`),
  soft30: Picto.getCanvas(`${_ASSETS}soft30.png`),
  soft10: Picto.getCanvas(`${_ASSETS}soft10.png`),
  soft9: Picto.getCanvas(`${_ASSETS}soft9.png`),
  soft8: Picto.getCanvas(`${_ASSETS}soft8.png`),
  soft7: Picto.getCanvas(`${_ASSETS}soft7.png`),
  soft6: Picto.getCanvas(`${_ASSETS}soft6.png`),
  soft5: Picto.getCanvas(`${_ASSETS}soft5.png`),
  soft4: Picto.getCanvas(`${_ASSETS}soft4.png`),
  soft3: Picto.getCanvas(`${_ASSETS}soft3.png`),
  soft2: Picto.getCanvas(`${_ASSETS}soft2.png`),
  soft1: Picto.getCanvas(`${_ASSETS}soft1.png`),
};

/**
 * @param {import("eris").Message} msg
 */
const init = async (msg) => {
  const moment = require("moment");
  moment.locale(msg.lang[0] || "en");

  /** @type {import("i18next").TranslationOptions} */
  const P = { lngs: msg.lang, prefix: msg.prefix };
  const v = {
    last: $t("interface.daily.lastdly", P),
    next: $t("interface.daily.next", P),
    streakcurr: $t("interface.daily.streakcurr", P),
    expirestr: $t("interface.daily.expirestr", P),
  };

  if (msg.args[0] === "info") {
    msg.args[0] = "status";
    msg.channel.send("*`INFO` is deprecated, please use `STATUS` to check remaining time*");
  }

  const [userData, dailyPLXMember] = await Promise.all([
    DB.users.getFull(msg.author.id),
    PLX.resolveMember(Premium.OFFICIAL_GUILD, msg.author.id).catch(() => null),
  ]);


  // eslint-disable-next-line max-len, @typescript-eslint/no-unused-vars
  const daily = await Daily.load(dailyPLXMember);
  const timedUsage = daily.timedUsage;

  if (["status", "stats"].includes(msg.args[0]?.toLowerCase())) {
    const { userDaily, dailyAvailable, keepStreak } = timedUsage;
    const { streak, insured, last } = userDaily;

    const powerups = [];
    if (dailyPLXMember?.premiumSince) powerups.push(_emoji("PSM"));
    if (userData.donator) powerups.push(_emoji(userData.donator));

    const embed = {
      color: 0xE34555,
      title: "Daily Status",
      description: `
${_emoji("time")} ${_emoji("offline")} **${v.last}** ${moment.utc(last).fromNow()}
${_emoji("future")} ${dailyAvailable
          ? _emoji("online")
          : _emoji("dnd")} **${v.next}** ${moment.utc(timedUsage.availableAt).fromNow()}
${_emoji("expired")} ${keepStreak ? _emoji("online") : _emoji("dnd")} **${v.expirestr}** ${keepStreak
          ? ` ${moment.duration(-(Date.now() - last - (timedUsage.expiration || 0))).humanize({ h: 1000 })}!`
          : "I have bad news for you..."}
${_emoji("expense")} ${_emoji("offline")} **${v.streakcurr}** \`${streak}x\`
`,
      fields: [
        {
          name: "Powerups",
          value: powerups.join(" • ") || "None",
          inline: !0,
        },
        {
          name: "Insurance",
          value: insured ? _emoji("yep") : _emoji("nope"),
          inline: !0,
        },
      ],
      footer: { icon_url: msg.author.avatarURL, text: `${msg.author.tag}\u2002` },
    };

    // @ts-ignore
    return msg.channel.send({ embed });
  }

  if (!timedUsage.available && msg.author.id !== "88120564400553984") {
    P.remaining = moment.utc(timedUsage.availableAt).fromNow(true);
    return msg.channel.send(_emoji("nope") + $t("responses.daily.dailyNope", P));
  }

  // @ts-ignore
  const processQueue = [];
  // const premiumTier = await Premium.getTier(msg.author);
  const dailyCard = Picto.new(800, 600);
  const ctx = dailyCard.getContext("2d");

  daily
    .once("softStreak", (softStreak) => {
      processQueue.push(async () => ctx.drawImage(await constantAssets[`soft${softStreak}`], 0, 0));
    })
    .once("isRoadTo50-isNot50", () => {
      processQueue.push(async () => ctx.drawImage(await constantAssets.prev30, 0, 0));
    })
    .once("isRoadTo100-isNot100", () => {
      processQueue.push(async () => ctx.drawImage(await constantAssets.prev100, 0, 0));
    })
    .once("is30", () => {
      processQueue.push(async () => {
        ctx.clearRect(0, 0, 800, 600);
        ctx.drawImage(await constantAssets.soft30, 0, 0);
      });
    })
    .once("is50", () => {
      processQueue.push(async () => {
        ctx.clearRect(0, 0, 800, 600);
        ctx.drawImage(await constantAssets.soft30, 0, 0);
      });
    })
    .once("is100", () => {
      processQueue.push(async () => {
        ctx.clearRect(0, 0, 800, 600);
        ctx.drawImage(await constantAssets.soft100, 0, 0);
      });
    })
    .once("guildBooster", () => {
      msg.channel.createMessage("[DEBUG] Booster detected");
      processQueue.push(async () => ctx.drawImage(await constantAssets.boost, 0 - 50, 0));
    })
    .once("userDonator", (donoBoost) => {
      processQueue.push(async () => {
        const donoE = Picto.getCanvas(`${paths.CDN}/images/donate/icony/${userData.donator}-small.png`);
        const numberDONOBOOST = Picto.tag(ctx, `+ ${donoBoost}`, "italic 900 38px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
        const textDONOBOOST = Picto.tag(ctx, (userData.donator?.toUpperCase() || "UNKNOWN"), "italic 900 15px 'Panton Black'", "#FFF");

        const [donoTag, donoEmblem] = await Promise.all([constantAssets.donoT, donoE]);

        ctx.drawImage(donoTag, 0, 0);
        ctx.drawImage(numberDONOBOOST.item, 683 - numberDONOBOOST.width, 11);
        ctx.drawImage(textDONOBOOST.item, 668 - textDONOBOOST.width, 53);
        ctx.drawImage(donoEmblem, 698, 14, 52, 52);
      });
    })
    .once("calculationComplete", async (myDaily) => {
      processQueue.push(async () => {
        ctx.save();
        ctx.rotate(0.04490658503988659);
        Picto.popOutTxt(ctx, "Daily Rewards", 60, 40, "italic 900 45px 'Panton Black'", "#FFF", 300, { style: "#1b1b25", line: 12 });
        ctx.restore();

        const textStreak = Picto.tag(ctx, "STREAK ", "italic 900 14px 'Panton Black'", "#FFF"); // ,{line: 6, style: "#223"} )
        const textEXP = Picto.tag(ctx, "EXP", "italic 900 18px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
        const numberStreak = Picto.tag(ctx, timedUsage.userDaily.streak, "italic 900 32px 'Panton Black'", "#FFF"); // ,{line: 6, style: "#223"} )
        const numberStreakPrize = Picto.tag(ctx, myDaily.EXP, "italic 900 38px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
        const numberBoostPrize = Picto.tag(ctx, `+${miliarize(myDaily.PSM)}`, "italic 900 35px 'Panton Black'", "#FFF", { line: 6, style: "#223" });

        /// //////////////////////////////////////////////

        if (myDaily.PSM) {
          msg.channel.createMessage("[DEBUG] Prisms collected");
          ctx.drawImage(numberBoostPrize.item, 660 - 35, 540);
        }

        if (timedUsage.userDaily.insured) ctx.drawImage(await constantAssets.expTagInsu, 0, 0);
        else if (timedUsage.streakStatus === "recovered") {
          ctx.drawImage(await constantAssets.expTagWARNING, 0, 0);
          Picto.popOutTxt(ctx,
            $t("Streak insurance activated!", P),
            360, 540,
            "italic 900 35px 'Panton Black'", "#FFF", 400,
            { line: 8, style: "#223" });
        } else if (timedUsage.streakStatus === "lost") {
          ctx.drawImage(await constantAssets.expTagLOST, 0, 0);
          Picto.popOutTxt(ctx,
            $t("Streak Lost!", P),
            22, 506,
            "italic 900 42px 'Panton Black'", "#FFF", 400,
            { line: 8, style: "#F23" });
        } else ctx.drawImage(await constantAssets.expTag, 0, 0);

        if (timedUsage.streakStatus !== "lost") {
          ctx.rotate(-0.03490658503988659);
          ctx.drawImage(numberStreak.item, 258 - numberStreak.width / 2, 526);
          ctx.drawImage(textStreak.item, 221, 557);
          ctx.drawImage(numberStreakPrize.item, 160 - numberStreakPrize.width, 530);
          ctx.drawImage(textEXP.item, 200 - textEXP.width, 537);
          ctx.rotate(0.03490658503988659);
        }
      });
    });

  await daily.init();
  //await Promise.all(processQueue);
  while (processQueue.length) {
    // @ts-ignore

    await processQueue.shift()(); // eslint-disable-line no-await-in-loop

  }

  let lootAction = null;
  let boosterAction = null;
  let itemAction = null;
  let fragAction = null;
  let tokenAction = null;

  const fields = [
    { name: "\u200b", value: "\u200b", inline: true },
    { name: "\u200b", value: "\u200b", inline: true },
    { name: "\u200b", value: "\u200b", inline: true },
  ];

  // @ts-ignore
  for (const i in daily.myDaily) {
    if (!Object.prototype.hasOwnProperty.call(daily.myDaily, i)) continue;
    // @ts-ignore
    if (!daily.myDaily[i]) delete daily.myDaily[i];
  }

  const items = (Object.keys(daily.myDaily)).map((itm, i) => {
    const index = (i) % 2;
    // @ts-ignore
    P.count = daily.myDaily[itm];
    let itemName = $t(`keywords.${itm}`, P);
    let itemoji = _emoji(itm);

    if (itm.startsWith("lootbox_")) {
      const tier = itm.substr(8);
      lootAction = userData.addItem(`lootbox_${tier}_D`);
      itemName = $t(`items:lootbox_${tier}_D.name`, P);
    }
    if (itm === "boosterpack") {
      const newBooster = async () => {
        const BOOSTERS = await DB.items.find({ type: "booster", rarity: { $in: ["C", "U", "R"] } });
        shuffle(BOOSTERS);
        await userData.addItem(BOOSTERS[0], daily.myDaily[itm]);
      };
      boosterAction = newBooster();
    }

    if (itm === "cosmo_fragment") {
      itemName = $t("items:cosmo_fragment.name", P);
      fragAction = userData.addItem("cosmo_fragment", daily.myDaily[itm]);
      itemoji = _emoji("COS");
    }

    // @ts-ignore TODO ask flicky about this
    if (itm === "item") { itemAction = userData.addItem(x); } // for later

    if (itm === "comToken") {
      tokenAction = userData.addItem("commendtoken", daily.myDaily[itm]);
      itemName = $t("items:commendtoken.name", P);
    }

    if (P.count) fields[index].value += (`${itemoji} **${P.count}** ${itemName}\n`);
    // if(P.count) items.push( `${_emoji(itm)} **${P.count}** ${$t("keywords."+itm,P)}` );
  });

  let sq = -10;
  let bar = "";
  while (sq++) {
    if (10 + sq > daily.softStreak) bar += "⬛";
    else bar += "🟦";
  }
  /*

        if(DAILY.streakStatus === 'lost' && DAILY.userDaily.lastStreak > 1){
          fields.push({
            name: "\u200b",
            value: "⚠ **Streak Lost**",
            inline: false
          })
        }

     */
  /** @type {string} */
  let postmortem;
  if (timedUsage.streakStatus === "first") {
    P.insuCount = userData.modules?.inventory?.find((i) => i.id === "keepstreak")?.count || 0;
    postmortem = $t("responses.daily.firstDaily", P);
  }
  if (timedUsage.streakStatus === "recovered") {
    P.insuCount = userData.modules?.inventory?.find((i) => i.id === "keepstreak")?.count || 0;
    postmortem = $t("responses.daily.insuranceConsumed", P);
  }
  if (timedUsage.streakStatus === "lost") {
    if (timedUsage.userDaily.lastStreak <= 1) {
      P.insuCount = userData.modules?.inventory?.find((i) => i.id === "keepstreak")?.count || 0;
      postmortem = $t("responses.daily.firstDaily", P);
      postmortem += `
      
      **NOTE:**
      Pollux is going through a major update at this time and if it appears your streak was lost, don't worry.
      You can port everything back from your old account with \`plx!migrate\`. Note that this migration is permanent and once done you can't use the old version anymore. 
      Any questions you can ask our support team, link is in \`plx!help\`
      `


    } else {

      P.oldStreak = timedUsage.userDaily.lastStreak;
      const streakfixes = userData.modules?.inventory?.find((i) => i.id === "streakfix")?.count || 0;
      postmortem = `${$t("responses.daily.streakLost", P)
        }${streakfixes ? $t("responses.daily.yesRestorerInfo", P) : $t("responses.daily.noRestorerInfo", P)}`;
    }
  }

  // @ts-ignore TODO[epic=flicky] Random self-ad for daily perks.
  if (timedUsage.streakStatus?.pass && randomize(0, 5) === 3) {
    fields.push({
      name: "Want to boost your dailies further?",
      value: `Check out the full extra rewards set [**HERE**](${paths.DASH})`,
      inline: false,
    });
  }

  const actions = [lootAction, boosterAction, itemAction, fragAction, tokenAction];
  // @ts-ignore
  await daily.awardPrizes(ECO, actions);
  await wait(1);
  P.username = msg.author.username;
  await msg.channel.send({
    embed: {
      description: `☕ ${rand$t("responses.daily.dailyBonus", P)}`,
      fields,
      timestamp: new Date(),
      footer: { icon_url: msg.author.avatarURL, text: `${msg.author.tag}\u2002•  ${bar}` },
      color: 0x03dffc,
      image: { url: "attachment://daily.png" },
    },
  }, { file: await dailyCard.toBuffer("image/png"), name: "daily.png" }).then(() => {
    if (postmortem) {
      msg.channel.send(postmortem);
    }
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "daily",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["dly"],
};
