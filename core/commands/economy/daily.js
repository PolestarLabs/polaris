const DAY =  1; // 22 * 60 * 60e3;
const EXPIRE = 1000000000000000 * DAY * 2.1;

const { DailyCmd, STATUS } = require("@polestar/timed-usage");
const Premium = require("../../utilities/Premium");

const Picto = require("../../utilities/Picto.js");
const ECO = require("../../archetypes/Economy");

const _ASSETS = `${paths.CDN}/build/daily/`;

const constantAssets = [
  Picto.getCanvas(`${_ASSETS}boost.png`),
  Picto.getCanvas(`${_ASSETS}exptag.png`),
  Picto.getCanvas(`${_ASSETS}exptag-insu.png`),
  Picto.getCanvas(`${_ASSETS}streakwarn.png`),
  Picto.getCanvas(`${_ASSETS}streaklost.png`),
  Picto.getCanvas(`${_ASSETS}dono-tag.png`),
  Picto.getCanvas(`${_ASSETS}super.png`),
  Picto.getCanvas(`${_ASSETS}prev100.png`),
  Picto.getCanvas(`${_ASSETS}prev30.png`),
  Picto.getCanvas(`${_ASSETS}prev10.png`),
  Picto.getCanvas(`${_ASSETS}soft100.png`),
  Picto.getCanvas(`${_ASSETS}soft30.png`),
  Picto.getCanvas(`${_ASSETS}soft10.png`),
  Picto.getCanvas(`${_ASSETS}soft9.png`),
  Picto.getCanvas(`${_ASSETS}soft8.png`),
  Picto.getCanvas(`${_ASSETS}soft7.png`),
  Picto.getCanvas(`${_ASSETS}soft6.png`),
  Picto.getCanvas(`${_ASSETS}soft5.png`),
  Picto.getCanvas(`${_ASSETS}soft4.png`),
  Picto.getCanvas(`${_ASSETS}soft3.png`),
  Picto.getCanvas(`${_ASSETS}soft2.png`),
  Picto.getCanvas(`${_ASSETS}soft1.png`),
];

/**
 * @param {any} userData
 * @param {{[k: string]: number}} myDaily
 * @param {Promise<any>[]} actions
 */
function awardPrizes(userData, myDaily, actions) {
  const currencies = ["RBN", "JDE", "SPH", "PSM"];
  return Promise.all([...actions,
    ECO.receive(userData.id, currencies.map((curr) => myDaily[curr]), "Daily Rewards", currencies),
    DB.users.set(userData.id, {
      $inc: {
        "modules.exp": myDaily.EXP || 0,
        eventTokens: myDaily.evToken || 0,
      },
    }),
  ]);
}

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
    PLX.getRESTGuildMember("277391723322408960", msg.author.id).catch(() => null),
  ]);

  // eslint-disable-next-line max-len, @typescript-eslint/no-unused-vars
  let [boost, expTag, expTagInsu, expTagWARNING, expTagLOST, donoTag, super10, prev100, prev30, prev10, soft100, soft30, soft10, soft9, soft8, soft7, soft6, soft5, soft4, soft3, soft2, soft1] = constantAssets;

  const Daily = await new DailyCmd("daily", { day: DAY, expiration: EXPIRE, streak: true }).loadUser(msg.author);

  if (["status", "stats"].includes(msg.args[0].toLowerCase())) {
    const { userDaily, dailyAvailable, keepStreak } = Daily;
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
  : _emoji("dnd")} **${v.next}** ${moment.utc(Daily.availableAt).fromNow()}
${_emoji("expired")} ${keepStreak ? _emoji("online") : _emoji("dnd")} **${v.expirestr}** ${keepStreak
  ? ` ${moment.duration(-(Date.now() - last - (Daily.expiration || 0))).humanize({ h: 1000 })}!`
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

  if (!Daily.dailyAvailable) {
    P.remaining = moment.utc(Daily.availableAt).fromNow(true);
    return msg.channel.send(_emoji("nope") + $t("responses.daily.dailyNope", P));
  }

  const run = await Daily.process();
  if (run === null) return null;

  // =========================================================================================
  // =========================================================================================

  // Everything in success function to go here
  // const premiumTier = await Premium.getTier(msg.author);

  const dailyCard = Picto.new(800, 600);
  const ctx = dailyCard.getContext("2d");

  // let streak = Number(args[0]||1)
  const { streak } = Daily.userDaily;

  const myDaily = {
    RBN: 0,
    JDE: 0,
    SPH: 0,

    PSM: 0,
    comToken: 0,
    cosmo_fragment: 0,

    boosterpack: 0,
    EXP: Math.max(~~(streak / 2), 10),

    stickers: 0,
    evToken: 0,

    lootbox_C: 0,
    lootbox_U: 0,
    lootbox_R: 0,
    lootbox_SR: 0,
    lootbox_UR: 0,
  };

  const softStreak = streak % 10 || 10;
  const is = (x) => !(streak % x);
  const isRoadTo30 = (streak % 30) > 20;
  const isRoadTo50 = (streak % 50) > 40;
  const isRoadTo100 = (streak % 100) > 90;

  const softBoilerplate = eval(`soft${softStreak}`);
  ctx.drawImage(await softBoilerplate, 0, 0);

  if (isRoadTo50 && !is(50)) ctx.drawImage(await prev30, 0, 0);
  if (isRoadTo100 && !is(100)) ctx.drawImage(await prev100, 0, 0);

  if (softStreak === 1) myDaily.RBN += 150;
  if (softStreak === 2) myDaily.RBN += 150;
  if (softStreak === 3) myDaily.JDE += 1000;
  if (softStreak === 4) myDaily.cosmo_fragment += 25;
  if (softStreak === 5) myDaily.JDE += 1500;
  if (softStreak === 6) myDaily.lootbox_C += 1;
  if (softStreak === 7) myDaily.RBN += 350;
  if (softStreak === 8) myDaily.cosmo_fragment += 25;
  if (softStreak === 9) myDaily.comToken += 5;
  if (is(10)) {
    myDaily.RBN += 500;
    myDaily.JDE += 2500;
    myDaily.cosmo_fragment += 35;
    myDaily.boosterpack += 1;
    myDaily.EXP += 10;
    if (!is(50) && !is(100) && !is(30)) myDaily.lootbox_U += 1;
  }
  if (is(30)) {
    myDaily.EXP += 10;
    // ctx.clearRect(0, 0, 800, 600);
    // ctx.drawImage(soft30,0,0);
    myDaily.lootbox_R += 1;
  }
  if (is(50)) {
    myDaily.EXP += 10;
    myDaily.SPH += 1;
    ctx.clearRect(0, 0, 800, 600);
    ctx.drawImage(await soft30, 0, 0);
    if (!is(100)) myDaily.lootbox_SR += 1;
  }
  if (is(100)) {
    myDaily.EXP += 25;
    myDaily.SPH += 5;
    ctx.clearRect(0, 0, 800, 600);
    ctx.drawImage(await soft100, 0, 0);
    myDaily.lootbox_UR += 1;
  }
  if (is(1000)) {
    myDaily.EXP += 250;
    myDaily.SPH += 10;
  }
  if (dailyPLXMember?.premiumSince) {
    myDaily.PSM = Math.min(~~((Date.now() - new Date(dailyPLXMember.premiumSince).getTime()) / (24 * 60 * 60e3) / 10), 150);
    ctx.drawImage(await boost, 0 - 50, 0);
  }
  if (userData.donator) {
    const donoBoost = Premium.DAILY[userData.donator] || 0;
    let donoEmblem = Picto.getCanvas(`${paths.CDN}/images/donate/icony/${userData.donator}-small.png`);
    myDaily.RBN += donoBoost;
    const numberDONOBOOST = Picto.tag(ctx, `+ ${donoBoost}`, "italic 900 38px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
    const textDONOBOOST = Picto.tag(ctx, (userData.donator?.toUpperCase() || "UNKNOWN"), "italic 900 15px 'Panton Black'", "#FFF");

    [donoTag, donoEmblem] = await Promise.all([donoTag, donoEmblem]);

    ctx.drawImage(donoTag, 0, 0);
    ctx.drawImage(numberDONOBOOST.item, 683 - numberDONOBOOST.width, 11);
    ctx.drawImage(textDONOBOOST.item, 668 - textDONOBOOST.width, 53);
    ctx.drawImage(donoEmblem, 698, 14, 52, 52);
  }

  ctx.save();
  ctx.rotate(0.04490658503988659);
  Picto.popOutTxt(ctx, "Daily Rewards", 60, 40, "italic 900 45px 'Panton Black'", "#FFF", 300, { style: "#1b1b25", line: 12 });
  ctx.restore();

  const textStreak = Picto.tag(ctx, "STREAK ", "italic 900 14px 'Panton Black'", "#FFF"); // ,{line: 6, style: "#223"} )
  const textEXP = Picto.tag(ctx, "EXP", "italic 900 18px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
  const numberStreak = Picto.tag(ctx, streak, "italic 900 32px 'Panton Black'", "#FFF"); // ,{line: 6, style: "#223"} )
  const numberStreakPrize = Picto.tag(ctx, myDaily.EXP, "italic 900 38px 'Panton Black'", "#FFF", { line: 6, style: "#223" });
  const numberBoostPrize = Picto.tag(ctx, `+${miliarize(myDaily.PSM)}`, "italic 900 35px 'Panton Black'", "#FFF", { line: 6, style: "#223" });

  /// //////////////////////////////////////////////

  if (myDaily.PSM) ctx.drawImage(numberBoostPrize.item, 660 - 35, 540);

  if (Daily.userDaily.insured) ctx.drawImage(await expTagInsu, 0, 0);
  else if (run === STATUS.recovered) {
    ctx.drawImage(await expTagWARNING, 0, 0);
    Picto.popOutTxt(ctx,
      $t("Streak insurance activated!", P),
      360, 540,
      "italic 900 35px 'Panton Black'", "#FFF", 400,
      { line: 8, style: "#223" });
  } else if (run === STATUS.lost) {
    ctx.drawImage(await expTagLOST, 0, 0);
    Picto.popOutTxt(ctx,
      $t("Streak Lost!", P),
      22, 506,
      "italic 900 42px 'Panton Black'", "#FFF", 400,
      { line: 8, style: "#F23" });
  } else ctx.drawImage(await expTag, 0, 0);

  if (run !== STATUS.lost) {
    ctx.rotate(-0.03490658503988659);
    ctx.drawImage(numberStreak.item, 258 - numberStreak.width / 2, 526);
    ctx.drawImage(textStreak.item, 221, 557);
    ctx.drawImage(numberStreakPrize.item, 160 - numberStreakPrize.width, 530);
    ctx.drawImage(textEXP.item, 200 - textEXP.width, 537);
    ctx.rotate(0.03490658503988659);
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
  for (const i in myDaily) {
    if (!Object.prototype.hasOwnProperty.call(myDaily, i)) continue;
    !myDaily[i] ? delete myDaily[i] : null;
  }
  const items = Object.keys(myDaily).map((itm, i) => {
    const index = (i) % 2;

    P.count = myDaily[itm];
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
        await userData.addItem(BOOSTERS[0], myDaily[itm]);
      };
      boosterAction = newBooster();
    }

    if (itm === "cosmo_fragment") {
      itemName = $t("items:cosmo_fragment.name", P);
      console.log({ myDaily });
      fragAction = userData.addItem("cosmo_fragment", myDaily[itm]);
      itemoji = _emoji("COS");
    }

    if (itm === "item") {
      itemAction = userData.addItem(x); // for later
    }

    if (itm === "comToken") {
      tokenAction = userData.addItem("commendtoken", myDaily[itm]);
      itemName = $t("items:commendtoken.name", P);
    }

    if (P.count) fields[index].value += (`${itemoji} **${P.count}** ${itemName}\n`);
    // if(P.count) items.push( `${_emoji(itm)} **${P.count}** ${$t("keywords."+itm,P)}` );
  });

  let sq = -10;
  let bar = "";
  while (sq++) {
    if (10 + sq > softStreak) bar += "⬛";
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

        /*

        */
  /** @type {string} */
  let postmortem;
  if (run === STATUS.first) {
    P.insuCount = userData.modules.inventory.find((i) => i.id === "keepstreak")?.count || 0;
    postmortem = $t("responses.daily.firstDaily", P);
  }
  if (run === STATUS.recovered) {
    P.insuCount = userData.modules.inventory.find((i) => i.id === "keepstreak")?.count || 0;
    postmortem = $t("responses.daily.insuranceConsumed", P);
  }
  if (run === STATUS.lost) {
    P.oldStreak = Daily.userDaily.lastStreak;
    const streakfixes = userData.modules.inventory.find((i) => i.id === "streakfix")?.count || 0;
    postmortem = `${$t("responses.daily.streakLost", P)}\n`
      + `${streakfixes ? $t("responses.daily.yesRestorerInfo", P) : $t("responses.daily.noRestorerInfo", P)}`;
  }

  if (run === STATUS.pass && randomize(0, 5) === 3) {
    fields.push({
      name: "Want to boost your dailies further?",
      value: `Check out the full extra rewards set [**HERE**](${paths.DASH})`,
      inline: false,
    });
  }

  const actions = [lootAction, boosterAction, itemAction, fragAction, tokenAction];
  await awardPrizes(userData, myDaily, actions);
  P.username = msg.author.username;

  return msg.channel.send({
    embed: {
      description: `
☕ ${rand$t("responses.daily.dailyBonus", P)}
      `,
      fields,
      timestamp: new Date(),
      footer: { icon_url: msg.author.avatarURL, text: `${msg.author.tag}\u2002•  ${bar}` },
      color: 0x03dffc,
      image: { url: "attachment://daily.png" },
    },
  }, { file: dailyCard.toBuffer("image/png"), name: "daily.png" }).then((x) => {
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
