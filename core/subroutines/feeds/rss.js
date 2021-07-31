const RSS = require("rss-parser");

/**
 * @typedef RSSData
 * @property {string} [guid]
 * @property {string} [id]
 */

/**
 * @typedef RSSS
 * @property {RSSData} last
 */

/**
 * @typedef {import("./index.js").Feed & RSSS} RSSFeed
 */

const parser = new RSS({
  customFields: {
    item: ["media:content", "media:thumbnail"],
  },
});
const RSSembedGenerator = require("../../commands/utility/rss.js").embedGenerator;

exports.run = async (/** @type {RSSFeed} */ feed) => { // @ts-expect-error FIXME[epic=bsian] timeout
  const data = await parser.parseURL(feed.url).timeout(1200).catch(err=>{
    console.error(err)
    console.error(" FEED ERROR ON URL ".bgRed, feed.url)
  });

  if (!data) return console.warn(`${"[RSS]: ".yellow}Failed to parse DATA object.`);
  data.items = data.items?.filter((/** @type {{ link: string }}  */ x) => x.link.startsWith("http"));

  if ((feed.last?.guid || feed.last?.id) !== (data.items[0]?.guid || data.items[0]?.id)) {
    const embed = await RSSembedGenerator(data.items[0], data, feed);
    let newFeed = data.items[0];
    let thumbnail = newFeed["media:thumbnail"]?.$;
    newFeed.media = newFeed["media:content"]?.$;
    delete newFeed["media:content"];
    delete newFeed["media:thumbnail"];

    

    await DB.feed.updateOne(
      { server: feed.server, url: feed.url },
      { $set: { last: newFeed, thumb: thumbnail?.url||embed.thumbnail.url } },
    ).catch(console.error);

    // @ts-expect-error eris-additions
    try{
      const fChannel = PLX.getChannel(feed.channel);
      if ( !fChannel.permissionsOf(PLX.user.id).has('sendMessages') ) return;
      fChannel.send({ embed }).catch(async err=>{
        if (feed.erroredCount >= 5) {
          await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
        }else{
          await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
        }
      });
    }catch(err){
      console.log("Error sending to ",feed.channel, err);
      if (feed.erroredCount >= 5) {
        await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
      }else{
        await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
      }
      
    }

  }
};
