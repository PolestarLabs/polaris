const init = async function (msg, args) {
  const TOTAL = Number(args[1]) || 32;
  let ShardID = (Number(args[0] || msg.guild.id) >> 22) % (TOTAL);
  if (ShardID < 0) ShardID = TOTAL + ShardID;

  msg.channel.send({
    embed: {
      description: `\`${args[0] || msg.guild.id}\`'s shard is **${ShardID + 1}**`,
    },
  });
};
module.exports = {
  init,
  pub: false,
  cmd: "whatshard",
  perms: 3,
  cat: "_botStaff",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
