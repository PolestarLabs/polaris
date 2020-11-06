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

const init = async (msg,args) => {
  try {
    setTimeout(() => (msg.author.crafting = false), 25000);
    // HELP TRIGGER
    const P = { lngs: msg.lang };
    if (PLX.autoHelper([$t("helpkey", P), "noargs"], { cmd, message: msg, opt: this.cat })) return null;
    //------------

    if (msg.author.crafting) return setTimeout(()=>msg.author.crafting = false, 10000); // ignore if already crafting
    
    let [ITEMS, ALLITEMS] = await Promise.all([DB.items.find({ crafted: true }).lean().exec(),
      DB.items.find({}).lean().exec()]);

      const embed = new Embed();
    embed.description = "";
    embed.setColor("#71dbfa");
    
    let pos;
    console.log(args)
    let amount = ~~(Math.abs(Number(args[0]))) ||  (pos=1) && ~~(Math.abs(Number(args[1])));
    
    if ( isNaN(amount) || amount <= 0 ) amount = 1;
    else pos ? args.pop() : args.shift();
    
    let toBeCrafted = args.join(" ").toLowerCase();
    
    console.log(toBeCrafted,amount)
    
    if (!args) return null;
 
    let craftedItem = await DB.items.get({ $or: [{id: toBeCrafted},{code: toBeCrafted}]});
    //let craftedItem = ITEMS.find((itm) => itm.id === toBeCrafted || itm.code === toBeCrafted);

    if (!craftedItem) { // try finding the item the user meant
      msg.author.crafting = false;

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

    if (!craftedItem) {
      msg.author.crafting = false;
      return msg.reply($t("responses.crafting.noitem", P));
    }

    if (amount > craftedItem.maxBulkCraft){
      return msg.channel.send( _emoji('nope') + $t("responses.crafting.maxBulkAllowed", P));
    }

    msg.author.crafting = true;

    console.log(craftedItem)
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
    let fails = 0;
    let matDisplay = "";
    let craftExplan = "";

    // check against the gems whether the user has enough (if necessary); 
    ["jades", "rubines", "sapphires"].forEach(gem => {
      if (!GC[gem]) return;
      const afford = userData.modules[gem] >= GC[gem] * amount;
      let icona = "yep";
      if (!afford) {
        icona = "nope";
        fails += 1;
      }
      matDisplay += `\n${_emoji(icona)} | ${_emoji(gem.slice(0, gem.length - 1))}**${miliarize(GC[gem]*amount, true)}** x ${$t(`keywords.${gem}`, P)}`;
    });

    // check against all necessary materials whether the user has enough; 
    MAT.forEach((material) => {
      let icona = "yep";

      const materialName = material.id || material;
      const amtInPosession = userData.modules.inventory.find((itm) => itm.id === materialName)?.count || 0;
      const amtRequired = (material.count || objCount(MAT, materialName)) * amount;

      if (amtInPosession < amtRequired) {
        icona = "nope";
        fails += 1;
      }
      console.log(materialName)
      matDisplay += `\n${_emoji(icona)} | ${ALLITEMS.find((x) => x.id === materialName)?.emoji || '📦'}`
        + `${ALLITEMS.find((x) => x.id === materialName).name} (${amtInPosession}/${amtRequired})`;
    });

    if (fails > 0) { // If not enough gems/materials
      embed.setColor("#ed3a19");
      const craftExplan = `\n\n${$t("responses.crafting.materialMissing", P)}`;
      embed.description = matDisplay + craftExplan;
      msg.author.crafting = false;
      msg.channel.send({ embed });
    } else { // If all gems and materials available
      const craftExplan = `\n\n${$t("responses.crafting.materialPresent", P)}`;
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
            console.log(itm);
            if (itm.count) {
              await userData.removeItem(itm.id, itm.count * amount);
            } else {
              await userData.removeItem(itm);
            }
          });

          await Promise.all([
            userData.addItem(craftedItem.id,amount),
            DB.users.set(msg.author.id, {$inc: {'progression.craftingExp':baselineBonus[craftedItem.rarity] * amount} }),
            DB.control.updateOne({id:msg.author.id, 'data.craftingBook.id':craftedItem.id }, {$inc: {[`data.craftingBook.$.count`]: amount} }).catch(err=>{
              return DB.control.updateOne({id:msg.author.id}, {$set: {"data.craftingBook": {[craftedItem.id]:amount}} })
            }),
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
    }
    msg.author.crafting = false;
    //return message.reply("Invalid Craft Code");
  } catch (e) {
    msg.author.crafting = false;
    return console.error(e);
  }
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
};
