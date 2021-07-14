module.exports = async (guild) => {
    console.log(guild,"created".green);
    DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
}