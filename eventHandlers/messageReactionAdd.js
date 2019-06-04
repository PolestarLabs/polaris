
const DB = require (appRoot + "/core/database/db_ops")

module.exports = async function run(msg,emoji,userID){
    if(userID==POLLUX.user.id) return;
    DB.reactRoles.findOne({message:msg.id,channel:msg.channel.id}).then(RCT=>{
        if(!RCT) return null;
        if(RCT.server != msg.channel.guild.id) return null;
        let roleReaction = RCT.rolemoji.find(rlmj=>rlmj.emoji.includes(emoji.id)||rlmj.emoji.includes(emoji.name) )
        if (roleReaction){
            POLLUX.addGuildMemberRole(msg.channel.guild.id, userID, roleReaction.role, "Reaction Role")
        }
    });

}