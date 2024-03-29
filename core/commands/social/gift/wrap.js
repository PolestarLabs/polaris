const ButtonCollector = require("../../../structures/ButtonCollector.js")("createRogue");
const {ITEM_TYPES} = require("./_meta.js");
const randomShitGenerator = require("../../../utilities/randomGenerator");

const init = async (msg, args) => {

  //if (msg.guild.id !== '789382326680551455') return "Wrapping gifts is disabled for the next few hours.";
  
  let selectedItemType = ITEM_TYPES.find(type=>{
    const query = args[0].toLowerCase();
    return type.type === query || type.aliases.includes(query);    
  });

  if (!selectedItemType) {
    return {embed:{
      color: numColor(_UI.colors.red),
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
  

  let buttonWraps = createWrapChoices();
  const row2 = [
    {
      type: 2,
      style: 4,
      emoji: { id: _emoji('nope').id },
      custom_id: "giftMakeCancel",    
    },
    {
      type: 2,
      style: 1,
      emoji: { name:"🔁" },
      custom_id: "rerollWraps",
    }
  ]

 
  const components = [{type:1, components: buttonWraps},{type:1, components: row2}];


  const menuMessage = await msg.channel.send({
    content: "**Choose your wrapping**",
    components
  });
  
  const wrappingCollector = menuMessage.createButtonCollector(c=>c.userID === msg.author.id, {
    //maxMatches:1,
    time:25e3,
    removeButtons: 1,
  });

  wrappingCollector.on("click", async ({interaction,id}) => {
    if (id === 'rerollWraps') {
      const newWraps = createWrapChoices();
      return menuMessage.setButtons([newWraps,row2]);
    }
    if (id === 'giftMakeCancel') return msg.channel.send( `${_emoji('nope')} Gift creation cancelled.` );
    wrappingCollector.stop("action");
    
    await wait(.5);
    await menuMessage.edit(`${id}`);
    const noteMessage = await interaction.followup({
      content: "**Please add a message to your gift!**\n*(Once you wrap it you can't see it anymore!)*"
    });
    const responses = await msg.channel.awaitMessages((msg2) => {
      const res = msg2.author.id === msg.author.id;
      if (res) msg2.delete().catch(e=>null);
      return res;
    }, {
      maxMatches: 1,
      time: 30e3,
    });

    PLX.deleteMessage(msg.channel.id,noteMessage.id).catch(e=>null);
    giftItem.message = responses.length > 0 ? responses[0].content : null;
    giftItem.friendlyID = randomShitGenerator(["adjective","color",["animal","fruit"],"number"]);
    giftItem.emoji = id;

    const confirmation = await interaction.followup(
      {
        content: "This is how your gift will look like when opened. Confirm if the message should be private or open.",
        flags: 64, 
        embed: {
          title: "Gift Preview",
          description: `\n*\`\`\`${giftItem.message}\`\`\`*`,
          thumbnail: { url: `https://cdn.discordapp.com/emojis/${id.replace(/[^0-9]/g,'')}.png` },
          image: { url: `${paths.CDN}/${giftItem.type}s/${giftItem.item}.png` },
        },
        components: [{
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                emoji: { id: _emoji('yep').id },
                label: "Make message open",
                custom_id: "giftMakePublic"
              },
              {
                type: 2,
                style: 2,
                emoji: { id: _emoji('yep').id },
                label:  "Make message private",
                custom_id: "giftMakePrivate"
              },
              {
                type: 2,
                style: 4,
                emoji: { id: _emoji('nope').id },
                label:  "Cancel",
                custom_id: "giftMakeCancel"
              }
            ]
        }]         
      }
    );

    const ephCollector = ButtonCollector(
      confirmation,
      r=>r.userID === msg.author.id,
      { time: 50e3, maxMatches: 1 }
    );
    
    ephCollector.once("click", async ({interaction,id}) => {
      if (id === 'giftMakeCancel') return msg.channel.send( `${_emoji('nope')} Gift creation cancelled.` );
      if (id === 'giftMakePrivate') giftItem.private = true;
      await DB.users.set(msg.author.id, destroystring);
      await DB.gifts.set(Date.now(), giftItem);
      Progression.emit("action.gift.pack", { msg, value: 1, userID: msg.author.id });
      msg.channel.send( `${_emoji('yep')} **Done!** Gift wrapped and ready to be delivered. This gift's ID is: ${id} \`${giftItem.friendlyID}\`` );
    })
    
    //return msg.reply(".",{file:JSON.stringify({ giftItem },0,2),name:'test.json'});
  })
 

 
}

function createWrapChoices(){
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

  const buttonWraps = wrapChoices.map(wrap=>{
    return {
      type: 2,
      style: 2,
      emoji: {id: wrap.id},
      custom_id: wrap,
    }
  });
  return buttonWraps;
}