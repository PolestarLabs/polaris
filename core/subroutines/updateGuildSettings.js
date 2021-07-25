module.exports = async function(guildID,prefetchedSvData){

    const serverData = prefetchedSvData || await DB.servers.findOne(guildID).cache();
    if (!serverData) return;
    
    const thisServer = PLX.guilds.find(g=>g.id===guildID);
    if (!thisServer) return;

    thisServer.LANG = sv.modules.LANGUAGE;
    thisServer.DISABLED = sv.modules.DISABLED;
    thisServer.disaReply = sv.respondDisabled;

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