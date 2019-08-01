const cmd = "background";
const fs = require("fs");
const ECO = require("../../archetypes/Economy.js");

var init = async function(msg, args) {
  let BGBASE = await DB.cosmetics.bgs();

  const P = { lngs: msg.lang, prefix: msg.prefix };

  BGBASE = shuffle(BGBASE);
  let selectedBG = BGBASE.find(bg => {
    if (bg.id === args) return true;
    if (bg.code === args) return true;
    if (args.includes(bg.code)) return true;
    if (msg.args.some(arg => bg.name.toLowerCase().includes(arg))) return true;
    if (msg.args.some(arg => bg.tags.toLowerCase().includes(arg))) return true;
    return false;
  });
  if (!selectedBG) selectedBG = shuffle(BGBASE)[28];

  const embed = new Embed();

  embed.author(
    "Background",
    paths.CDN + "/images/tiers/" + selectedBG.rarity + ".png"
  );
  embed.description = `
   **${selectedBG.name}**
  \`${selectedBG.code}\`
  [${$t("responses.equip.getMoreBG", P)}](${paths.CDN}/bgshop)
  `;
  _price = selectedBG.price || GNums.bgPrices[selectedBG.rarity];
  embed.field(
    $t("terms.price", P),
    selectedBG.buyable && !selectedBG.event
      ? _price
      : "`" + $t("responses.equip.NFSALE", P) + "`",
    true
  );
  embed.field(
    $t("terms.droppable", P),
    selectedBG.droppable ? _emoji("yep") : _emoji("nope") + "x",
    true
  );
  if (selectedBG.event)
    embed.field($t("terms.event", P), "`" + selectedBG.event + "`", true);
  else embed.field("\u200b", "\u200b", true);

  const userData = await DB.users.get(msg.author.id);
  let hasIt = userData.modules.bgInventory.includes(selectedBG.code);
  let affordsIt = await ECO.checkFunds(msg.author, _price);
  let canBuy = selectedBG.buyable && !selectedBG.event;
  if (hasIt) {
    embed.field("\u200b", $t("responses.equip.equipOwned", P), false);
  } else {
    if (selectedBG.buyable && !selectedBG.event) {
      if (affordsIt) embed.field("\u200b", $t("responses.equip.buyThisBG", P));
      else embed.field("\u200b", $t("interface.generic.cantAfford", P));
    }
  }

  let imageLink = paths.CDN + "/backdrops/" + selectedBG.code + ".png";
  const Picto = require(appRoot + "/core/utilities/Picto");
  embed.setColor(await Picto.avgColor(imageLink));
  embed.image(imageLink);
  const YesNo = require("../../structures/YesNo");
  msg.channel.send({ embed }).then(async m => {
    async function positive(cancellation) {
      if (!hasIt && affordsIt) {
        await ECO.pay(msg.author.id, _price, "bgshop_bot", "RBN");
      }
      if (!affordsIt) return cancellation();
      await DB.users.set(
        { id: msg.author.id },
        {
          $set: {
            "modules.bgID": selectedBG.code
          },
          $addToSet: {
            "modules.bgInventory": selectedBG.code
          }
        }
      );
    }

    if (!hasIt && affordsIt && canBuy) {
      YesNo(m, msg, positive, null, null, {
        strings: {
          cancel: $t("interface.generic.cancel", P),
          confirm: $t("responses.equip.successBG", P),
          timeout: $t("interface.generic.timeout", P)
        }
      });
    }
  });
};

module.exports = {
  pub: true,
  cmd: cmd,
  perms: 3,
  init: init,
  cat: "cosmetics",
  aliases: ["bg", "backdrop", "equip"]
};
