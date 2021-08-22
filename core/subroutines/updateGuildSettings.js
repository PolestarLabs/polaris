module.exports = async function(guildID,prefetchedSvData){
    
    const thisServer = typeof guildID === "string" 
        ? PLX.guilds.find(g=>g.id===guildID)
        : guildID;

    if (!thisServer) return;

    const serverData = prefetchedSvData 
        || await JSON.parse( (await PLX.redis.aget(`${DB.raw.db.databaseName}.serverdb.findOne.{"id":"${thisServer.id}"}`))||"null" )
        || await DB.servers.findOne({id:thisServer.id}).cache();
    if (!serverData || !serverData.modules) return;
    

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