const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return null;

  const ServerDATA = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, "manageMessages", ServerDATA, msg.channel);
  if (!modPass) {
    return msg.reply($t("responses.errors.insuperms", P)).catch(console.error);
  }
  const AMT = Math.abs(parseInt(msg.args[0])) || 10;
  const bucket = (await msg.channel.getMessages(AMT, msg.id)).map((m) => m.id);

  msg.channel.send("Deleting messages...").then((m) => m.delete());
  return msg.channel.deleteMessages(bucket).then((x) => {
    console.log(x);
    msg.channel.send(`${_emoji("yep")} Deleted **${AMT}** messages`);
  });
};
module.exports = {
  init,
  deleteCommand: true,
  pub: true,
  cmd: "clear",
  perms: 3,
  cat: "mod",
  botPerms: ["manageMessages"],
  aliases: ["burn"],
};
