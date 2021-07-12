/**
 * @typedef Feed
 * @property {string[]} pings
 * @property {string} url
 * @property {string} channel
 * @property {string} server
 * @property {"rss" | "twitch" | "youtube"} type
 */

const { checkPrimeSync } = require("crypto");


 module.exports = {
  check: CHK
};

async function CHK() {
  let allGuilds = PLX.guilds.map((g) => g.id);
  DB.feed.find({ server: {$in: allGuilds } }).lean().then(async (/** @type {Feed[]} */serverFeeds) => {
    console.info(`${"RSS: ".blue}Starting...${serverFeeds.length}`);
    const servers = await DB.servers.find({ id: { $in: serverFeeds.map((f) => f.server) } }, { "modules.LANGUAGE": 1, id: 1 }).lean();
    serverFeeds.forEach((feed) => {

      const serverLang = servers.find(sv =>
         sv.id === feed.server)?.modules?.LANGUAGE || 'en';
      
      if (feed.type === "rss") {
        console.log("RSS")
        delete require.cache[require.resolve("./rss.js")];
        let RSS = require("./rss.js");
        RSS.run(feed);
      }

      if (feed.type === "twitch") {
        require("./twitch.js").run(feed, serverLang);
      }

      if (feed.type === "youtube") {
        require("./youtube.js").run(feed, serverLang);
      }
    });
  });
}

global.CHK = CHK