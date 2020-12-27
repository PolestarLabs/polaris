const yesNo = require("../../structures/YesNo");

const init = async (msg, args) => {
  const code = args[0];
  const lookup = await DB.promocodes.findOne({ code });
  if (!lookup) return msg.reply(`${_emoji("NOPE").no_space} Invalid code. Double-check and try again.`);
  await msg.delete();
  const prize = lookup.prize.split(" ");
  const confirmation = await msg.channel.send(`You got a code? How nice! Here is what you're about to win:\n • ${prize[0]}x ${prize[1]} ${_emoji(prize[2]).no_space}\n\nYou want to proceed?`);
  const resp = await yesNo(confirmation, msg);

  if (resp) {
    const userData = await DB.users.getFull(msg.author.id);
    const lookup = await DB.promocodes.findOne({ code });
    if (!lookup) return msg.reply("whoopsie oopsie... you took too long and someone claimed the prizes before you!")
    await userData.addItem(`${prize[1]}_${prize[2]}_O`, Number(prize[0]));
    msg.channel.send(`${_emoji("YEP").no_space} Great! The items were added to your inventory.`);
    await confirmation.delete();
    await DB.promocodes.collection.deleteOne({ code });

  } else if (!resp) {
    await confirmation.edit(`${_emoji("NOPE").no_space} Alright, cancelled.`);
  }
};

module.exports = {
  init,
  cmd: "redeem",
  argsRequired: true
};
