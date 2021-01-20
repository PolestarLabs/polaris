// TRANSLATE[epic=translations] fragment

const FragConvert = function FragConvert(item) {
  let multi = 1;
  if (item.type === "medal") multi = 1;
  if (item.type === "background") multi = 1.5;
  if (item.type === "sticker") multi = 2;
  const ruler = {
    C: 10, U: 20, R: 30, SR: 40, UR: 50, XR: 100,
  };
  return Math.ceil(ruler[item.rarity] * multi);
};

const init = async (msg, args) => {
  const P = { lngs: msg.lang };

  let itemType = args[0];
  if (!["bg", "background", "medal", "sticker"].includes(itemType)) return msg.command.invalidUsageMessage(msg);
  itemType = itemType === "bg" ? "background" : itemType;

  const userData = await DB.users.getFull({ id: msg.author.id });
  let BASE; let inventory; let param;

  if (itemType === "background") {
    BASE = await DB.cosmetics.find({ type: "background", code: { $in: userData.modules.bgInventory } });
    inventory = "bgInventory";
    param = "code";
  }
  if (itemType === "medal") {
    BASE = await DB.cosmetics.find({ type: "medal", icon: { $in: userData.modules.medalInventory } });
    inventory = "medalInventory";
    param = "icon";
  }
  if (itemType === "sticker") {
    BASE = await DB.cosmetics.find({ type: "sticker", id: { $in: userData.modules.stickerInventory } });
    inventory = "stickerInventory";
    param = "id";
  }

  const Target = args[1];

  if (!Target) return "specify target";

  msg.author.crafting = true;

  let targetItem;
  if (Target) targetItem = BASE.find((x) => x[param] === Target);
  if (Target === "last") targetItem = BASE.find((x) => x[param] === userData.modules[inventory][userData.modules[inventory].length - 1]);

  console.log(
    { Target, inventory, targetItem }, userData.modules[inventory][userData.modules[inventory].length - 1], userData.modules[inventory].length,
  );

  if (userData.modules[inventory].includes(targetItem[param])) {
    P.rarity_emoji = _emoji(targetItem.rarity);

    let endpoint;

    switch (targetItem.type) {
      case "background":
        endpoint = "backdrops";
        break;
      case "sticker":
        endpoint = "stickers";
        break;
      case "medal":
        console.log("aaa");
        endpoint = "medals";
        break;
      default: throw new RangeError(`Unexpected input: ${targetItem.type}`);
    }

    P.count = 1;
    P.itemType = $t(`keywords.${targetItem.type}`, P);
    P.count = FragConvert(targetItem);
    const fragAmt = P.count;
    P.itemName = targetItem.name;

    console.log(`${paths.CDN}/${endpoint}/${targetItem[param]}.png`);
    const embed = new Embed()
      .thumbnail(`${paths.CDN}/${endpoint}/${targetItem[param]}.png`)
      .description(`
        ${$t("interface.synthfrag.disenchant", P)}
        \`Code:\`\u200b***\`${targetItem[param]}\`***
        `)
      .color("#6e59dd")
      .image(`${paths.CDN}/build/assorted/frag.png??????`)
      .footer(msg.author.tag, msg.author.avatarURL);

    const YesNo = require("../../structures/YesNo");
    return msg.channel.send({ embed }).then((m) => {
      positive = async () => {
        if (targetItem.type === "background") DB.users.set(msg.author.id, { $pull: { "modules.bgInventory": targetItem.code } });
        if (targetItem.type === "sticker") DB.users.set(msg.author.id, { $pull: { "modules.stickerInventory": targetItem.id } });
        if (targetItem.type === "medal") DB.users.set(msg.author.id, { $pull: { "modules.medalInventory": targetItem.icon } });

        userData.addItem("cosmo_fragment", fragAmt);

        msg.reply("ok1");
      };

      YesNo(m, msg, positive, null, null, {
        strings: {
          cancel: "Cancel",
          confirm: "OK",
          timeout: "Timeout",
        },
      }).then(() => (msg.author.crafting = false));
    });
  }
  return "nope";
};
module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "fragment",
  perms: 3,
  cat: "cosmetics",
  argsRequired: true,
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["frag"],
};
