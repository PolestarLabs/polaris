module.exports = async (guild) => {
    console.log(guild,"created".green);
    INSTR.inc("guilds",{size: guild.memberCount});
    await DB.servers.get(guild.id).then(async sv=>{
        if (!sv) await DB.servers.new(guild);
        await DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
    });
}