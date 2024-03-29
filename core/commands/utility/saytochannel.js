// TRANSLATE[epic=translations] STC

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const ServerDATA = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, null, ServerDATA);
  if (!modPass) return msg.reply($t("CMD.moderationNeeded", P)).catch((e) => null);

  if ((/<#[0-9]{16,19}>/.test(msg.args[0]))) {
    nex_msg = msg;
    nex_msg.channel = msg.guild.channels.find((c) => c.id === msg.channelMentions[0]);
    if (!nex_msg.channel) return msg.channel.send(`${_emoji("nope")} \`ERROR :: Channel not set\``);
    nex_msg.args = msg.args.slice(1);
    nex_msg.delete = () => null;
    require("./say").init(nex_msg, nex_msg.args);
  } else {
    msg.reply($t("responses.errors.cantFindChannel", P));
  }
};
module.exports = {
  init,
  pub: true,
  cmd: "saytochannel",
  argsRequired: true,
  perms: 2,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: ["stc", "sayto"],
};
