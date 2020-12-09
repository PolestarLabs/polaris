const init = async (msg, args) => {
  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();

  if (inventory.length < 1) return "No gifts to be opened!";

  const userData = await DB.users.get(msg.author.id);
  const gift = inventory[Number(args[1] || 1) - 1 || inventory.length - 1];

  const giftMetadata = {};
  let metadata;
  switch (gift.type) {
    case "background":
      metaData = await DB.cosmetics.get({ code: gift.item });
      giftMetadata.name = metaData.name;
      giftMetadata.rarity = metaData.rarity;
      giftMetadata.inv = "bgInventory";
      giftMetadata.img = `${paths.CDN}/backdrops/${gift.item}.png`;
      break;
    case "medal":
      metaData = await DB.cosmetics.get({ icon: gift.item });
      giftMetadata.name = metaData.name;
      giftMetadata.rarity = metaData.rarity;
      giftMetadata.inv = "medalInventory";
      giftMetadata.thumb = `${paths.CDN}/medal/${gift.item}.png`;
      break;
    case "sticker":
      metaData = await DB.cosmetics.get({ id: gift.item });
      giftMetadata.name = metaData.name;
      giftMetadata.rarity = metaData.rarity;
      giftMetadata.inv = "stickerInventory";
      giftMetadata.img = `${paths.CDN}/stickers/${gift.item}.png`;
      break;
    case "item":
      metaData = await DB.items.get({ id: gift.item });
      giftMetadata.name = metaData.name;
      giftMetadata.rarity = metaData.rarity;
      giftMetadata.inv = "inventory";
      giftMetadata.thumb = `${paths.CDN}/items/${gift.item}.png`;
      break;
    case "gems":
      giftMetadata.name = gift.item[2];
      giftMetadata.rarity = gift.item[1];
      giftMetadata.inv = gift.item[0];
      // giftMetadata.thumb
      break;
  }

  const emojiId = gift.emoji.replace(">", "").split(":")[2].trim();

  if (gift.type != "item" && gift.type != "gems") {
    if (!userData.modules[giftMetadata.inv].includes(gift.item)) {
      await DB.gifts.remove({ _id: gift._id });
      await DB.users.set(msg.author.id, { $addToSet: { [`modules.${giftMetadata.inv}`]: gift.item } });

      return {
        embed: {
          color: 0x7dffff,
          description: `Opened ${gift._id}
                    Contents: ${gift.type}
                    **${giftMetadata.rarity}** ${giftMetadata.name}
                    Message:*\`\`\`
${gift.message || "- - -"}
                    \`\`\`*
                    `,
          thumbnail: { url: `https://cdn.discordapp.com/emojis/${emojiId}.png` },
          image: giftMetadata.img ? { url: giftMetadata.img } : null,
        },
      };
    }
    return "You can't open this gift because you already own the contents!"; // TODO translate
  }
};

module.exports = {
  init,
  argsRequired: false,
  aliases: ["op", "unwrap"],
};
