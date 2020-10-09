const RSS = require("rss-parser");
const parser = new RSS();
const RSSembedGenerator = require("../../commands/utility/rss.js").embedGenerator;

exports.run = async (feed) => {
    
    const data = await parser.parseURL(feed.url).timeout(1200).catch(console.error);
    
    if (!data) return console.warn("[RSS]: ".yellow + "Failed to parse DATA object.");
    data.items = data.items?.filter((x) => x.link.startsWith("http"));
    if ((feed.last?.guid||feed.last?.id) !== (data.items[0]?.guid||data.items[0]?.id)) {
        const embed = await RSSembedGenerator(data.items[0], data);
        await DB.feed.updateOne(
            { server: feed.server, url: feed.url },
            { $set: { last: data.items[0], thumb: embed.thumbnail.url } },
            ).catch(() => null);
            
            PLX.getChannel(feed.channel).send({ embed });
        }
}