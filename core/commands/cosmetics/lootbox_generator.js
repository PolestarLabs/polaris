// TRANSLATE[epic=translations] lootbox

const Canvas = require("canvas");
const Lootbox = require("../../archetypes/Lootbox.js");
const Picto = require("../../utilities/Picto.js");
const ECO = require("../../archetypes/Economy");

const LootingUsers = new Map();
const VisualsCache = new Map();

const CARD_WIDTH = 270;
const BASELINE_REROLLS = 3;
const REROLL_MSG = (P) => ({ embed: { description: $t("loot.rerolled", P) } });
const FIRSTROLL_MSG = (P) => ({ embed: { description: $t("loot.opening", P) } });
const rates = GNums.LootRates;

const staticAssets = {};
staticAssets.load = Promise.all([
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_C.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_U.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_R.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_SR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_UR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/frame_XR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/dupe-tag.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bgC.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bgU.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bgR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bgSR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bgUR.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/sparkles_0.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/sparkles_1.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/sparkles_2.png`),
  Picto.getCanvas(`${paths.CDN}/build/LOOT/bonusbar.png`),
]).then((res) => {
  const [
    frame_C, frame_U, frame_R, frame_SR, frame_UR, frame_XR, dupe_tag,
    bgC, bgU, bgR, bgSR, bgUR,
    sparkles_0, sparkles_1, sparkles_2, bonusbar,
  ] = res;
  Object.assign(staticAssets, {
    frame_C,
    frame_U,
    frame_R,
    frame_SR,
    frame_UR,
    frame_XR,
    dupe_tag,
    bgC,
    bgU,
    bgR,
    bgSR,
    bgUR,
    sparkles_0,
    sparkles_1,
    sparkles_2,
    bonusbar,
    loaded: true,
  });
  delete staticAssets.load;
});

const init = async (msg, args) => {
  if(!args.boxID && msg.author.id !="88120564400553984" && args[0] > 5) return;
  if (!staticAssets.loaded) await staticAssets.load;
  if (VisualsCache.size > 800) VisualsCache.clear();

  const USERDATA = await DB.users.getFull({ id: msg.author.id });

  if (LootingUsers.get(msg.author.id)) {
    await DB.users.set(msg.author.id, { $inc: { "counters.cross_server_box_attempts": 1 } });
    return {
      embed: {
        description: `**You are already Looting in another server.** 
                Bear in mind that exploiting loopholes can get you banned from using my services!
                \`- This incident will be reported to the moderators -\``,
        color: 0xFF9060,
      },
    };
  }
  LootingUsers.set(msg.author.id, msg.guild.id);

  const P = { lngs: msg.lang, cosmos: 0, user: msg.author.username };

  const boxparams = await DB.items.findOne({ id: args?.boxID || "lootbox_C_O" });
  boxparams.size = ~~args[0];

  let currentRoll = 0;

  async function process() {
    const lootbox = new Lootbox(boxparams.rarity, boxparams);
    await lootbox.compileVisuals;

    let preRoll;
    if (currentRoll === 0) preRoll = msg.channel.send(FIRSTROLL_MSG(P));
    else preRoll = msg.channel.send(REROLL_MSG(P));

    const rerollCost = determineRerollCost(lootbox, currentRoll, USERDATA);
    const totalRerolls = BASELINE_REROLLS + (USERDATA.modules.powerups?.rerollBonus || 0);
    const canAffordReroll = await ECO.checkFunds(USERDATA, rerollCost);

    const canReroll = canAffordReroll && totalRerolls - currentRoll > 0;

    const firstRoll = await compileBox(msg, lootbox, USERDATA, {
      P, currentRoll, totalRerolls, rerollCost, canAffordReroll, canReroll,
    });

    await preRoll.then((pR) => pR.deleteAfter(1500).catch((e) => null));
    const message = await msg.channel.send(...firstRoll);

    message.addReaction("⭐").catch((e) => null);
    if (canReroll) message.addReaction("🔁").catch((e) => null);

    return message.awaitReactions((reaction) => {
      if (reaction.author.id !== msg.author.id) return false;
      if (reaction.emoji.name === "🔁") {
        return canReroll;
      } if (reaction.emoji.name === "⭐") return true;
    }, { time: 15000, maxMatches: 1 }).catch((e) => {
      console.error(e);
      message.removeReaction("🔁");
    }).then(async (reas) => {
      const choice = reas?.[0];

      if (choice?.emoji.name === "🔁") {
        message.delete();
        currentRoll++;
        return process();
      }

      message.removeReactions().catch((e) => null);
      await Promise.all([
        USERDATA.removeItem(lootbox.id),
        USERDATA.addItem("cosmo_fragment", P.cosmos),
        ECO.pay(USERDATA, determineRerollCost(lootbox, currentRoll - 1, USERDATA), "lootbox_reroll"),
        DB.users.set(USERDATA.id, lootbox.bonus.query),
        Promise.all(lootbox.content.map((item) => getPrize(item, USERDATA))),
      ]);
      LootingUsers.delete(msg.author.id);

      firstRoll[0].embed.description = `
**${$t("loot.allItemsAdded", P)}**
>>> ${lootbox.content.map((x) => {
    let label = x.name
      ? `${x.emoji || _emoji(x.type, _emoji(getEmoji(x)))} **${$t(`keywords.${x.type}`)}:** ${x.name}`
      : `${_emoji(x.currency)} **${$t(`keywords.${x.currency}`, P)}:** x${x.amount}`;
    if (x.isDupe) label = `~~${label}~~\n${_emoji("__") + _emoji("__")}***${$t("keywords.cosmoFragment_plural", P)}** x${rates.gems[x.rarity]}*`;
    return label;
  }).join("\n")}
                `;
      message.edit(firstRoll[0]);
    });
  }

  return process();
};

function renderCard(item, visual, P) {
  const canvas = Picto.new(CARD_WIDTH, 567);
  const ctx = canvas.getContext("2d");

  const itemVisual = VisualsCache.get(visual);
  const backFrame = staticAssets[`frame_${item.rarity}`];

  ctx.drawImage(backFrame, CARD_WIDTH / 2 - backFrame.width / 2, 0);

  ctx.globalCompositeOperation = "overlay";
  ctx.rotate(-1.5708);
  P.count = item.type === "gems" ? 2 : 1;
  const itemTypePrint = (item.type !== "gems" ? $t(`keywords.${item.type}`, P) : $t(`keywords.${item.currency}`, P)).toUpperCase();
  Picto.setAndDraw(ctx,
    Picto.tag(ctx, itemTypePrint, "600 50px 'AvenirNextRoundedW01-Bold'", "#FFF"),
    -468, (CARD_WIDTH - backFrame.width) / 2 + 10, 460);
  ctx.rotate(1.5708);
  ctx.globalCompositeOperation = "source-over";

  ctx.shadowColor = "#2248";
  ctx.shadowOffsetY = 5;
  ctx.shadowBlur = 10;

  if (item.type === "background") {
    const ox = -25;
    const oy = 125;
    const odx = 240;
    const ody = 135;

    const offset = 10;

    ctx.rotate(-0.2);
    ctx.translate(0, 10);
    Picto.roundRect(ctx, ox, oy, 240, 135, 15, "#FFF", "#1b1b2b", 5);
    ctx.shadowColor = "transparent";
    Picto.roundRect(ctx, ox + offset, oy + offset, odx - (offset * 2), ody - (offset * 2), offset / 2, itemVisual);
    ctx.shadowColor = "#2248";
    ctx.translate(0, -10);
    ctx.rotate(0.2);
  } else if (item.type === "medal") {
    const itemW = 150;
    ctx.drawImage(itemVisual, CARD_WIDTH / 2 - itemW / 2, 190 - itemW / 2, itemW, itemW);
  } else if (item.type === "boosterpack") {
    const itemW = 210;
    ctx.translate((CARD_WIDTH / 2 - itemW / 2 + 30), (190 - 300 / 2));
    ctx.rotate(0.17);
    ctx.drawImage(itemVisual, 0, 0, itemW, 300);
    ctx.rotate(-0.17);
    ctx.translate(-(CARD_WIDTH / 2 - itemW / 2 + 30), -(190 - 300 / 2));
  } else {
    const itemW = 200;
    try {
      ctx.drawImage(itemVisual, CARD_WIDTH / 2 - itemW / 2, 190 - itemW / 2, itemW, itemW);
    } catch (err) {
      console.error("===========================");
      console.error(err);
      console.error(item);
      console.error("===========================");
    }
  }

  ctx.shadowBlur = 5;

  const itemTitle = (item.name || `${item.amount}`).toUpperCase();
  const itemFont = "900 italic 50px 'Panton Black'";
  const itemOptions = {
    textAlign: "center",
    verticalAlign: "middle",
    lineHeight: 1.1,
    sizeToFill: true,
    maxFontSizeToFill: 80,
    paddingY: 15,
    paddingX: 15,
    stroke: {
      style: "#121225",
      line: 15,
    },
  };

  ctx.drawImage(Picto.block(ctx, itemTitle, itemFont, "#FFF", 230, 100, itemOptions).item, 15, 220);

  itemOptions.stroke = null;

  ctx.drawImage(Picto.block(ctx, itemTitle, itemFont, "#FFF", 230, 100, itemOptions).item, 15, 220);

  ctx.shadowColor = "transparent";
  Picto.setAndDraw(ctx,
    Picto.tag(ctx, `${$t(`keywords.${item.rarity}`, P)} `, "900 32px AvenirNextRoundedW01-Bold", "#FFFB"),
    CARD_WIDTH / 2, 15, 230, "center");

  return canvas;
}
function renderDupeTag(rarity, P) {
  const canvas = Picto.new(staticAssets.dupe_tag.width, staticAssets.dupe_tag.width);
  const ctx = canvas.getContext("2d");
  const cosmoAward = rates.gems[rarity];
  P.cosmos += cosmoAward;

  ctx.translate(canvas.width - staticAssets.dupe_tag.width + 10, canvas.height / 2);
  ctx.rotate(0.22);
  ctx.shadowColor = "#53F8";
  ctx.shadowBlur = 10;
  ctx.drawImage(staticAssets.dupe_tag, 0, 0);
  ctx.shadowBlur = 0;
  Picto.setAndDraw(ctx, Picto.tag(ctx, `${$t("loot.duplicate", P)} ! `, "900 italic 32px 'PantonBlack'", "#ffca82", { line: 8, style: "#1b1b32" }), 49, 5, 235);
  Picto.setAndDraw(ctx, Picto.tag(ctx, `+${cosmoAward}`, "900 italic 25px 'PantonBlack'", "#FFF", { line: 6, style: "#1b1b32" }), 175, 40, 125, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.cosmoFragment_plural", P).toUpperCase(), "900 17px 'Panton'", "#DDF8"), 175, 48, 150);

  return canvas;
}
function getPrize(loot, USERDATA) {
  if (loot.collection === "items") return USERDATA.addItem(loot.id);

  if (loot.type === "gems") return ECO.receive(USERDATA.id, loot.amount, "lootbox", loot.currency);

  if (loot.type === "background") return DB.users.set(USERDATA.id, { $addToSet: { "modules.bgInventory": (loot.code || loot.id) } });

  if (loot.type === "medal") return DB.users.set(USERDATA.id, { $addToSet: { "modules.medalInventory": (loot.icon || loot.id) } });
}
function determineRerollCost(box, rollNum, USERDATA) {
  let stake = Math.round(
    (USERDATA.modules.bgInventory.length || 100)
		+ (USERDATA.modules.bgInventory.length || 100)
		+ (USERDATA.modules.inventory.length || 100),
  );
  stake = stake < 50 ? 50 : stake;

  const factors = ["C", "U", "R", "SR", "UR"].indexOf(box.rarity) || 0;
  return ((rollNum || 0) + 1) * Math.ceil(factors * 1.2 + 1) * (stake + 50);
}
function boxBonus(USERDATA, lootbox, options) {
  // TO-DO: more options of small-prizes
  const rarityIndex = ["C", "U", "R", "SR", "UR", "XR"].indexOf(lootbox.rarity);
  let prize = Math.ceil(100 + (rarityIndex * 100) - (options.currentRoll * 50 * rarityIndex));
  if (prize < 100) prize = 50;

  prize += randomize(-25, 100);

  return {
    label: prize,
    unit: "EXP",
    query: { $inc: { "modules.exp": prize } },
  };
}
async function compileBox(msg, lootbox, USERDATA, options) {
  await Promise.all(
    lootbox.visuals.map(async (vis) => VisualsCache.get(vis) || VisualsCache.set(vis, await Picto.getCanvas(vis).catch((e) => new Canvas.Image())) && VisualsCache.get(vis)),
  );

  const {
    currentRoll, rerollCost, totalRerolls, canAffordReroll, P, canReroll,
  } = options;
  let hasDupes = false;

  const canvas = Picto.new(800, 600);
  const ctx = canvas.getContext("2d");
  const back = staticAssets[`bg${lootbox.rarity}`];

  const itemCards = lootbox.content.map((item, i) => renderCard(item, lootbox.visuals[i], P));

  if (itemCards.length <= 3) {
    if (itemCards.length === 3) ctx.drawImage(back, 0, 0, 800, 600);
    ctx.translate(0, 10);
    itemCards.forEach((card, i, a) => {
      if (a.length === 1) i = 1;
      const angle = -0.05 + (0.05 * i);
      const moveY = Math.abs(i - 1) + (i || 15) - (i === 2 ? 25 : 0);
      const moveX = i - 1 * 15 + i * 16;

      ctx.translate(moveX, moveY);
      ctx.rotate(angle);
      ctx.drawImage(card, 8 + i * (CARD_WIDTH - 15) + 2, 0);
      ctx.rotate(-angle);
      ctx.translate(-moveX, -moveY);
    });
    ctx.translate(0, -10);
  } else {
    ctx.save();
    ctx.translate(0, 470);
    ctx.rotate(-0.08 * Math.floor(itemCards.length / 2));
    itemCards.forEach((card, i) => {
      const angle = 0.08 * i;
      const dx = 230;
      const dy = 0;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -470);
      ctx.drawImage(card, -(780 / (itemCards.length * 2)) + (1 + i) * (780 / itemCards.length - 40) + 2 - (10 * i), 120 + Math.pow(1 + i, 2) * -(10 - i));
      ctx.restore();
    });
    ctx.restore();
  }

  lootbox.content.forEach((loot, i, a) => {
    let isDupe = false;

    if (loot.type === "background") isDupe = USERDATA.modules.bgInventory.includes(loot.id || loot.code); // <- ID/CODE backwards compat
    if (loot.type === "medal") isDupe = USERDATA.modules.medalInventory.includes(loot.id || loot.icon); // <- ID/ICON backwards compat

    if (isDupe) {
      hasDupes = true;
      loot.isDupe = true;
      const dupe = renderDupeTag(loot.rarity, P);
      if (a.length <= 3) ctx.drawImage(dupe, -6 + (a.length === 1 ? 1 : i) * (CARD_WIDTH - 15), -80, CARD_WIDTH + 40, CARD_WIDTH + 40);
      else Picto.setAndDraw(ctx, Picto.tag(ctx, "DUPE", "600 italic 30px \"Panton Black\"", "#FA5", { style: "#22212b", line: 10 }), 100 + i * (750 / a.length) - 40 * (1 + i), 430 + Math.abs((i - 2) * 10));
    }
  });

  ctx.drawImage(staticAssets.bonusbar, 0, 0, 800, 600);
  if (lootbox.content.length <= 3) {
    lootbox.content.forEach((l, i, a) => (l.rarity.includes("R") ? ctx.drawImage(staticAssets[`sparkles_${a[1] ? i : 1}`], 0, 0) : null));
  }

  lootbox.bonus = boxBonus(USERDATA, lootbox, options);

  const bonusNum = Picto.tag(ctx, lootbox.bonus.label, "600 italic 42px 'Panton Black'", "#FFF");
  const bonusName = Picto.tag(ctx, lootbox.bonus.unit, "600 italic 34px 'Panton'", "#FFF");
  ctx.drawImage(bonusNum.item, 620 - bonusName.width - bonusNum.width - 10, 525);
  ctx.drawImage(bonusName.item, 620 - bonusName.width, 535);

  P.k_emoji = "`⭐`";
  P.r_emoji = "`🔁`";
  P.amt = `${_emoji("RBN")}** ${miliarize(rerollCost, true, "\u202F")}**`;
  P.count = totalRerolls - currentRoll;
  P.x_frags = `${_emoji("COS")} **${P.cosmos}** [**${$t("keywords.cosmoFragment_plural", P)}**](${paths.WIKI}/items/cosmo_fragment)`;
  return [{
    embed: {
      title: `${_emoji(lootbox.rarity)} **${$t(`items:${lootbox.id}.name`, P)}**`,
      description: `
${canReroll ? $t("loot.options_new", P) : $t("loot.options_nrr", P)}
${hasDupes ? $t("loot.hasDupes", P) : ""}
${totalRerolls - currentRoll > 0
    ? `> ${$t("loot.rerollRemain_new", P)} [${totalRerolls - currentRoll}/${totalRerolls}]` : ""
}
    ${!canAffordReroll ? $t("loot.noFunds", P) : currentRoll >= totalRerolls ? $t("loot.noMoreRolls", P) : ""
}

            `,
      image: {
        // url: "attachment://Lootbox.png",
      },
      thumbnail: { url: paths.CDN + (currentRoll ? "/build/LOOT/rerollbox.gif" : "/build/LOOT/openbox.gif") },
      color: parseInt(lootbox.color.replace("#", ""), 16),
      footer: {
        icon_url: msg.author.avatarURL,
        text: msg.author.tag,
      },
      timestamp: new Date(),
    },
  }, {
    file: canvas.toBuffer(),
    name: "Lootbox.png",
  }];
}

module.exports = {
  init,
  pub: false,
  cmd: "lootbox_generator",
  perms: 3,
  cat: "cosmetics",
  botPerms: ["attachFiles", "embedLinks", "manageMessages", "addReactions"],
  aliases: ["lgen"],
  hooks: {
    postCommand: (m) => LootingUsers.delete(m.author.id),
  },
  errorMessage: (msg, err) => ({
    embed: {
      description: "Something went wrong...\nIf this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n \n***Your Lootbox __was not__ removed from your inventory!***",
      thumbnail: { url: `${paths.CDN}/build/assorted/error_aaa.gif?` },
      color: 0xFF9060,
    },
  }),
};

function getEmoji(it) {
  if (it.type === "material") return "MATERIAL";
  if (it.type === "junk") return "JUNK";
  if (it.type === "boosterpack") return "BOOSTER";
  if (it.type === "background") return "BOOSTER";
  if (it.type === "medal") return "BOOSTER";
}
