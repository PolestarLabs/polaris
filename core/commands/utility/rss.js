const RSS = require("rss-parser");
const OGS = require("open-graph-scraper");
const YesNo = require("../../structures/YesNo");

const parser = new RSS();

const init = async function (msg) {
	const P = { lngs: msg.lang, prefix: msg.prefix, command: this.cmd };

	const feedData = await DB.feed.find({ server: msg.guild.id, type: "rss" }).lean()
		.exec();

	// +RSS add (LINK)
	if (msg.args[0] === "add") {
		const str = msg.args[1];
		const destination = msg.channelMentions[0];
		const feed = await parser.parseURL(str).timeout(5000)
			["catch"]((e) => false);
		if (!feed) return msg.channel.send($t("interface.feed.invalidRSS", P));
		channel = destination || msg.channel.id; // feedData.defaultChannel;
		feed.items = feed.items.filter((x) => x.link.startsWith("http"));
		if (!channel) return msg.channel.send($t("interface.feed.noDefault", P));

		const payload = {
			type: "rss", url: str, last: feed.items[0], channel,
		};

		if (feedData && feedData.find((fdd) => fdd.url === str)) {
			await DB.feed.set({ server: msg.guild.id, url: str }, { $set: { channel } });
			return msg.channel.send($t("interface.feed.urlPresent", P));
		}
		const embed = await feedEmbed(feed.items[0], feed);
		payload.server = msg.guild.id;
		payload.thumb = feed.logo || feed.image?.url || "";
		payload.name = feed.title || feed.image?.title || "RSS Feed";

		await DB.feed["new"](payload);

		P.channelID = `<#${channel}>`;
		msg.channel.send(_emoji("yep") + $t("interface.feed.savedSubLastRSS", P));
		return PLX.getChannel(channel).send({ embed });
	}

	// +RSS remove (link || index)
	if (msg.args[0] === "remove" || msg.args[0] === "delete") {
		if (!feedData || feedData.length === 0) return msg.channel.send($t("interface.feed.noFeed", P));
		const target = msg.args[1];
		if (!target) return msg.channel.send($t("interface.feed.stateIDorURL", P));
		const toDelete = feedData[target] || feedData.find((f) => f.type === "rss" && (f.url === target || f.url.includes(target)));
		if (!toDelete) return msg.channel.send($t("interface.feed.stateIDorURL", P));

		const embed = {};
		embed.description = `
								URL: \`${toDelete.url}\`
								${$t("terms.discord.channel")}: <#${toDelete.channel}>
								`;
		const confirm = await msg.channel.send({
			content:
				$t("interface.generic.confirmDelete", P),
			embed,
		});
		YesNo(confirm, msg, async (cc) => {
			// await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
			await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
		});
	}

	if (msg.args[0] === "list") {
		if (feedData && feedData.length > 0) {
			msg.channel.send(`
						**${_emoji("todo") + $t("interface.feed.listShowRSS", P)}**
\u2003${feedData.map((x, i) => `\`\u200b${`${i}`.padStart(2, " ")}\` <${x.url}> @ <#${x.channel}>`).join("\n\u2003")}        

*${$t("interface.feed.listRemove", P)}*
`);
		} else {
			msg.channel.send($t("interface.feed.noFeed", P));
		}
	}
	// +RSS defaultchannel (#channel)
	if (msg.args[0] === "channel") {
		const channel = msg.channelMentions[0];
		await DB.servers.set({ id: msg.guild.id }, { $set: { "modules.defaultRSSChannel": channel } });
		P.channelID = `<#${channel}>`;
		msg.channel.send(rand$t("responses.verbose.interjections.acknowledged", P) + $t("interface.feed.channelUpdate", P));
	}
};


async function testFeedLink(url,fallback){
	const ogFetch = await OGS({url}).catch(e=>e);
	if (ogFetch.error) {
		if (fallback) {
			const ogFetch2 = await OGS({url:fallback}).catch(e=>e);
			if (ogFetch2.error) return {error:true};
			return ogFetch2.result;
		}
		return {error:true};
	}
	return ogFetch.result;
}




async function feedEmbed(feedFirstItem, xmlFeedData, databaseFeedPayload) {

	const ogScrape = await testFeedLink( embed.url, xmlFeedData.link || embed.url.split(`${"//"[1]}`).split("/")[0] );
	const { ogUrl, ogTitle, ogDescription, ogSiteName, ogImage, ogDate, author: ogAuthor} = ogScrape;
	
	const THUMB = normalizeLink( xmlFeedData.logo || xmlFeedData.image?.url || databaseFeedPayload.thumb || "https://img.icons8.com/dusk/344/rss.png" );
	const FACE_IMG = normalizeLink( ogImage?.url );

	const embed = {};
	embed.color = numColor("#ff8a42");

	embed.title = ogTitle || feedFirstItem.title;
	embed.author = { name: xmlFeedData.title || databaseFeedPayload.name };
	embed.url 	= ogUrl || feedFirstItem.url || feedFirstItem.link || feedFirstItem.guid;
	embed.footer = {
		text: ogAuthor || feedFirstItem.author || feedFirstItem.creator || "Pollux RSS Feed Tool",
	};
	embed.description = ogDescription || ( (feedFirstItem.contentSnippet || feedFirstItem.content || "").split("\n")[0] );
	embed.timestamp = new Date(ogDate || feedFirstItem.isoDate);
	embed.thumbnail = THUMB;
	embed.image = { url: FACE_IMG || feedFirstItem["media:content"]?.$?.url };
	embed.author.icon_url = "https://img.icons8.com/dusk/344/rss.png";

	return embed;
}

function normalizeLink(url){
	return url.startsWith("//") ? url.replace("//", "http://") : url;
}

module.exports = {
	init,
	embedGenerator: feedEmbed,
	pub: true,
	argsRequired: true,
	cmd: "rss",
	perms: 3,
	cat: "utility",
	botPerms: [ "embedLinks", "manageMessages", "manageChannels" ],
	aliases: ["feed"],
};
