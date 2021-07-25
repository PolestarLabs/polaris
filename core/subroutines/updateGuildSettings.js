module.exports = async function(guildID,prefetchedSvData){

    const serverData = prefetchedSvData || await DB.servers.findOne(guildID).cache();
    if (!serverData) return;
    
    const thisServer = PLX.guilds.find(g=>g.id===guildID);
    if (!thisServer) return;

    thisServer.LANG = serverData.modules.LANGUAGE;
    thisServer.DISABLED = serverData.modules.DISABLED;
    thisServer.disaReply = serverData.respondDisabled;

    PLX.registerGuildPrefix(
        serverData.id,
        [
            serverData.modules.PREFIX || "+",
            (serverData.globalPrefix ? "p!" : "plx!"),
            "plx!",
            "@mention"
        ]
    );
}