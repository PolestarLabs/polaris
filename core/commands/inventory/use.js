// TRANSLATE[epic=translations] use

const init = async function (msg, args) {
  const userData = await DB.users.getFull(msg.author.id);
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const ITEM = args[0];
  const ITEM_ARGUMENTS = args.slice(1);

  if (!ITEM) return msg.channel.send(`${_emoji("nope")}*"Use"*... use **what**?`);

  if (userData.hasItem(ITEM)) {
    try {
      const itemDetails = DB.items.get(ITEM);
      const itemCommand = require(`${appRoot}/resources/items/${ITEM}.js`);

      await itemCommand.run(msg, ITEM_ARGUMENTS, userData, itemDetails);
      msg.addReaction(_emoji("yep").reaction);
    } catch (err) {
      console.error(err);
      return msg.channel.send(`${_emoji("nope")}Sorry, this item is unavailable.`);
    }
  } else {
    return msg.channel.send(`${_emoji("nope")}Sorry you do not have this item in your inventory.`);
  }
};

module.exports = {
  init,
  pub: false,
  cmd: "use",
  cat: "inventory",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
