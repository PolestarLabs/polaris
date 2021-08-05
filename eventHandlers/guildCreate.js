module.exports = async (guild) => {
    console.log(guild,"created".green);
    INSTR.inc("guilds",{size: guild.memberCount})
    DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
}