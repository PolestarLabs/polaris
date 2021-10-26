
const Picto = require('../../utilities/Picto.js');
const os = require("os");
function uptime(millis){
	const s = ~~((millis / 1000) % 60);
	const m = ~~((millis / 1000 / 60) % 60);
	const h = ~~((millis / (1000 * 60 * 60)) % 24);
	const d = ~~(millis / (1000 * 60 * 60 * 24));
	const uptime = `${(d ? `${d}D ` : "") + (millis >= 3.6e+6 ? `${h}h ` : "") + (millis >= 60000 ? `${m}m ` : "") + s}s`;
	return uptime; 
}

const init = async function (msg){

	const ver = require('../../../package.json').version;
	const commit = await exec("git rev-parse --short HEAD");
	const server_estimate_count = PLX.guilds.size / PLX.shards.size * PLX.options.maxShards;
	const user_estimate_count = PLX.users.size / PLX.shards.size * PLX.options.maxShards;
	const ping = `${Date.now() - msg.timestamp}ms`;
	const ram_usage = `${~~(process.memoryUsage().heapUsed / 1000000)}mb / 128gb`;

	const bottomFields = [
		{
			name: "\u200b",
			value: "𝙻𝚒𝚗𝚔𝚜 ",
			inline: false
		},
		{ 
			name: "Dashboard",
			value: `🌐   [${paths.DASH}](${paths.DASH}?ref=status_embed)     \u200b`,
			inline: true
		},
		{   name: "Invite",
			value: `💌  [pollux.gg/invite](${paths.DASH}/invite)     \u200b`,
			inline: true
		},
		{ 
			name: "Twitter",
			value: "<:twitter:510526878139023380>  [@maidPollux](https://twitter.com/maidPollux)    \u200b",
			inline: true
		},
		{ 
			name: "Community/Support", 
			value: `<:reddit:510526878038360074>   [/r/Pollux](https://reddit.com/r/Pollux)    \u200b\n`+
			`⭐  [Pollux's Mansion](${paths.DASH}/support)    \u200b`,
			inline: true
		},
		{
			name: "How to", 
			value: `\n📚  [Wiki](https://wiki.pollux.gg)` +
			`\n⚙  [Command List](${paths.DASH}/commands)`,
			inline: true
		},
		{
			name: "Get **Prime**", 
			value: `<:patreon:684734175986712613> [Patreon](https://patreon.com/Pollux)`+
			`\n<:Paypal:338329328947429378> [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8JDLAY5TFU9D6&source=url)`,
			//`<:pix:845985531162525736> [Pix](https://media.discordapp.net/attachments/277392117167292417/808354942138056764/unknown.png)`,
			inline: true
		}
	];

	const footer = {
		text: `Nuremberg - DE\u2003❤ Powered by ${os.cpus().length}x ${os.cpus()[1].model}`,
		icon_url: `${paths.CDN}/build/guessing/guessflags/germany.png`
	};

	const embed = {
		title: "🎀 Pollux • Your new favorite assistant.",
		url: paths.DASH,
		description: `Patch [\`v${ver}\`](https://ptb.discord.com/channels/277391723322408960/712055672799232092 "See patch notes • ${commit}") | Database \`${DB.version}\` | Engine \`Eris v${PLX.engine.VERSION}\``,
		color: parseInt(await (await Picto.avgColor(PLX.user.avatarURL).catch(e=>"0")).replace('#',''),16) || 16724821,
		fields: [
			{
				name: "\u200b",
				value: `𝚂𝚘𝚌𝚒𝚊𝚕 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗\n`+
						`${_emoji("comp")}   **Estimated Servers** \`${server_estimate_count}\`\n`+
						`${_emoji("ethernet")}   **Active Users** \`${user_estimate_count}\`\n\n`+
						`${_emoji("mobo")}   **Realm** \`\`\`cs\n[${process.env.CLUSTER_ID||''}:${PLX.cluster.name} ${msg.guild?.shard?.id||0}]\n${PLX.guilds.size} servers\n\`\`\` `,
				inline: true
			},
			{
				name: "\u200b",
				value: `𝚃𝚎𝚌𝚑𝚗𝚒𝚌𝚊𝚕 𝚂𝚝𝚊𝚝𝚞𝚜\n`+
				`${_emoji("cog")}   **Latency** \`${ping}\`\n`+
				`${_emoji("memslot")}   **Memory** \`${ram_usage}\`\n\n`+
				`${_emoji("cpu")}   **Uptimes** \`\`\`cs\n[ Shard ] ${uptime(PLX.uptime)}\n[Cluster] ${uptime(process.uptime()*1e3).slice(0,11)}\n\`\`\` `,
				inline: true
			},
		 

			...bottomFields
		],
		image: {
			url: ""
		},
		thumbnail: {
			url: PLX.user.avatarURL
		},
		footer
	}

	return {embed};
	
}
module.exports={
	init
	,pub:true
	,cmd:'status2'
	,cat:'infra'
	,botPerms:['attachFiles','embedLinks']
	,aliases:['stats']
}