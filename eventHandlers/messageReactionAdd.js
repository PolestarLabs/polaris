// const DB = require (appRoot + "/core/database/db_ops")

module.exports = async (msg, emoji, userID) => {
  if (userID === PLX.user.id) return;
  DB.reactRoles.findOne({ channel: msg.channel.id, message: msg.id }).then((RCT) => {
    if (RCT?.server !== msg.channel.guild.id) return;
    const roleReaction = RCT.rolemoji.find((rlmj) => rlmj.emoji.includes(emoji.id) || rlmj.emoji.includes(emoji.name));
    if (roleReaction) {
      PLX.addGuildMemberRole(msg.channel.guild.id, userID, roleReaction.role, "Reaction Role");
    }
  });
};
