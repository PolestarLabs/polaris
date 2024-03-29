// const DB = require (appRoot + "/core/database/db_ops")

module.exports = async (msg, emoji, { id: userID }) => {
  if (userID === PLX.user.id) return;
  DB.reactRoles.findOne({ channel: msg.channel.id, message: msg.id }).then((RCT) => {
    if (RCT?.server !== msg.channel.guild.id) return;
    const roleReaction = RCT.rolemoji.find((rlmj) => rlmj.emoji.includes(emoji.id) || rlmj.emoji.includes(emoji.name));
    if (roleReaction) {
      if ( !msg.channel.permissionsOf(PLX.user.id).has('manageRoles') ) return;
      PLX.addGuildMemberRole(msg.channel.guild.id, userID, roleReaction.role, "Reaction Role");
    }
  });
};
