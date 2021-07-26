// TRANSLATE[epic=translations] clear

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const ServerDATA = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, "manageMessages", ServerDATA, msg.channel);
  if (!modPass) {
    return msg.reply($t("responses.errors.insuperms", P)).catch(console.error);
  }
  const AMT = Math.abs(parseInt(msg.args[0])) || 10;
  const bucket = (await msg.channel.getMessages(AMT, msg.id)).filter((m) => (Date.now() - (14 * 24 * 60 * 60) * 1e3) < m.createdAt).map((m) => m.id);

  msg.channel.send("Deleting messages...").then((m) => m.delete());
  return msg.channel.deleteMessages(bucket).then((x) => {

    msg.channel.send(`${_emoji("yep")} Deleted **${bucket.length}** messages${bucket.length < AMT
      ? `. The remaining ${AMT - bucket.length} messages are older than 14 days and could not be deleted` : ""}`);
  }).catch(err=>{
    msg.channel.send(`${_emoji("nope")} **Incorrect Permissions** - Please ensure I have permission to delete messages in this channel!`);
  });
};
module.exports = {
  init,
  //FIXME
  //deleteCommand: true,
  argsRequired: true,
  pub: true,
  cmd: "clear",
  perms: 3,
  cat: "moderation",
  botPerms: ["sendMessages","manageMessages"],
  aliases: ["burn"],
};
