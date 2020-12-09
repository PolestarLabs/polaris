// TODO[epic=translations] medalinfo
const cmd = "medalinfo";

const init = async (msg, args) => {
  if (!msg.args[0]) return msg.reply("you have to give me the medal name.");
  const Picto = require(`${appRoot}/core/utilities/Picto`);
  const mdi = await DB.cosmetics.find({ type: "medal" });
  const mdl = mdi.find((md) => {
    if (md.icon === args) return true;
    if (args.includes(md.icon)) return true;
    if (msg.args.some((arg) => md.name.toLowerCase().includes(arg))) return true;
    return false;
  });
  if (!mdl) return msg.reply("medal not found.");
  const imageLink = `${paths.CDN}/medals/${mdl.icon}.png`;

  const embed = new Embed()
    .author("Medals", `${paths.CDN}/images/tiers/${mdl.rarity}.png`)
    .thumbnail(imageLink)
    .description(`**${_emoji(mdl.rarity)} ${mdl.name}**\n\`${mdl.icon}\``)
    .field("Tradeable", mdl.tradeable ? _emoji("yep") : _emoji("nope"))
    .color(await Picto.avgColor(imageLink))
    .field("Public", mdl.public ? _emoji("yep") : _emoji("nope"));

  return msg.channel.send({ embed });
};

module.exports = {
  init,
  cmd,
  perms: 3,
  argsRequired: true,
  cat: "cosmetics",
  botPerms: ["embedLinks", "attachFiles"],
};
