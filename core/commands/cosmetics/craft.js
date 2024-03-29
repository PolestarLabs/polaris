
// LINK Trello https://trello.com/c/KLEVWE10
// TRANSLATE[epic=translations] craft

const cmd = "craft";
const { inspect } = require("util");
const YesNo = require("../../structures/YesNo");
const { Crafter } = require("../../archetypes/Crafter");
const Visualizer = require("../../archetypes/Visualizer");

const YA = { r: _emoji("yep").reaction, id: _emoji("yep").id };
const NA = { r: _emoji("nope").reaction, id: _emoji("nope").id };

const init = async (msg, args) => {
  try {
    setTimeout(() => (msg.author.crafting = false), 25000);
    const P = { lngs: msg.lang };

    // ignore if already crafting
    if (msg.author.crafting) return;

    // Check arguments
    
    const depsOnly = args.some((arg, i) => (arg.toLowerCase() === "-deps" || arg.toLowerCase() === "-d") && args.splice(i, 1));
    

    let amount = 1;
    args.some((arg, i) => !isNaN(Number(arg)) && (amount = Math.abs(~~args.splice(i, 1)) || 1))
    if (!args) return;
    const toBeCrafted = args.join(" ") //.toLowerCase();

    // If args === item.id
    let craftedItem = Crafter.getItem(toBeCrafted);

    const userDiscoveries = (await DB.users.get(msg.author.id))?.modules.inventory.filter((itm) => itm.crafted).map((itm) => itm.id) || [];
    if (craftedItem && !userDiscoveries.includes(craftedItem.id) && !craftedItem.open) craftedItem = null;
    // Else find a partial match
    if (!craftedItem) {

      const searchResults = await Crafter.searchItems(toBeCrafted);
      const DYM = searchResults.filter((x) => (x._doc || x).open || userDiscoveries.includes(x.id)).map((x) => `${x.name} (\`${x.code}\`)`);
      const res = DYM.length === 1 ? $t("responses.crafting.didyoumeanOne", P) : $t("responses.crafting.didyoumean", P);

      if (DYM.length > 0) {
        const stepMessage = await msg.channel.send(`${rand$t("responses.verbose.interjections.gomenasai", P)} ${res}\n> • ${DYM.join("\n> • ")}`);
        if (DYM.length > 1) return;
        if ((await YesNo(stepMessage, msg, {deleteOriginal:true})) === true) {
          [craftedItem] = searchResults;
          
        } else {
          return;
        }
      } else {
        if (searchResults.length && !DYM.length) return msg.channel.send($t(["responses.crafting.itemNotOpen",
      "Looks like you never crafted this item before, you need a **Recipe** first or craft it via **Crafting Discovery**"
      ], P));
        return msg.channel.send($t("responses.crafting.noitemlike", P));
      }
      if (!craftedItem) return msg.channel.send($t("responses.crafting.noitemlike", P)); 
      //return msg.reply($t("responses.crafting.noitem", P));
    }

    // Don't allow too much bulk crafting...
    if (amount > craftedItem.maxBulkCraft) return msg.channel.send(_emoji("nope") + $t("responses.crafting.maxBulkAllowed", P));

    // Item found → start the crafting process
    msg.author.crafting = true;
    const crafter = new Crafter(msg.author.id, craftedItem, amount);

    // Set up embed base & response translation.
    const embed = {};
    embed.description = "";
    embed.color = 0x71dbfa;
    P.item_name = craftedItem.name;

    // set up embed for if no failed checks
    const ICON = craftedItem.icon || craftedItem.id || "";
    embed.title = `${(craftedItem?.emoji || "📦") + $t("responses.crafting.craftingItem", P)} x ${amount}`;
    embed.thumbnail = { url: `${paths.CDN}/build/items/${ICON}.png` };
    let craftExplan = "";
    let gemDisplay = "";
    let matDisplay = "";

    crafter.once("ready", () => {
      // Create gem display.
      const { gemsTotal } = crafter;
      for (const gemArr of gemsTotal) {
        const icona = gemArr[2] < gemArr[1] ? "nope" : "yep";
        gemDisplay += `\n${_emoji(icona)} | ${_emoji(gemArr[0])}**${miliarize(gemArr[1], true)}** ${$t(`keywords.${gemArr[0]}_plural`, P)}`;
      }

      // Create material display
      const { itemsTotal } = crafter;

      for (const itemArr of itemsTotal) {

        const icona = itemArr[2] < itemArr[1] ? "nope" : "yep";

        const itemDetails = Crafter.getItem(itemArr[0]);
        matDisplay += `\n${_emoji(icona)} | ${itemDetails?.emoji?.trim() || "📦"}`
          + ` ${itemDetails?.name} (${itemArr[2]}/${itemArr[1]})`;
      }
      // Not enough gems; fatal to crafting.
      if (crafter.isMissingGems) {
        
        embed.color = 0xed3a19;
        craftExplan = `\n\n${$t("responses.crafting.gemsMissing", P)}`;
        embed.description = gemDisplay + matDisplay;
        if (embed.description.length > 0x77f) embed.description = `${embed.description.substring(0, 0x77f)}\nOops... there was too much to show so I cut it off.`;
        embed.description += craftExplan;
        msg.author.crafting = false;
        return msg.channel.send({ embed });
      }

      let embedmsg;

      // Not enough materials. =<
      if (crafter.isMissingItems) {
        // If user hasn't crafted the item before, don't allow autocrafting.
        if (!crafter.hasCrafted) return endMissingMaterials();

        craftExplan = `\n\n${$t("responses.crafting.materialAutocraft", P)}`;
        embed.description = gemDisplay + matDisplay;
        if (embed.description.length > 0x77f) embed.description = `${embed.description.substring(0, 0x77f)}\nOops... there was too much to show so I cut it off.`;
        embed.description += craftExplan;
        return msg.channel.send({ embed }).then((m) => {
          embedmsg = m;

          return getYesNo(m).then(async () => {
            // set crafter to autocraft
            crafter.setMode(depsOnly ? 2 : 1);

            // make a visual of current crafter
            const visualizer = new Visualizer(crafter, P, { depth: 3 });
            let visualize = visualizer.visualize();
            if (visualize.length > 0x77f) visualize = `${visualize.substring(0, 0x77f)}\nOops... there was too much to show so I cut it off.`;

            // Return if we don't have enough gems or items
            if (crafter.isMissingGems || crafter.isMissingItems) return endMissingMaterials(m, visualize);

            // Change embed to ask whether user wants to autocraft
            craftExplan = `${visualize}\n\n${$t("responses.crafting.materialPresentAuto", P)}`;
            embed.description = craftExplan;
            embed.color = 0xccff33;
            m.edit({ embed });

            // Ask for confirmation
            return getYesNo(m, 30000).then(async () => {
              crafter.confirm()
                .then(() => done())
                .catch(e => endNo(e, m));
            }).catch((e) => endNo(e, m));
          }).catch((e) => endNo(e, m));
        });
      }
      /** ----------------------------*\
      |* EVERYTHING AVAILABLE → CRAFT *|
      \**-----------------------------*/
      craftExplan = `\n\n${$t("responses.crafting.materialPresent", P)}`;
      embed.description = gemDisplay + matDisplay + craftExplan;

      // Show craft cost & info
      return msg.channel.send({ embed }).then((m) => {
        embedmsg = m;
        // Ask for confirmation
        return getYesNo(m).then(async () => {
          crafter.confirm()
            .then(() => done())
            .catch(e => endNo(e, m));
        });
      });

      function done() {
        msg.author.crafting = false;
        embed.title = `${(craftedItem?.emoji || "📦") + $t("responses.crafting.craftedItem", P)} x ${amount}`;
        embed.color = 0x78eb87;
        embed.description = "";
        embed.footer = { text: $t("responses.crafting.crafted", P) };

        Progression.emit(`craft.item`, { userID: msg.author.id, item: craftedItem, amount, msg });

        // @ts-ignore
        return embedmsg.edit({ embed });
      }

      function endNo(e, m) {
        msg.author.crafting = false;
        embed.description = gemDisplay + matDisplay;
        if (e === "timeout") {
          return endTimeout(m);
        } if (e === "no") {
          return endCancel(m);
        }
        console.error(" CRAFT ERROR ".bgRed);
        if (e && e.stack) console.error(e.stack);
        throw new Error(e);
      }

      function endMissingMaterials(m, v) {
        msg.author.crafting = false;
        embed.color = 0xed3a19;
        embed.description = `${v || gemDisplay + matDisplay}\n${$t("responses.crafting.materialMissing", P)}`;
        embed.description = embed.description.slice(0, 2047).split("\n");
        embed.description.pop();
        embed.description = embed.description.join("\n");
        if (m) m.edit({ embed });
        else msg.channel.send({ embed });
      }

      function endTimeout(m) {
        embed.color = 0xffd900;
        embed.footer = { text: $t("responses.crafting.timeout", P) };
        m.edit({ embed });
      }

      function endCancel(m) {
        embed.color = 0xdb4448;
        embed.footer = { text: $t("responses.crafting.cancel", P) };
        m.edit({ embed });
      }

      function getYesNo(m, l = 10000) {
        return new Promise(async (resolve, reject) => {

          let response = await YesNo(m, msg, { time: l });

          if (response) resolve();
          if (response === false) reject("no");
          if (!response) reject("timeout");
          reject();
        });
      }
    });
  } catch (e) {
    msg.author.crafting = false;
    msg.channel.send({ embed: { color: 0x000, description: "Something went wrong..." } });
    return console.error(e);
  }
};

module.exports = {
  pub: true,
  argsRequired: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
};
