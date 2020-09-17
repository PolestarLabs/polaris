const cmd = "craft";
const diff = require("fast-diff");
const YesNo = require("../../structures/YesNo");
const ECO = require("../../archetypes/Economy.js");

const init = async (msg) => {
  try {
    setTimeout(() => (msg.author.crafting = false), 25000);
    // HELP TRIGGER
    const P = { lngs: msg.lang };
    if (PLX.autoHelper([$t("helpkey", P), "noargs"], { cmd, msg, opt: this.cat })) return null;
    //------------

    if (msg.author.crafting) return null;
    msg.author.crafting = true;

    let [ITEMS, ALLITEMS] = await Promise.all([DB.items.find({ crafted: true }).lean().exec(),
      DB.items.find({}).lean().exec()]);

    const embed = new Embed();
    embed.description = "";
    embed.setColor("#71dbfa");

    let arg = msg.content.split(/ +/).slice(1)[0];
    if (!arg) return null;
    let craftedItem = ITEMS.find((itm) => itm.id === arg || itm.code === arg);

    if (!craftedItem) {
      msg.author.crafting = false;
      arg = msg.args.join(" ").toLowerCase();

      ITEMS = ITEMS.map((itm) => {
        itm.diff = diff(arg, itm.name.toLowerCase());
        itm.diffs = {};
        itm.diffs.E = itm.diff.filter((x) => x[0] === 0).length;
        itm.diffs.I = itm.diff.filter((x) => x[0] === 1).length;
        itm.diffs.D = itm.diff.filter((x) => x[0] === -1).length;
        itm.diffScore = itm.diff.filter((x) => x[1].length > arg.length / 2 && x[0] !== 0).length
          + itm.diff.filter((x) => x[1].length > arg.length / 2 && x[0] === -1).length * 4
          + itm.diff.filter((x) => x[1].length > arg.length / 2 && x[0] === 1).length * 0.8
          + itm.diff.length * 1.35
          + itm.diffs.D * 1.6
          + itm.diffs.I * 1.2
          - itm.diffs.E * 3
          - itm.diff.filter((x) => x[1].length > arg.length / 2 && x[0] === 0).length * 2.6;
        return itm;
      });

      ITEMS.sort((a, b) => a.diffScore - b.diffScore);

      const DYM = ITEMS.slice(0, 5).filter((y) => y.diffScore < 5).map((x) => `${x.name} (\`${x.code}\`)`);
      const sorry = rand$t("responses.verbose.interjections.gomenasai", P);
      const res = DYM.length === 1 && $t("responses.crafting.didyoumeanOne", P);
      if (DYM.length > 0) {
        const stepMsg = await msg.channel.send(`${sorry} ${res}\n> • ${DYM.join("\n> • ")}`);
        if (DYM.length > 1) return null;
        if ((await YesNo(stepMsg, msg, true, false, null)) === true) {
          [craftedItem] = ITEMS;
        } else {
          return null;
        }
      } else {
        return msg.channel.send($t("responses.crafting.noitemu", P));
      }
    }

    if (!craftedItem) {
      msg.author.crafting = false;
      return msg.reply($t("responses.crafting.noitem", P));
    }

    P.item_name = craftedItem.name;
    embed.title(craftedItem?.emoji + $t("responses.crafting.craftingItem", P));

    const userData = await DB.users.getFull({ id: msg.author.id }, {
      id: 1, "modules.sapphires": 1, "modules.jades": 1, "modules.rubines": 1, "modules.inventory": 1,
    });

    // msg.reply("`console res`")
    if (craftedItem) {
      const ICON = craftedItem.icon || "";
      embed.thumbnail(`${paths.CDN}/build/items/${ICON}.png`);

      const MAT = craftedItem.materials || [];
      const GC = craftedItem.gemcraft;
      let fails = 0;
      let matDisplay = "";
      let craftExplan = "";

      if (GC.jades) {
        const afford = userData.modules.jades >= GC.jades;
        let icona = "yep";
        if (!afford) {
          icona = "nope";
          fails += 1;
        }
        matDisplay += `\n${_emoji(icona)} | ${_emoji("jade")}**${miliarize(GC.jades, true)}** x ${$t("keywords.JDE", P)}`;
      }

      if (GC.rubines) {
        const afford = userData.modules.rubines >= GC.rubines;
        let icona = "yep";
        if (!afford) {
          icona = "nope";
          fails += 1;
        }
        matDisplay += `\n${_emoji(icona)} | ${_emoji("rubine")}**${miliarize(GC.rubines, true)}** x ${$t("keywords.RBN", P)}`;
      }

      if (GC.sapphires) {
        const afford = userData.modules.sapphires >= GC.sapphires;
        let icona = "yep";
        if (!afford) {
          icona = "nope";
          fails += 1;
        }
        matDisplay += `\n${_emoji(icona)} | ${_emoji("sapphire")}**${miliarize(GC.sapphires, true)}** x ${$t("keywords.SPH", P)}`;
      }

      MAT.forEach((material) => {
        let icona = "yep";

        materialName = material.id || material;

        amtInPosession = userData.modules.inventory.find((itm) => itm.id === materialName)?.count || 0;
        amtRequired = material.amt || objCount(MAT, materialName);

        if (amtInPosession >= amtRequired) {
        // msg.reply('ok')

        } else {
          icona = "nope";
          fails += 1;
        }
        matDisplay += `\n${_emoji(icona)} | ${ALLITEMS.find((x) => x.id === materialName).emoji}`
        + `${ALLITEMS.find((x) => x.id === materialName).name} (${amtInPosession}/${amtRequired})`;
      });
      if (fails > 0) {
        embed.setColor("#ed3a19");
        craftExplan = `\n\n${$t("responses.crafting.materialMissing", P)}`;
        embed.description = matDisplay + craftExplan;
        msg.author.crafting = false;
        return msg.channel.send({ embed });
      }
      craftExplan = `\n\n${$t("responses.crafting.materialPresent", P)}`;
      embed.description = matDisplay + craftExplan;
      return msg.channel.send({ embed }).then(async (m) => {
        const YA = { r: _emoji("yep").reaction, id: _emoji("yep").id };
        const NA = { r: _emoji("nope").reaction, id: _emoji("nope").id };

        await m.addReaction(YA.r);
        m.addReaction(NA.r);

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

        if (reas.length === 0) return null;

        if (reas.length === 1 && reas[0].emoji.id === NA.id) {
          embed.setColor("#db4448");
          embed.footer($t("responses.crafting.cancel", P));
          embed.description = matDisplay;
          m.edit({ embed });
          m.removeReactions().catch();
          return (msg.author.crafting = false);
        }
        if (reas.length === 1 && reas[0].emoji.id === YA.id) {
          await Promise.all(
            [ECO.pay(msg.author.id, GC.rubines, "crafting", "RBN"),
              ECO.pay(msg.author.id, GC.jades, "crafting", "JDE"),
              ECO.pay(msg.author.id, GC.sapphires, "crafting", "SPH")],
          );

          MAT.forEach(async (itm) => {
            console.log(itm);
            if (itm.amt) {
              await userData.removeItem(itm.id, itm.amt);
            } else {
              await userData.removeItem(itm);
            }
          });

          await DB.items.receive(msg.author.id, craftedItem.id);

          msg.author.crafting = false;
          embed.setColor("#78eb87");
          embed.description = matDisplay;
          embed.footer($t("responses.crafting.crafted", P));
          m.removeReactions().catch();
          return m.edit({ embed });
        }
        return null;
      });
    }
    msg.author.crafting = false;
    return msg.reply("Invalid Craft Code");
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
