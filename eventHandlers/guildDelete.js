module.exports = async (guild) => {
    console.log(guild,"Deleted".red);
    INSTR.dec("guilds",{size: guild.memberCount})
    DB.servers.set(guild.id,{$pull: {activeClients:PLX.user.id} });
}