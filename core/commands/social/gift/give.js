const init = async (msg, args) => {
  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();
  const target = msg.mentions[0]?.id;

  const P = {
    lngs: msg.lang, prefix: msg.prefix, target, sender: msg.author.id, count: inventory.length,
  };

  if (inventory.length < 1) return $t("responses.gift.invEmptyGive", P);
  if (!target) return $t("responses.gift.noTarget", P);
  if (target == msg.author.id) return $t("responses.gift.noSelf", P);

  if (!args[1] && inventory.length == 1) args[1] = 1;
  if (inventory.length > 1 && !(args[1] = Number(args[1]))) return $t("responses.gift.inv>1", P);
  if (inventory.length < args[1]) return $t("responses.gift.inv<amt", P);

  const gift = inventory[args[1] - 1];

  const update = { $set: { holder: target } };
  if (msg.author.id !== gift.creator && !gift.previous?.includes(msg.author.id)) update.$push = { previous: msg.author.id };
  await DB.gifts.updateOne({ _id: gift._id }, update);

  const emojiID = gift.emoji.replace(">", "").split(":")[2].trim();

  return {
    embed: {
      color: 0x6a44b9,
      description: $t("responses.gift.sent", P),
      thumbnail: { url: `https://cdn.discordapp.com/emojis/${emojiID}.png` },
    },
  };
};

module.exports = {
  init,
  argsRequired: false,
  aliases: ["send"],
};
