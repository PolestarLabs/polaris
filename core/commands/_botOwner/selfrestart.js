const init = async (m) => {
  await m.channel.send(`${_emoji('off')} Shutting down...`);
  await m.channel.send(`• **Exec Q size:** ${PLX.execQueue.length}`);
  await m.addReaction(_emoji('off').reaction);
  PLX.softKill();
};

module.exports = {
  init,
  pub: false,
  cmd: "selfrestart",
  perms: 3,
  cat: "dev",
  botPerms: [],
  aliases: ["rst"],
};
