// const DB = require (appRoot + "/core/database/db_ops")

module.exports = async (msg, emoji, userID) => {
  DB.reactRoles.findOne({ message: msg.id, channel: msg.channel.id }).then((RCT) => {
    if (RCT?.server !== msg.channel.guild.id) return;

    const roleReaction = RCT.rolemoji.find((rlmj) => rlmj.emoji.includes(emoji.id) || rlmj.emoji.includes(emoji.name));
    if (roleReaction) {
      PLX.removeGuildMemberRole(msg.channel.guild.id, userID, roleReaction.role, "Reaction Role");
    }
  });
};
