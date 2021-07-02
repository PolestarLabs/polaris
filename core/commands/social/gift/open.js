const {ITEM_TYPES} = require("./_meta.js");

const init = async (msg, args) => {
  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();

  if (inventory.length < 1) return "No gifts to be opened!";

  const userData = await DB.users.get(msg.author.id);
  const gift = inventory.find(g=>g.friendlyID?.toLowerCase() == args[0]?.toLowerCase()) || inventory[Number(args[0] || 1) - 1 || inventory.length - 1];

  const giftMetadata = ITEM_TYPES.find(t=>t.type===gift.type);
  const dbItemData = await DB.cosmetics.get({[giftMetadata.finder]:gift.item});

  if (!dbItemData) return _emoji('nope') + " Invalid Item";

  switch (gift.type) {
    case "background":
      giftMetadata.name = dbItemData.name;
      giftMetadata.rarity = dbItemData.rarity;
      giftMetadata.img = `${paths.CDN}/backdrops/${gift.item}.png`;
      break;
    case "medal":
      giftMetadata.name = dbItemData.name;
      giftMetadata.rarity = dbItemData.rarity;
      giftMetadata.thumb = `${paths.CDN}/medal/${gift.item}.png`;
      break;
    case "sticker":
      giftMetadata.name = dbItemData.name;
      giftMetadata.rarity = dbItemData.rarity;
      giftMetadata.img = `${paths.CDN}/stickers/${gift.item}.png`;
      break;
    case "item":
      giftMetadata.name = dbItemData.name;
      giftMetadata.rarity = dbItemData.rarity;
      giftMetadata.thumb = `${paths.CDN}/items/${gift.item}.png`;
      break;
    case "gems":
      giftMetadata.name = gift.item[2];
      giftMetadata.rarity = gift.item[1];
      giftMetadata.inventory = gift.item[0];
      // giftMetadata.thumb
      break;
  }

  const emojiId = gift.emoji?.replace(/[^0-9]/g, "") || "648769995613929472";

  if (gift.type != "item" && gift.type != "gems") {
    if (!userData.modules[ giftMetadata.inventory].includes(gift.item)) {
      
      if (!msg.content.includes('--dry-run')){
        await DB.gifts.remove({ _id: gift._id });
        if ( ![gift.creator,gift.holder].includes(msg.author.id) ) 
          Progression.emit("action.gift.open", { msg, value: 1, userID: msg.author.id });
          
        await DB.users.set(msg.author.id, { $addToSet: { [`modules.${ giftMetadata.inventory}`]: gift.item } });
      }

      const giftContents = await msg.channel.send({
        embed: {
          color: 0x7dffff,
          description: `Gift **${gift.friendlyID || gift._id}** sent by <@${gift.previous||gift.creator}>\n\n`+
            `Contents: \`${gift.type}\`\n${
              _emoji(giftMetadata.rarity)} **${giftMetadata.name
            }**\n\nMessage Attached:\n*\`\`\`\n${
              (gift.private ? "--This gift's message is private--" : gift.message) || "- - -"
            }\`\`\`*`,
          thumbnail: { url: `https://cdn.discordapp.com/emojis/${emojiId}.png` },
          image: giftMetadata.img ? { url: giftMetadata.img } : null,
        },
      });

      if (gift.private){
        await giftContents.setButtons([{label:"Check private content",custom_id:"chkPrivate"}]);
        await giftContents.awaitButtonClick(({interaction,userID})=>{
          console.log({userID})
            if (userID === msg.author.id){
              interaction.followup({
                content: "This message will never be shown again. If the contents of it are important, be sure to save it.",
                flags: 64,
                embed: {
                  description: `*\`\`\`\n${ gift.message || "- - -" }\`\`\`*`
                }
              });
              return true;
            } else{
              return false;
            }
        },{
          time: 60e3,
          maxMatches: 1
        }).catch(() => null);
      }

    }else{
      return "You can't open this gift because you already own the contents!"; // TRANSLATE[epic=translations] open
    }
  }
};

module.exports = {
  init,
  argsRequired: false,
  aliases: ["op", "unwrap"],
};
