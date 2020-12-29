/**
 * @typedef Feed
 * @property {string[]} pings
 * @property {string} url
 * @property {string} channel
 * @property {string} server
 * @property {"rss" | "twitch" | "youtube"} type
 */


module.exports = {
  check: async () => {
    DB.feed.find({ server: { $in: PLX.guilds.map((g) => g.id) } }).lean().then(async (/** @type {Feed[]} */serverFeeds) => {
      console.info(`${"RSS: ".blue}Starting...`);
      const servers = await DB.servers.find({ id: { $in: serverFeeds.map((f) => f.server) } }, { "modules.LANGUAGE": 1, id: 1 }).lean();
      serverFeeds.forEach((feed) => {
        const { serverLang } = servers.find((/** @type {import("eris").Guild} */sv) => sv.id === feed.server);

        if (feed.type === "rss") {
          (require("./rss.js")).run((/** @type {import("./rss.js").RSSFeed} */ (feed)));
        }

        if (feed.type === "twitch") {
          (require("./twitch.js")).run((/** @type {import("./twitch.js").TwitchFeed} */ (feed)), serverLang);
        }

        if (feed.type === "youtube") {
          (require("./youtube.js")).run((/** @type {import("./youtube.js").YoutubeFeed} */ (feed)), serverLang);
        }
      });
    });
  },
};
