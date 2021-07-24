const INVENTORY = require("../../archetypes/Inventory");
const GENERATOR = require("../cosmetics/lootbox_generator.js");

const INVOKERS = new Map();
const INV_STATUS = new Map();


const createInventoryEmbed = function createInventoryEmbed(Inventory, { author, lang = "en", prefix = "p!" }) {
  const embed = { color: 0xd14362, thumbnail: { url: `${paths.CDN}/build/LOOT/lootbox_trans_80.png` } };
  embed.description = Inventory.length > 0
    ? Inventory.slice(0,25).map((i) => `${_emoji(i.rarity)} ${_emoji(i.emoji || i.emoji_alt)} **${i.name}** × ${i.count} \`${prefix}open box ${i.rarity}\``).join("\n")
    : `*${rand$t("responses.inventory.emptyJokes", { lngs: lang })}*`;

  embed.footer = {
    text: author.tag,
    icon_url: author.avatarURL,
  };

  return embed;
}



const init = async function (msg, args, reactionMember) {
  const reactionUserID = reactionMember?.id || reactionMember;

  if (reactionUserID && args[10]?.id != reactionUserID && reactionUserID !== msg.author.id) return "Only the owner can see inside";
  msg.lang = msg.lang || [msg.channel.LANG || "en", "dev"];

  const userInventory = new INVENTORY(reactionUserID || msg.author.id, "box");
  const Inventory = await userInventory.listItems(args[10]);

  const embed = createInventoryEmbed(Inventory, msg)

  args[0] = msg;
  args[1] = Inventory.map((i) => i.rarity);
  INV_STATUS.set(reactionUserID || msg.author.id, args[1]);

  const response = {
    content: `${_emoji("LOOTBOX")} ${$t("responses.inventory.browsingBox", { lngs: msg.lang })}`,
    embed,
    components: [{
      type: 1, components:
        ["C", "U", "R", "SR", "UR"].map(rar => {
          return {
            type: 2,
            style: 2,
            emoji: { id: _emoji(rar).id },
            label: $t(`keywords.${rar}`, { lngs: msg.lang }),
            custom_id: `openBox:${rar}:${msg.author.id}:${msg.lang[0]}`,
            disabled: !Inventory.some(i => i.rarity === rar)
          }
        })
    }]
  };

  if (reactionUserID) return response;
  const res = await msg.channel.send(response);
  INVOKERS.set(msg.author.id, res.id);
  return res;
};

const open = async function (msg, args, memberObj) {
  const userID = memberObj?.id || memberObj;
  args = args.map((a) => (typeof a === "string" ? a.toUpperCase() : a));

  INVOKERS.delete(userID || msg.author.id);
  INV_STATUS.delete(userID || msg.author.id);

  if (userID && msg.author.id != userID) return "Only the owner can see inside";

  const userInventory = new INVENTORY(userID || msg.author.id, "box");
  const Inventory = await userInventory.listItems();
  const selectedBox = Inventory.find((bx) => bx.rarity === args[0]);

  if (!selectedBox) return $t("responses.inventory.noSuchBox", { lngs: msg.lang });
  this.hooks = GENERATOR.hooks;
  return GENERATOR.init(msg, { boxID: selectedBox.id }).catch(console.error);
};

const reactionOption = (rar) => ({
  emoji: _emoji(rar).reaction,
  type: "cancel",
  response: (msg, args, uid) => open(args[0], [rar, args[1]], uid),
  filter: (msg, emj, uid) => INVOKERS.get(uid.id || uid) === msg.id && INV_STATUS.get(uid.id || uid).includes(rar), // && !LOOTING.get(uid)
});

module.exports = {
  init,
  open,
  pub: true,
  cmd: "lootbox",
  perms: 3,
  cat: "inventory",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["box", "boxes"],
  autoSubs: [
    {
      label: "open",
      gen: open,
      options: {
        argsRequired: true,
        invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "lootbox", opt: "cosmetics" }); },
      },
    },
  ],
  //reactionButtons: ["C", "U", "R", "SR", "UR"].map(reactionOption),
  createInventoryEmbed
};
