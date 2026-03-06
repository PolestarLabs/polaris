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
		const feedPostChannel = PLX.getChannel(feed.channel);

		try{
			if ( !feedPostChannel.permissionsOf(PLX.user.id).has('sendMessages') ) return INSTR.inc("feeds", {type: feed.type , server: feed.server, url: feed.url, status: "denied"});
			feedPostChannel.send({ embed }).then(()=>{

				INSTR.inc("feeds", {type: feed.type , server: feed.server, url: feed.url, status: "success"});
				
			}).catch(async err=>{
				if (feed.erroredCount >= 2) {
					INSTR.inc("feeds", {type: feed.type , server: feed.server, url: feed.url, status: "terminated"})
					if (feedPostChannel) {
					feedPostChannel.send(`
⚠️ This RSS feed has been terminated due to repeated errors:
\`${feed.url}\`
-# Please check the feed URL and ensure it is valid. If you are the server administrator, you may need to remove or update this feed.
`).then(x=> console.report("[RSS] Termination posted:")).catch(e=> console.error("Failed to send termination message: "));
					console.warn(`${"[RSS]: ".yellow}Feed ${feed.url} has been terminated due to repeated errors.`).catch(console.error);
				}
					await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
				}else{
					INSTR.inc("feeds", {type: feed.type , server: feed.server, url: feed.url, status: "error"})
					await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
					
				}
			});
		}catch(err){
			console.log("Error sending to ",feed.channel, err);
			INSTR.inc("feeds", {type: feed.type , server: feed.server, url: feed.url, status: "error"})
			if (feed.erroredCount >= 2) {
				// send message to channel about termination
				console.warn(`${"[RSS]: ".yellow}Feed ${feed.url} in server ${feed.server} has been terminated due to repeated errors.`);
				// send discord message in the feed channel
				if (feedPostChannel) {
					feedPostChannel.send(`
⚠️ This RSS feed has been terminated due to repeated errors:
\`${feed.url}\`
-# Please check the feed URL and ensure it is valid. If you are the server administrator, you may need to remove or update this feed.
`).then(x=> console.report("[RSS] Termination posted:")).catch(e=> console.error("Failed to send termination message: "));
					console.warn(`${"[RSS]: ".yellow}Feed ${feed.url} has been terminated due to repeated errors.`).catch(console.error);
				}

				await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
			}else{
				await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
			}
			
		}

	}
};
