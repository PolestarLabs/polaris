const Redeem = require("../../archetypes/Redeem");
const YesNo = require("../../structures/YesNo");


const init = async (msg, args) => {
  const P = {lngs:msg.lang};
  const code = args[0];
  const prizeOperator = new Redeem(code, msg.author.id);
  
  
  // LOCK when single-use (implicit or explicit)

  await prizeOperator.hydrate();
  const validationError = prizeOperator.verify();
  
  const validationResponse = (validationError) => {
    switch (validationError) {
      case "invalid":
        return msg.reply(`${_emoji("nope")} Oopsie! This code is invalid. Please double-check it and try again.`);
      case "nonredeemable":
        return msg.reply(`${_emoji("nope")} This code is not redeemable anymore.`);
      case "already_redeemed":
        return msg.reply(`${_emoji("nope")} You've already redeemed this code`);
      case "exhausted":
        return msg.reply(`${_emoji("nope")} This code has been used the maximum amount of times.`);
      case "expired":
        return msg.reply(`${_emoji("nope")} This code redeem period is over.`);
      case "locked":
        return msg.reply(`${_emoji("nope")} This code is not redeemable at the moment. Please try again later.`);
    }
  }
  
  if (validationError) return validationResponse(validationError);

  if (!prizeOperator.data.maxUses || prizeOperator.data.maxUses === 1 ) await prizeOperator.lock();



  //TRANSLATE[epic=translations] redeem

  await msg.delete();
  const prize = prizeOperator.parsePrize();
  P.count = prize.amount;
  
  const embed = {
    fields: [
      {
        name: "Here's what you get by redeeming this code:",
        value: `• ${ $t(prize.keyword,P) } x  ${prize.amount} ${_emoji(prize.subject)}\n\n Do you wish to proceed?`
      }
    ],
    footer: {
      text: `${msg.author.username}#${msg.author.discriminator}`,
      icon_url: msg.author.avatarURL
    },
    color: 0x1B1B2B
  };
  const confirmation = await msg.channel.send({
    content: "So you got a gift code to redeem? How dandy!",
    embed
  });

  const prompt = await YesNo(confirmation, msg);
  

  if (prompt) {
    await prizeOperator.hydrate();
    const validationError = prizeOperator.verify();
    if (validationError) return validationResponse(validationError);

    const newEmbed = {
      fields: [
        {
          name: "Good! The items were added to your inventory",
          value: `> ${ $t(prize.keyword,P) } x  ${prize.amount} ${_emoji(prize.subject)}`
        }
      ],
      footer: {
        text: `${msg.author.username}#${msg.author.discriminator}`,
        icon_url: msg.author.avatarURL
      },
      color: 0x1B1B2B
    };

    const result = await prizeOperator.redeem(msg.author.id, prizeOperator.prize);
    
    if (result && result.type === 'background') newEmbed.image = {url: `${paths.CDN}/backdrops/${result.code||result.id}.png`};
    if (result && result.type === 'medal') newEmbed.image = {url: `${paths.CDN}/medals/${result.icon||result.id}.png`};
    if (result && result.type === 'sticker') newEmbed.image = {url: `${paths.CDN}/stickers/${result.id}.png`};
    
    
    await confirmation.edit({
      embed: newEmbed,
      content: ""
    });

  } else if (!prompt) { // unlock code in timeout/cancel
    await prizeOperator.unlock();
  }
};

module.exports = {
  init,
  cmd: "redeem",
  cat: "inventory",
  argsRequired: true,
  pub: false,

};
