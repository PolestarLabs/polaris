const Redeem = require("../../archetypes/Redeem");

const init = async (msg, args) => {
  const code = args[0];
  const prizeOperator = new Redeem(code, msg.author.id);
  const invalid = await prizeOperator.verify();

  if (invalid) {
    switch (invalid) {
      case "invalid":
        return msg.reply(`${_emoji("NOPE").no_space} Oopsie! This code is invalid. Please double-check it and try again.`);
      case "locked":
        return msg.reply(`${_emoji("NOPE").no_space} This code is not redeemable at the moment. Please try again later.`);
      case "nonredeemable":
        return msg.reply(`${_emoji("NOPE").no_space} This code is not redeemable anymore.`);
      case "already_exists":
        return msg.reply(`${_emoji("NOPE").no_space} You've already redeemed this code`);

    }
  }

  //TRANSLATE[epic=translations] redeem

  await msg.delete();
  const prize = prizeOperator.prize.split(" ");
  const embed = {
    fields: [
      {
        name: "Here's what you get by redeeming this code:",
        value: `• ${prize[0]}x ${prize[1]} ${_emoji(prize[2]).no_space}\n\nYou want to proceed?`
      }
    ],
    footer: {
      text: `${msg.author.username}#${msg.author.discriminator}`,
      icon_url: msg.author.avatarURL
    },
    color: 0x1B1B2B
  };
  const confirmation = await msg.channel.send({
    content: "So you got a gift code to redeem? How nice!",
    embed
  });
  const prompt = await prizeOperator.prompt(confirmation, msg);

  if (prompt) {
    const prize = prizeOperator.prize.split(" ");
    const newEmbed = {
      fields: [
        {
          name: "Good! The items were added to your inventory",
          value: `> ${prize[0]}x ${prize[1]} ${_emoji(prize[2]).no_space}`
        }
      ],
      footer: {
        text: `${msg.author.username}#${msg.author.discriminator}`,
        icon_url: msg.author.avatarURL
      },
      color: 0x1B1B2B
    };

    await prizeOperator.redeem(msg.author.id, prizeOperator.prize);
    await confirmation.edit({
      embed: newEmbed,
      content: ""
    });

  } else if (!prompt) { // unlock code in timeout/cancel
    await DB.promocodes.collection.updateOne({ code }, {
      $set: { locked: false }
    });
  }
};

module.exports = {
  init,
  cmd: "redeem",
  argsRequired: true
};
