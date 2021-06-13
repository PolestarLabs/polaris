const cmd = "background";
const ECO = require("../../archetypes/Economy.js");

const { BackgroundPrices } = require("@polestar/constants/shop");
const Picto = require("../../utilities/Picto");
const YesNo = require("../../structures/YesNo");

const isEventBG = (bg) => (bg.event && bg.event !== "none");

const init = async (msg, args) => {
  let BGBASE = await DB.cosmetics.bgs();

  const P = { lngs: msg.lang, prefix: msg.prefix };

  BGBASE = shuffle(BGBASE);
  let selectedBG = BGBASE.find((bg) => {
    if (bg.id === args) return true;
    if (bg.code === args) return true;
    if (args.includes(bg.code)) return true;
    if (msg.args.some((arg) => bg.name.toLowerCase().includes(arg))) return true;
    if (msg.args.some((arg) => (bg.tags || "").toLowerCase().includes(arg))) return true;
    return false;
  });
  if (!selectedBG) [,,,,,,,,,,,,,,,,,,,,,,,,,,,, selectedBG] = shuffle(BGBASE);

  const embed = new Embed();

  embed.author(
    "Background",
    `${paths.CDN}/images/tiers/${selectedBG.rarity}.png`,
  );
  embed.description = `
   **${selectedBG.name}**
  \`${selectedBG.code}\`
  [${$t("responses.equip.getMoreBG", P)}](${paths.DASH}/bgshop)
  `;
  const _price = selectedBG.price || BackgroundPrices[selectedBG.rarity];

  embed.field(
    $t("terms.price", P),
    selectedBG.buyable && !isEventBG(selectedBG)
      ? _price
      : `\`${$t("responses.equip.NFSALE", P)}\``,
    true,
  );
  embed.field(
    $t("terms.droppable", P),
    selectedBG.droppable ? _emoji("yep") : `${_emoji("nope")}`,
    true,
  );
  if (isEventBG(selectedBG)) embed.field($t("terms.event", P), `\`${selectedBG.event}\``, true);
  else embed.field("\u200b", "\u200b", true);

  const userData = await DB.users.get(msg.author.id);
  if (!userData) return "User Not Registered";
  
  const hasIt = userData.modules.bgInventory.includes(selectedBG.code);
  const affordsIt = await ECO.checkFunds(msg.author, _price);
  const canBuy = selectedBG.buyable && !isEventBG(selectedBG);
  if (hasIt) {
    embed.field("\u200b", $t("responses.equip.equipOwned", P), false);
  } else if (selectedBG.buyable && !isEventBG(selectedBG)) {
    if (affordsIt) embed.field("\u200b", $t("responses.equip.buyThisBG", P));
    else embed.field("\u200b", $t("interface.generic.cantAfford", P));
  }

  const imageLink = `${paths.CDN}/backdrops/${selectedBG.code}.png`;

  embed.setColor(await Picto.avgColor(imageLink));
  embed.image(imageLink);

  return msg.channel.send({ embed }).then(async (m) => {
    async function positive(cancellation) {
      if (hasIt) {
        return DB.users.set({ id: msg.author.id }, { $set: { "modules.bgID": selectedBG.code } });
      }
      if (!hasIt && affordsIt) {
        await ECO.pay(msg.author.id, _price, "bgshop_bot");
      }
      if (!affordsIt) return cancellation();
      return DB.users.set({ id: msg.author.id },
        { $set: { "modules.bgID": selectedBG.code }, $addToSet: { "modules.bgInventory": selectedBG.code } }).then(() => {});
    }

    if (hasIt || (affordsIt && canBuy)) {
      YesNo(m, msg, positive, null, null, {
        strings: {
          cancel: $t("interface.generic.cancel", P),
          confirm: $t("responses.equip.successBG", P),
          timeout: $t("interface.generic.timeout", P),
        },
      });
    }
  });
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
  aliases: ["bg", "backdrop", "equip"],
  botPerms: ["attachFiles", "embedLinks"],
};
