module.exports = async function(guildID,prefetchedSvData){
    
    const thisServer = typeof guildID === "string" 
        ? PLX.guilds.find(g=>g.id===guildID)
        : guildID;

    if (!thisServer) return;

    const serverData = prefetchedSvData || await DB.servers.findOne(thisServer.id).cache();
    if (!serverData) return;
    

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