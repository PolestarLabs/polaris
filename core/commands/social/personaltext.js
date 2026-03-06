// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const userData = await DB.users.findOne({ id: msg.author.id });
  const persotxt = msg.args.join(" ");

  await DB.users.set(msg.author.id, { $set: { "profile.persotext": persotxt } });
  P.pstext = `*\`\`\`css\n${persotxt}\`\`\`*`,
    P.prefix = msg.prefix,
    embed = new Embed();
  embed.description = `${_emoji("yep") + rand$t("responses.verbose.interjections.acknowledged", P)} ${$t("profile.persotexUpdate", P)}`;

  msg.channel.send({ embed });
};
module.exports = {
  init,
  pub: true,
  cmd: "personaltext",
  argsRequired: true, // NOTE: Remove if default displays current
  perms: 3,
  cat: "social",
  botPerms: ["embedLinks"],
  aliases: ["ptxt"],
};
