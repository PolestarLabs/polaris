module.exports = async (guild) => {
    console.log(guild,"Deleted".red);
    DB.servers.set(guild.id,{$pull: {activeClients:PLX.user.id} });
}