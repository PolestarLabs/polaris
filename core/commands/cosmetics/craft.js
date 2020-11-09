const cmd = "craft";
const diff = require("fast-diff");
const YesNo = require("../../structures/YesNo");
const ECO = require("../../archetypes/Economy.js");
const baselineBonus = {
  C:1,
  U:2,
  R:5,
  SR:10,
  UR:25,
  XR:50,
}

let ITEMS, ALLITEMS;
Promise.all([DB.items.find({ crafted: true }).lean().exec(),
  DB.items.find({}).lean().exec()]).then((IT, ALLIT) => {
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
    MAT.forEach((material) => {
      let icona = "yep";

      const materialName = material.id || material;
      const amtInPosession = userData.modules.inventory.find((itm) => itm.id === materialName)?.count || 0;
      const amtRequired = (material.count || objCount(MAT, materialName)) * amount;

      if (amtInPosession < amtRequired) {
        icona = "nope";
        matFails += 1;
      }

      matDisplay += `\n${_emoji(icona)} | ${ALLITEMS.find((x) => x.id === materialName)?.emoji || '📦'}`
        + `${ALLITEMS.find((x) => x.id === materialName).name} (${amtInPosession}/${amtRequired})`;
    });

    // Not enough gems; fatal to crafting.
    if (gemFails > 0) { 
      embed.setColor("#ed3a19");
      craftExplan = `\n\n${$t("responses.crafting.gemsMissing", P)}`;
      embed.description = gemDisplay + matDisplay + craftExplan;
      msg.author.crafting = false;
      return msg.channel.send({ embed });
    }

    // Not enough materials, try autocraft.
    if (matFails > 0) {
      const autoCost = calcAutoCost(ALLITEMS, craftedItem, inventory);

      embed.setColor(); // todo: flicky
      craftExplan = `\n\n${$t("responses.crafting.materialMissing", P)}`;
    }
    
    /**------------------------------/
    |* EVERYTHING AVAILABLE → CRAFT *
    \**-----------------------------*/
    craftExplan = `\n\n${$t("responses.crafting.materialPresent", P)}`;
    embed.description = matDisplay + craftExplan;
    // Show craft cost & info
    msg.channel.send({ embed }).then(async (m) => {
      const YA = { r: _emoji("yep").reaction, id: _emoji("yep").id };
      const NA = { r: _emoji("nope").reaction, id: _emoji("nope").id };

      await m.addReaction(YA.r);
      m.addReaction(NA.r);

      // Confirmation of craft through reactions
      const reas = await m.awaitReactions({
        maxMatches: 1,
        time: 10000,
        authorOnly: msg.author.id,
      }).catch(() => {
        embed.setColor("#ffd900");
        embed.description = matDisplay;
        embed.footer($t("responses.crafting.timeout", P));
        m.edit({ embed });
        m.removeReactions().catch();
        return (msg.author.crafting = false);
      });

      if (reas.length === 0) return;

      // craft is cancelled
      if (reas.length === 1 && reas[0].emoji.id === NA.id) {
        embed.setColor("#db4448");
        embed.footer($t("responses.crafting.cancel", P));
        embed.description = matDisplay;
        m.edit({ embed });
        m.removeReactions().catch();
        return (msg.author.crafting = false);
      }

      // craft is confirmed
      if (reas.length === 1 && reas[0].emoji.id === YA.id) {
        await Promise.all(
          [ECO.pay(msg.author.id, GC.rubines * amount, "crafting", "RBN"),
          ECO.pay(msg.author.id, GC.jades * amount, "crafting", "JDE"),
          ECO.pay(msg.author.id, GC.sapphires * amount, "crafting", "SPH")],
        );

        MAT.forEach(async (itm) => {
          if (itm.count) {
            await userData.removeItem(itm.id, itm.count * amount);
          } else {
            await userData.removeItem(itm);
          }
        });

        await Promise.all([
          userData.addItem(craftedItem.id,amount),
          DB.users.set(msg.author.id, {$inc: {'progression.craftingExp':baselineBonus[craftedItem.rarity] * amount} }),
          DB.control.set(msg.author.id, {$inc: {[`data.craftingBook.${craftedItem.id}`]: amount} }),
        ]);
        
        msg.author.crafting = false;
        embed.setColor("#78eb87");
        embed.description = matDisplay;
        embed.footer($t("responses.crafting.crafted", P));
        m.removeReactions().catch();
        return m.edit({ embed });
      }
      return;
    });
    msg.author.crafting = false;
    //return message.reply("Invalid Craft Code");
  } catch (e) {
    msg.author.crafting = false;
    return console.error(e);
  }
};

/**
 * Function to calculate cost of auto crafting.
 * 
 * @param {object} item item to be autocrafted
 * @param {object} inventory user's inventory (to calc mat cost)
 * @return {object} object structured like: { items: { $mat: amt }, gems: { $gem: amt } }
 */
function calcAutoCost(item, inventory, itemCost = {}) {
  let toRet = { items: itemCost, gems: {} };

  // add gem cost
  for (const gem of Object.keys(item.gemcraft)) { 
    if (!toRet.gems[gem]) toRet.gems[gem] = item.gemcraft[gem];
    else toRet.gems[gem] += item.gemcraft[gem]; 
  }

  // add material/material's cost
  for (let material of item.materials) {
    // enough items? add item to cost, else add costs of item to costs.
    material = ALLITEMS.find(itm => itm.id === material.id);
    if (!material.crafted || (toRet[material.id] || 0) + itemCost[material.id] + 1 <= (inventory.find(itms => itms.id === material.id)?.count || 0)) {
      toRet.items[material.id] ? toRet.items[material.id]++ : toRet.items[material.id] = 1;
    } else {
      if (!material) throw new Error("MaterialID did not match any itemID");
      Object.assign(toRet, calcAutoCost(material, inventory, toRet.items));
    }
  }

  return toRet;
}

module.exports = {
  calcAutoCost,
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
};
