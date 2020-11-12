// @ts-check

const cmd = "craft";
const diff = require("fast-diff");
const YesNo = require("../../structures/YesNo");
const ECO = require("../../archetypes/Economy.js");
const { CURRENCIES } = require("../../archetypes/Economy.js");
const baselineBonus = {
  C:1,
  U:2,
  R:5,
  SR:10,
  UR:25,
  XR:50,
}
const YA = { r: _emoji("yep").reaction, id: _emoji("yep").id };
const NA = { r: _emoji("nope").reaction, id: _emoji("nope").id };

let ITEMS, ALLITEMS;
Promise.all([DB.items.find({ crafted: true }).lean().exec(),
  DB.items.find({}).lean().exec()]).then(([IT, ALLIT]) => {
    ITEMS = IT; ALLITEMS = ALLIT;
  });

const init = async (msg,args) => {
  try {
    setTimeout(() => (msg.author.crafting = false), 25000);
    // HELP TRIGGER
    const P = { lngs: msg.lang };
    if (PLX.autoHelper([$t("helpkey", P), "noargs"], { cmd, message: msg, opt: this.cat })) return;
    //------------

    if (msg.author.crafting) return; // ignore if already crafting
    

    const embed = new Embed();
    embed.description = "";
    embed.setColor("#71dbfa");
    
    let pos;
    let amount = ~~(Math.abs(Number(args[0]))) ||  (pos=1) && ~~(Math.abs(Number(args[1])));
    if (isNaN(amount) || amount <= 0) amount = 1;
    else pos ? args.pop() : args.shift();
    
    if (!args) return;
    let toBeCrafted = args.join(" ").toLowerCase(); 
 
    let craftedItem = await DB.items.get({ $or: [{id: toBeCrafted},{code: toBeCrafted}]});
    //let craftedItem = ITEMS.find((itm) => itm.id === toBeCrafted || itm.code === toBeCrafted);

    if (!craftedItem) { // try finding the item the user meant
      let userDiscoveries = Object.keys((await DB.control.get(msg.author.id,)).data?.craftingBook || {});

      let allItems = await DB.items.find({
        crafted: true,
        $or: [ {display: true},{id: {$in: userDiscoveries}} ]
      }).lean();

      ITEMS = allItems.map((itm) => {
        itm.diff = diff(toBeCrafted, itm.name.toLowerCase());
        itm.diffs = {};
        itm.diffs.E = itm.diff.filter((x) => x[0] === 0).length;
        itm.diffs.I = itm.diff.filter((x) => x[0] === 1).length;
        itm.diffs.D = itm.diff.filter((x) => x[0] === -1).length;
        itm.diffScore = itm.diff.filter((x) => x[1].length > toBeCrafted.length / 2 && x[0] !== 0).length
          + itm.diff.filter((x) => x[1].length > toBeCrafted.length / 2 && x[0] === -1).length * 4
          + itm.diff.filter((x) => x[1].length > toBeCrafted.length / 2 && x[0] === 1).length * 0.8
          + itm.diff.length * 1.35
          + itm.diffs.D * 1.6
          + itm.diffs.I * 1.2
          - itm.diffs.E * 3
          - itm.diff.filter((x) => x[1].length > toBeCrafted.length / 2 && x[0] === 0).length * 2.6;
        return itm;
      });

      ITEMS.sort((a, b) => a.diffScore - b.diffScore);

      const DYM = ITEMS.slice(0, 5).filter((y) => y.diffScore < 5).map((x) => `${x.name} (\`${x.code}\`)`);
      const sorry = rand$t("responses.verbose.interjections.gomenasai", P);
      const res = DYM.length === 1 ? $t("responses.crafting.didyoumeanOne", P) : $t("responses.crafting.didyoumean", P);
      if (DYM.length > 0) {
        const stepMessage = await msg.channel.send(`${sorry} ${res}\n> • ${DYM.join("\n> • ")}`);
        if (DYM.length > 1) return;
        if ((await YesNo(stepMessage, msg, true, false, null)) === true) {
          [craftedItem] = ITEMS;
        } else {
          return;
        }
      } else {
        return msg.channel.send($t("responses.crafting.noitemu", P));
      }
    }

    if (!craftedItem) return msg.reply($t("responses.crafting.noitem", P));
    if (amount > craftedItem.maxBulkCraft) return msg.channel.send( _emoji('nope') + $t("responses.crafting.maxBulkAllowed", P));

    msg.author.crafting = true;

    P.item_name = craftedItem.name;
    embed.title((craftedItem?.emoji|| '📦') + $t("responses.crafting.craftingItem", P) + " x " + amount);

    const userData = await DB.users.getFull({ id: msg.author.id }, {
      id: 1, "modules.sapphires": 1, "modules.jades": 1, "modules.rubines": 1, "modules.inventory": 1,
    });

    // message.reply("`console res`")
    const ICON = craftedItem.icon || "";
    embed.thumbnail(`${paths.CDN}/build/items/${ICON}.png`);

    const MAT = craftedItem.materials || [];
    const GC = craftedItem.gemcraft;
    let gemFails = 0;
    let matFails = 0;
    let gemDisplay = "";
    let matDisplay = "";
    let craftExplan = "";

    // check against the gems whether the user has enough (if necessary); 
    ["jades", "rubines", "sapphires"].forEach(gem => {
      if (!GC[gem]) return;
      const afford = userData.modules[gem] >= GC[gem] * amount;
      let icona = "yep";
      if (!afford) {
        icona = "nope";
        gemFails += 1;
      }
      gemDisplay += `\n${_emoji(icona)} | ${_emoji(gem.slice(0, gem.length - 1))}**${miliarize(GC[gem]*amount, true)}** x ${$t(`keywords.${gem}`, P)}`;
    });

    // check against all necessary materials whether the user has enough;
    const goodMAT = {};
    MAT.forEach(mat => {
      if (typeof mat === "string") goodMAT[mat] = (goodMAT[mat]++ || 1);
      else goodMAT[mat.id] = (goodMAT[mat.id] + (mat.count || 1)) || (mat.count || 1);
    });
    Object.keys(goodMAT).forEach((material) => {
      let icona = "yep";

      const amtInPosession = userData.modules.inventory.find((itm) => itm.id === material)?.count || 0;

      if (amtInPosession < goodMAT[material]) {
        icona = "nope";
        matFails += 1;
      }

      matDisplay += `\n${_emoji(icona)} | ${ALLITEMS.find((x) => x.id === material)?.emoji || '📦'}`
        + `${ALLITEMS.find((x) => x.id === material).name} (${amtInPosession}/${goodMAT[material]})`;
    });

    // Not enough gems; fatal to crafting.
    if (gemFails > 0) { 
      embed.setColor("#ed3a19");
      craftExplan = `\n\n${$t("responses.crafting.gemsMissing", P)}`;
      embed.description = gemDisplay + matDisplay + craftExplan;
      msg.author.crafting = false;
      return msg.channel.send({ embed });
    }
    
    let embedmsg;

    // Not enough materials, possibly allow autocrafting.
    if (matFails > 0) {
      const hasCrafted = userData.modules.inventory.find(itm => itm.id === craftedItem.id)?.crafted;
      // if (!hasCrafted) endMissingMaterials(); // UNCOMMENT THIS

      craftExplan = `\n\n${$t("responses.crafting.materialAutocraft", P)}`;
      embed.description = gemDisplay + matDisplay + craftExplan;
      await msg.channel.send({ embed }).then(async(m) => {
        embedmsg = m;
        await getYesNo(m).then(async () => {
          // see what is needed for autocrafting
          const autoReport = genAutoReport(craftedItem, userData, amount);
          autoReport.P = P;
          // make a visual of the report
          let visualize = genAutoVisual(autoReport, 2);
          if (visualize.length > Math.pow(2, 10)) visualize = visualize.substring(Math.pow(2, 10)) + "\nOops... there was too much to show so I cut it off.";
         
          if (!autoReport.enoughGems || !autoReport.enoughItems) return endMissingMaterials(m, visualize);

          craftExplan = `${visualize}\n\n${$t("responses.crafting.materialPresent", P)}`;
          embed.description = craftExplan;
          embed.color = 0xccff33;
          m.edit({ embed });

          return getYesNo(m, 30000).then(async() => {
            const xp = Object.keys(autoReport.itemsCrafting)
              .map(toCraft => baselineBonus[ALLITEMS.find(itm => itm.id === toCraft).rarity] * autoReport.itemsCrafting[toCraft])
              .reduce((a,b) => a + b, 0);

            /**
             * Handling all the DB stuff in one query:
             * 1. User pays all the gem(s).
             * 2. User pays all the item(s).
             * 3. User gets crafted item(s) added.
             * 4. User receives XP for ALL the (intermediate) crafted item(s).
             * 5. Amount crafted is updated for ALL (intermediate) crafted item(s).
             */
            const gemTranslation = { sapphires: "SPH", jades: "JDE", rubines: "RBN" }
            const arrayFilters = [];
            const toInc = {};
            const itemCraftingArr = Object.keys(autoReport.itemsCrafting);
            let i = 0;
            for(;i < itemCraftingArr.length; i++) {
              arrayFilters.push({ [`i${i}.id`]: itemCraftingArr[i] });
              toInc[`modules.inventory.$[i${i}].crafted`] = autoReport.itemsCrafting[itemCraftingArr[i]];
              if (itemCraftingArr[i] === craftedItem.id) toInc[`modules.inventory.$[i${i}].count`] = autoReport.itemsCrafting[itemCraftingArr[i]];
            }
            const itemHaveArr = Object.keys(autoReport.totalItems);
            for(let j = 0; j < itemHaveArr.length; j++) {
              arrayFilters.push({ [`i${i}.id`]: itemHaveArr[j] });
              toInc[`modules.inventory.$[i${i}].count`] = -autoReport.totalItems[itemHaveArr[j]];
              i++;
            }
            const gemArr = Object.keys(autoReport.totalGems);
            for (let k = 0; k < gemArr.length; k++) {
              toInc[`modules.${gemArr[k]}`] = -autoReport.totalGems[gemArr[k]];
              i++;
            }
            toInc["progression.craftingXP"] = xp;
            // console.table((await DB.users.get(msg.author.id)).modules.inventory); // DEBUG
            // console.table(toInc); // DEBUG
            // console.table(arrayFilters.reduce((old, nobj) => Object.assign(old, nobj), {})); // DEBUG
              
            DB.users.collection.updateOne(
                { id: msg.author.id },
                { $inc: toInc },
                { arrayFilters: arrayFilters }).then(() => {
                  const toInsert = Object.keys(autoReport.totalGems)
                    .map(gem => ECO.generatePayload(msg.author.id, -autoReport.totalGems[gem], "crafting", gemTranslation[gem], "PAYMENT", "-"));
                  DB.audits.collection.insertMany(toInsert);
                });
            // console.table((await DB.users.get(msg.author.id)).modules.inventory); DEBUG
            done();
          }).catch(e => {
            return endNo(e, m);
          });
        }).catch(e => {
          // craft is cancelled
          return endNo(e, m);
        });
      });
    } else {
      /**------------------------------/
      |* EVERYTHING AVAILABLE → CRAFT *
      \**-----------------------------*/
      craftExplan = `\n\n${$t("responses.crafting.materialPresent", P)}`;
      embed.description = gemDisplay + matDisplay + craftExplan;
      // Show craft cost & info
      await msg.channel.send({ embed }).then(async (m) => {
        embedmsg = m;
        await getYesNo(m).then(async() => {
          // craft is confirmed
          const payArr = ["rubines", "jades", "sapphires"].map(gem => ({ amt: GC[gem], currency: gem }));

          await Promise.all([
            ECO.pay(msg.author.id, payArr, "crafting"),
            ...Object.keys(MAT).map(itm => userData.removeItem(MAT[itm].id, (MAT[itm].count || 1) * amount)),
            userData.addItem(craftedItem.id, amount, true),
            DB.users.set(msg.author.id, {$inc: {'progression.craftingExp':baselineBonus[craftedItem.rarity] * amount} }),
            DB.control.set(msg.author.id, {$inc: {[`data.craftingBook.${craftedItem.id}`]: amount} }),
          ]);
          done();
        }).catch(e => {
          // craft is cancelled
          return endNo(e, m);
        });
      });
    }

    function done() {
      msg.author.crafting = false;
      embed.setColor("#78eb87");
      embed.description = "";
      embed.footer = { text: $t("responses.crafting.crafted", P) };
      // @ts-ignore
      return embedmsg.edit({ embed });
    }

    function endNo(e, m) {
      msg.author.crafting = false;
      embed.description = gemDisplay + matDisplay;
      if (e === "timeout") {
        return endTimeout(m);
      } else if (e === "no") {
        return endCancel(m);
      } else {
        if (e && e.stack) console.error(e.stack);
        throw new Error("shouldn't happen");
      }
    }

    function endMissingMaterials(m, v) {
      msg.author.crafting = false;
      embed.setColor("#ed3a19");
      embed.description = (v ? v : gemDisplay + matDisplay) + `\n${$t("responses.crafting.materialMissing", P)}`;
      if (m) m.edit({ embed });
      else msg.channel.send({ embed });
      return;
    }

    function endTimeout(m) {
      embed.setColor("#ffd900");
      embed.footer.text = $t("responses.crafting.timeout", P);
      m.edit({ embed });
      return;
    }

    function endCancel(m) {
      embed.setColor("#db4448");
      embed.footer.text = $t("responses.crafting.cancel", P);
      m.edit({ embed });
      return;
    }

    function getYesNo(m, l = 10000) {
      return new Promise(async(resolve, reject) => {
        await m.addReaction(YA.r);
        m.addReaction(NA.r);
    
        // Confirmation of craft through reactions
        const reas = await m.awaitReactions({
          maxMatches: 1,
          time: l,
          authorOnly: msg.author.id,
        }).catch(() => reject("timeout"));
    
        await m.removeReactions().catch();
        if (!reas || reas.length === 0) reject("timeout");
        if (reas.length === 1 && reas[0].emoji.id === NA.id) reject("no");
        if (reas.length === 1 && reas[0].emoji.id === YA.id) resolve();
        reject();
      });
    }
  } catch (e) {
    msg.author.crafting = false;
    msg.channel.send({ embed: { color: 0x000, description: "Something went wrong..." } })
    return console.error(e);
  }
};

function test(i, u, c, v = false) {
  let time = process.hrtime();
  const report = genAutoReport(i, u, c);
  if (v) genAutoVisual(report);
  return process.hrtime(time)[1];
}

/**
 * Function to calculate cost of auto crafting.
 * 
 * @param {object} item item to be autocrafted
 * @param {object} userData user's userData
 * @param {number|1} count the amount to be crafted
 * @return {object} object structured like: { items: { $mat: amt }, gems: { $gem: amt }, allitems: [ itemID ] }
 */
function genAutoReport(item, userData, count = 1, itemCost = {}) {
  item = ALLITEMS.find(itm => itm.id === item.id);
  if (!item) throw new Error(`itemID ${item} did not match any itemID`);
  if (!item.crafted) throw new Error(`Item ${item} not craftable`);
  let toRet = { craft: true, itemsCrafting: {}, itemsMissing: {}, gemsMissing: {}, totalGems: {}, totalItems: {}, id: item.id, count: count, gems: {}, items: [] };
  toRet.itemsCrafting[item.id] = count;
  const inventory = userData.modules.inventory;
  

  // add gem cost
  for (const gem of Object.keys(item.gemcraft)) {
    if (item.gemcraft[gem]) toRet.gems[gem] = (toRet.gems[gem] || 0) + (item.gemcraft[gem] * count);
    if (toRet.gems[gem]) toRet.totalGems[gem] = (toRet.totalGems[gem] || 0) + toRet.gems[gem];
  }


  if (item.materials && item.materials.length) {
    // add material/material's cost

    // First merge all duplicate material entries
    const countList = {};
    for (let material of item.materials) {
      let n = (material.count * count) || count;
      if (countList[material.id]) countList[material.id] += n;
      else countList[material.id] = n;
    }

    // Loop through all materials
    for (let materialID of Object.keys(countList)) {
      const material = ALLITEMS.find(itm => itm.id === materialID);
      if (!material) throw new Error(`materialID [${materialID}] of item ${item} did not match any itemID`);

      const need = countList[material.id];
      const inInventory = inventory.find(itms => itms.id === material.id)?.count || 0;
      const amountLeft = (inInventory - (itemCost[material.id] || 0)) || 0;
      const haveEnough = amountLeft >= countList[material.id];

      // const debug = { id: materialID, count: countList[materialID], need, inInventory, amountLeft, haveEnough }; // DEBUG

      if (!material.crafted || amountLeft) {
        // The item can't be crafted, or we have enough
        itemCost[material.id] = (itemCost[material.id] || 0) + amountLeft;
        toRet.items.push({ id: material.id, count: material.crafted ? amountLeft : need });
        if (amountLeft) toRet.totalItems[material.id] = (toRet.totalItems[material.id] || 0) + amountLeft;
        if (!material.crafted) toRet.itemsMissing[material.id] = (toRet.itemsMissing[material.id] || 0) + (need - amountLeft);
      }
      if (material.crafted && !haveEnough) {
        let toAdd = need - amountLeft;
        // debug["toCraft"] = toAdd; // DEBUG
        toRet.craft = true;

        // Not enough items... time to craft
        // Generate auto report for the material and add it to itemCost * count
        const materialReport = genAutoReport(material, userData, toAdd, itemCost);
        for (const MCgem of Object.keys(materialReport.totalGems)) {
          toRet.totalGems[MCgem] = (toRet.totalGems[MCgem] || 0)
            + materialReport.totalGems[MCgem];
        }
        for (const MCitem of Object.keys(materialReport.items)) {
          itemCost[MCitem] = (itemCost[MCitem] || 0)
            + materialReport.items[MCitem];
        }
        for (const crafted of Object.keys(materialReport.itemsCrafting)) {
          toRet.itemsCrafting[crafted] = (toRet.itemsCrafting[crafted] || 0)
            + materialReport.itemsCrafting[crafted];
        }
        for (const uncraftable of Object.keys(materialReport.totalItems)) {
          toRet.totalItems[uncraftable] = (toRet.totalItems[uncraftable] || 0)
            + materialReport.totalItems[uncraftable];
        }
        for (const necessary of Object.keys(materialReport.itemsMissing)) {
          toRet.itemsMissing[necessary] = (toRet.itemsMissing[necessary] || 0)
            + materialReport.itemsMissing[necessary];
        }
        // We only want this on the final report.
        delete materialReport.itemsMissing;
        delete materialReport.gemsMissing;
        delete materialReport.totalItems;
        delete materialReport.enoughGems;
        delete materialReport.enoughItems;
        delete materialReport.totalGems;
        delete materialReport.itemsCrafting;
        toRet.items.push({ ...materialReport, count: toAdd });
      }

      // console.table(debug) // DEBUG
    }
  }

  toRet.enoughGems = !Object.keys(toRet.totalGems).filter(gem => {
    if (toRet.totalGems[gem] > userData.modules[gem]) {
      toRet.gemsMissing[gem] = toRet.totalGems[gem] - userData.modules[gem];
      return true;
    } else return false;
  }).length;
  toRet.enoughItems = !Object.keys(toRet.itemsMissing).length;


  return toRet;
}


const emotes = { "rubines": "<:rubine:367128893372760064>", sapphires: "<:sapphire:367128894307827712>", jades: "<:jade:367128893716430848>"}
/**
 * Generates the description...
 * Should really be replaced with gfx/fields
 *
 * @param {object} report the report
 * @param {number} maxDepth the max depth to visualize
 * @return {string} description for embed 
 */
function genAutoVisual(report, maxDepth) {
  let toret = "";
  if (!(report.enoughGems && report.enoughItems)) toret = genFail(report);
  else toret = genSuccess(report);
  return toret + "\n\n" + recVisual(report, maxDepth);
}

function genFail(report) {
  let toret = "I cannot craft the following requirements:";
  const nope = _emoji("nope");

  for (const gem of Object.keys(report.gemsMissing)) {
    toret += `\n${nope} | ${_emoji(gem.slice(0, gem.length - 1))}**${miliarize(report.gemsMissing[gem])}** ${report.gemsMissing[gem]>=10000?"":"x"} ${$t(`keywords.${gem}`, report.P)}`;
  }

  for (const item of Object.keys(report.itemsMissing)) {
    toret += `\n${nope} | ${ALLITEMS.find((x) => x.id === item)?.emoji || '📦'}`
    + `${ALLITEMS.find((x) => x.id === item).name} ${miliarize(report.itemsMissing[item])}${report.itemsMissing[item]>=10000?"":"x"}`;
  }

  return toret;
}

function genSuccess(report) {
  let toret = "Total cost:";
  const yep = _emoji("yep");

  for (const gem of Object.keys(report.totalGems)) {
    toret += `\n${yep} | ${_emoji(gem.slice(0, gem.length - 1))}**${miliarize(report.totalGems[gem], true)}** ${report.totalGems[gem]>=10000?"":"x"} ${$t(`keywords.${gem}`, report.P)}`;
  }

  for (const item of Object.keys(report.totalItems)) {
    toret += `\n${yep} | ${ALLITEMS.find((x) => x.id === item)?.emoji || '📦'}`
    + `${ALLITEMS.find((x) => x.id === item).name} ${miliarize(report.totalItems[item])}${report.totalItems[item]>=10000?"":"x"}`;
  }

  return toret;
}

function recVisual(report, maxDepth, depth = 0, static = {}) {
  let str = "";

  if (report.itemsMissing) {
    static = Object.keys(report.itemsMissing);
  }

  let depthstr = "";
  let it = "---"
  for (let i = 0; i < depth; i++) depthstr += it;

  let items = report.items;
  const emote = report.craft ? "🛠️" : static.find(s => s === report.id) ? _emoji("nope") :_emoji("yep");
  str += `${depthstr} ${emote} **${report.id}** ${miliarize(report.count) || 1}${report.count>=10000?"":"x"}`
  if (report.craft) str += ` :: ${Object.keys(report.gems).map(gem => `${emotes[gem]}${miliarize(report.gems[gem])}${report.gems[gem]>=10000?"":"x"}`).join(" ")}\n`;
  else str += "\n";

  if (report.craft && items?.length) {
    if (depth == maxDepth) str += `${depthstr}${it} and more...`;
    else for (const item of items) str += recVisual(item, maxDepth, depth + 1, static);
  }

  return str;
}

module.exports = {
  test,
  genAutoReport,
  genAutoVisual,
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
};
