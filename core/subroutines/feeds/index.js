module.exports = {
    check: async () => {

        DB.feed.find({ server: { $in: PLX.guilds.map((g) => g.id) } }).lean().then(async (serverFeeds) => {
        console.info("RSS: ".blue+"Starting...")
            const servers = await DB.servers.find({id: {$in: serverFeeds.map(f=>f.server) }},{"modules.LANGUAGE":1,id:1}).lean();
            serverFeeds.forEach((feed) => {
                const {serverLang} = servers.find(sv=> sv.id === feed.server);
        
                if (feed.type === "rss") {
                    (require('./rss.js')).run(feed);
                }
                
                if (feed.type === "twitch") {
                    (require('./twitch.js')).run(feed, serverLang);
                }
                
                if (feed.type === "youtube") {
                    (require('./youtube.js')).run(feed, serverLang);
                }
            });
        });
      }
}
