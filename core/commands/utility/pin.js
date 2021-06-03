// TRANSLATE[epic=translations] pin

const cmd = "pin";

const init = async function (msg) {
  const serverData = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, "manageMessages", serverData);
  if (!modPass) return msg.reply(_emoji('nope') + "Insufficient Permissions! You need: **Manage Messages** permission for this command!");

  let messageGrab;
  if (msg.args.length === 0 || [msg.args[0], msg.args[1], msg.args[2]].some((a) => a === "^")) {
    messageGrab = await PLX.getPreviousMessage(msg);
  }
  const messagebyID = [msg.args[0], msg.args[1], msg.args[2]].filter((arg) => arg && !isNaN(arg) && arg.length > 10);
  if (messagebyID.length > 0) {
    messageGrab = await PLX.getPreviousMessage(msg, messagebyID[0]);
  }

  if (!messageGrab) {
    return msg.channel.send("Sorry, there's no message to be pinned!");
  }

  if (messageGrab.pinned) {
    return msg.channel.send("Sorry, this message is already pinned!");
  }
  if (messageGrab.channel.id !== msg.channel.id) {
    await messageGrab.channel.send(`Excuse me, ${msg.author.username} asked me to pin this...`);
  }

  const embed = {
    color: 0xcc2233,
    description: `📌 Message [${messageGrab.id}](https://discordapp.com/channels/${messageGrab.guild.id}/${messageGrab.channel.id}/${messageGrab.id}) has been pinned!`,
  };
  messageGrab.pin().then((ok) => {
    msg.channel.send({ embed });
  }).catch((err) => {
    msg.channel.send(`${_emoji("nope")} **Couldn't pin message! ${err.message}**`);
  });
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "utility",
  botPerms: ["manageMessages", "embedLinks"],
};

