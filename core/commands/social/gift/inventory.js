const init = async (msg, args) => {
  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();
  const P = { lngs: msg.lang, prefix: msg.prefix };

  if (!inventory?.length) {
    return {
      color: 0xc776c5,
      embed: { description: $t("responses.gift.invEmpty", P) },
    };
  }

  let description = "";
  inventory.map((it, ind) => {
    description += `\n**${++ind}. ${it.emoji} ${it.friendlyID||it._id}** Packed by <@${it.creator}>`;
    if (it.previous?.length) {
      description += `\nPrevious owner(s): ${it.previous.map((prev, ind, arr) => `<@${prev}>${ind == arr.length - 1 ? "" : ", "}`).join("")}`;
    }
  });

  return { embed: { color: 0xc776c5, description } };
};

module.exports = {
  init,
  argsRequired: false,
  aliases: ["inv","list","ls","i"],
};
