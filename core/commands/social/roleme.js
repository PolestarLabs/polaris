const init = async function (msg, args) {
	const GUILD = await DB.servers.findOne({ id: msg.guild.id });
	if (!GUILD) return "Server not Registered";
	if (!GUILD.modules?.SELFROLES) return "No self roles for this server";
	const { SELFROLES } = GUILD.modules;

	if (!args.length) {
		return {
			embed: {
				author: {
					name: `Available Selfroles in ${msg.guild.name}`,
					icon_url: msg.guild.iconURL,
				},
				description: SELFROLES.map((srl) => {
					const [id, tag] = srl;
					return ` • <@&${id}> : \`${msg.prefix}roleme \`**\`${tag}\`**.`;
				}).join("\n"),
			},
		};
	}

	let remove = false;
	if (args[0] === "out" && args[1]) {
		remove = true;
		args[0] = args[1];
	}

	let match = SELFROLES.find((srole) => srole[1] === args[0]);
	if (!match) {
		const filteredRoles = msg.guild.roles.filter((role) => {
			return !!SELFROLES.find((srole) => srole[0] === role.id);
		});
		if (filteredRoles.length)
			match = [filteredRoles.find((role) => role.name.includes(args[0]))?.id];
	}
	if (!match) return "Role not Found.";

	const selfRole = msg.guild.roles.get(match[0]);

	if (selfRole) {
		if (remove) {
			await PLX.removeGuildMemberRole(
				msg.guild.id,
				msg.author.id,
				selfRole.id,
				"Self Role"
			);
		} else {
			await PLX.addGuildMemberRole(
				msg.guild.id,
				msg.author.id,
				selfRole.id,
				"Self Role"
			);
		}

		msg.addReaction(_emoji("yep").reaction);
	} else {
		return "Role not Found";
	}
};
module.exports = {
	init,
	pub: true,

	cmd: "roleme",
	cat: "social",
	botPerms: ["attachFiles", "embedLinks"],
	aliases: ["putme", "r"],
};
