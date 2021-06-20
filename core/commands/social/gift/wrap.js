const ReactionMenu = require("../../../structures/ReactionMenu");
const {ITEM_TYPES} = require("./_meta.js");


const init = async (msg, args) => {

  if (msg.guild.id !== '789382326680551455') return "Temp. Disabled. Try again in 24hs";
  
  let selectedItemType = ITEM_TYPES.find(type=>{
    const query = args[0].toLowerCase();
    return type.type === query || type.aliases.includes(query);    
  });

  if (!selectedItemType) {
    return {embed:{
      color: 0xF02540,
      description: `**Item Type Invalid.** Valid types are:\n ${
        ITEM_TYPES.map(type=> ` • ${capitalize(type.type)} (${
          type.aliases.map(a=> `\`${a}\``).join(', ')
        })` ).join('\n')
      }`
    }}
  }
  
  const itemId = args[1];
  const userData = await DB.users.getFull({ id: msg.author.id });

  const destroystring = {};
  const giftItem = {
    creator: msg.author.id,
    holder: msg.author.id,
  };

  //if (!itemTypes.includes(itemType)) { return `You can only wrap one of the following types: ${itemTypes.map((s, i, a) => `${s}${i == a.length ? "" : ", "}`)}`; }
  
  if (!itemId) return `What \`${selectedItemType.type}\` are you trying to wrap?`;

  const selectedItemData = await DB[selectedItemType.database].findOne({[selectedItemType.finder]: itemId});
  

  
  if (!selectedItemData)  return `This \`${selectedItemType.type}\` couldn't be found.`;


  if ( !userData.modules[selectedItemType.inventory]?.includes(itemId) ) 
    return `You do not own this \`${selectedItemType.type}\`!`; 
  if ( selectedItemData?.tradeable === false )
    return "This background cannot be gifted.";
  if ( userData.modules[selectedItemType.equipSlot] === itemId || userData.modules[selectedItemType.equipSlot]?.includes(itemId) )
    return "Unequip this before gifting.";
  

  giftItem.item = itemId;
  giftItem.type = selectedItemType.type;
  destroystring.$pull = { [`modules.${selectedItemType.inventory}`]: itemId };

  if (args[2] === '-dbg'){
   return msg.reply(".",{file:JSON.stringify({giftItem,destroystring,selectedItemData,selectedItemType},0,2),name:'test.json'});
  }

  await createGiftWrap(msg, giftItem, destroystring);

};

module.exports = {
  init,
  caseInsensitive: true,
  argsRequired: true,
  aliases: ["wp"],
};


async function createGiftWrap(msg, giftItem, destroystring) {
  const wrapChoices = shuffle([
    _emoji("gift_Y_S"),
    _emoji("gift_Y_R"),
    _emoji("gift_Y_B"),
    _emoji("gift_R_S"),
    _emoji("gift_R_R"),
    _emoji("gift_R_B"),
    _emoji("gift_P_S"),
    _emoji("gift_P_R"),
    _emoji("gift_P_B"),
  ]).slice(0, 4);

  const menuMessage = await msg.channel.send("**Choose your wrapping**");
  const res = await ReactionMenu(menuMessage, msg, wrapChoices, { time: 10000 });

  const emoji = res ? wrapChoices[res.index] : shuffle(wrapChoices)[0];

  giftItem.emoji = emoji;

  menuMessage.edit(`${emoji}`);
  const noteMessage = await msg.channel.send("**Please add a message to your gift!**\n*(Once you wrap it you can't see it anymore!)*");
  const responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id, {
    maxMatches: 1,
    time: 30e3,
  });

  menuMessage.delete();
  giftItem.message = responses.length > 0 ? responses[0].content : null;
  noteMessage.edit(
    {
      content: "\u200b",
      embed: {
        description: `*\`\`\`${giftItem.message}\`\`\`*`,
        thumbnail: { url: `https://cdn.discordapp.com/emojis/${emoji.id}.png` },
      },
    }
  );

  if (responses[0])
    responses[0].delete();

  await DB.users.set(msg.author.id, destroystring);
  Progression.emit("action.gift.pack", { msg, value: 1, userID: msg.author.id });
  await DB.gifts.set(Date.now(), giftItem);
  msg.addReaction(_emoji("yep").reaction);
}

