const init = async (msg, args) => {
  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();

  return {
    embed: {
      description: inventory.map((it) => `${it.emoji} **${it._id}** Packed by <@${it.creator}>`).join("\n"),
    },
  };
};

module.exports = {
  init,
  argsRequired: false,
  aliases: ["inv"],
};
