// Create cat map with commands and other useful information
const SwitchArch = require("../../archetypes/Switch");

const
	N_NOPE = _emoji("nope").name,
	N_YEP = _emoji("yep").name,
	N_CHANNEL = _emoji("channel").name,
	N_SAVE = _emoji("save").name,
	N_UNDO = _emoji("undo").name,
	N_WG = _emoji("whitegreenem").name,
	N_WO = _emoji("whiteorangeem").name,
	N_WR = _emoji("whiteredem").name,
	OVERRIDE = _emoji("override"),

	R_NOPE = _emoji("nope").reaction,
	R_YEP = _emoji("yep").reaction,
	R_CHANNEL = _emoji("channel").reaction,
	R_SAVE = _emoji("save").reaction,
	R_UNDO = _emoji("undo").reaction,
	R_WG = `<:${_emoji("whitegreenem").reaction}>`,
	R_WO = `<:${_emoji("whiteorangeem").reaction}>`,
	R_WR = `<:${_emoji("whiteredem").reaction}>`,

	MINI_ON = _emoji("on_small"),
	MINI_OFF = _emoji("off_small");

// Menu emojis
const menuEmoijis = [
	R_NOPE,
	R_SAVE,
	R_UNDO,
	R_CHANNEL,
	["", "⬅"]]; // ["➡", "⬅"]
// Menu emojis
const menuEmoijisNames = [
	N_NOPE,
	N_SAVE,
	N_UNDO,
	N_CHANNEL,
	["", "⬅"]]; // ["➡", "⬅"]

// Only one switch per guild to combat race conditions
const switches = new Map();

const savingEmbed = {
	embed: {
		color: 0x000, // TODO: change
		title: "Standby, saving changes...",
		description: "Both server and channel changes will be saved.",
	},
};

const listeners = new Map();
PLX.on("messageReactionRemove", (msg, emoji, userID) => { if (listeners.has(msg.channel.id || msg.channel)) listeners.get(msg.channel.id || msg.channel)(emoji, userID); });

async function init(msg) {
	if (msg.content.split(" ")[1]?.toLowerCase() === "-r") switches.delete(msg.guild.id);

	const P = { lngs: msg.lang, prefix: msg.prefix };
	if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

	if (switches.get(msg.guild.id)) return msg.reply("There is already a switch open in this guild");

	const Switch = new SwitchArch(msg.guild, msg.channel);
	switches.set(msg.guild.id, Switch);

	let omsg = await msg.channel.send({ embed: { color: 0x22d, title: "Please wait", description: "Currently configuring everything..." } });
	for (emoji of menuEmoijis) if (!Array.isArray(emoji) || emoji[0].length) await omsg.addReaction(Array.isArray(emoji) ? emoji[0] : emoji);

	omsg.edit(genSwitchEmbed(Switch));

	function messageFilter(m) {
		if (msg.author.id !== m.author.id) return false;
		if (m.content.toLowerCase() === "all") return true;
		let name;
		if (m.content.startsWith(">")) name = m.content.slice(1).toLowerCase();
		else name = m.content.toLowerCase();
		return (currentCat ? cats[currentCat]["cmds"].includes(name) : catsArr.includes(name));
	}
	const reactionFilter = r => msg.author.id === r.userID && menuEmoijisNames.flat().includes(r.emoji.name);
	const MC = msg.channel.createMessageCollector(messageFilter, { time: 60e5 });
	const RC = omsg.createReactionCollector(reactionFilter, { time: 60e5 });

	RC.on("emoji", emoji => {
		if (![N_NOPE, N_CHANNEL].includes(emoji.name)) omsg.removeReaction(`${emoji.name}:${emoji.id}`, msg.author.id).catch(e => null);

		if (emoji.name === N_CHANNEL) {
			Switch.mode = "channel";
			omsg.edit(genSwitchEmbed(Switch));
		} else if (emoji.name === "⬅") {
			// return button
			Switch.mode = "global";
			omsg.edit(genSwitchEmbed(Switch));
			omsg.removeReaction("⬅");
		} else if (emoji.name === N_UNDO) {
			Switch.undo();
			omsg.edit(genSwitchEmbed(Switch));
		} else if (emoji.name === N_SAVE) {
			Switch.save().then(() => {
				omsg.edit(genSwitchEmbed(Switch));
			}).catch(() => {
				omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
			});
		} else if (emoji.name === N_NOPE) {
			// exit command
			MC.stop("User input");
			RC.stop("user input");
			omsg.edit(genSwitchEmbed(Switch));

			// let's make sure they meant to leave without saving
			if (!lastSaved) {
				msg.channel.send({ embed: { color: 0x33D, title: "Oops! You didn't save your changes.", description: "Do you want to save your changes? (yes|no)" } }).then(savemsg => {
					savemsg.addReaction(R_YEP);
					savemsg.addReaction(R_NOPE);
					Promise.race([
						msg.channel.awaitMessages(m => msg.author.id === m.author.id && /yes|no/.test(m.content), { maxMatches: 1, time: 6e4 }),
						savemsg.awaitReactions(r => msg.author.id === r.userID && [N_YEP, N_NOPE].includes(r.emoji.name), { maxMatches: 1, time: 6e4 }),
					]).then(r => {
						if (r.length && (r[0].content?.toLowerCase() === "yes" || r[0].emoji?.name === N_YEP)) {
							savemsg.edit(savingEmbed);
							Switch.save().then(() => {
								savemsg.edit({ embed: { color: 0x33D, title: "Rest assured, I've saved your changes." } });
							});
						} else {
							savemsg.delete();
						}
					});
				});
			}
		};
	});
	RC.on("end", c => {
		omsg.removeReactions();
		switches.delete(msg.guild.id);
	});

	const reactionRemoveFunction = (emoji, userID) => {
		if (userID !== msg.author.id) return;
		if (emoji.name === N_CHANNEL) {
			Switch.mode = "guild";
			omsg.edit(genSwitchEmbed(Switch));
		}
	};
	listeners.set(msg.channel.id, reactionRemoveFunction);

	MC.on("message", m => {
		m.delete().catch(_ => null);

		let name;
		if (m.content.startsWith(">")) {
			intoCat = true;
			name = m.content.slice(1).toLowerCase();
		} else {
			name = m.content.toLowerCase();
		}

		if (intoCat) {
			// if intocat is enabled we go to the category's menu
			intoCat = false;
			currentCat = name;
			omsg.edit(genSwitchEmbed(Switch));
			omsg.removeReaction("➡");
			omsg.addReaction("⬅");
		} else {
			save();
			let nname = name === "all" && currentCat ? currentCat : name;
			let ncurrentCat = name === "all" ? null : currentCat;
			Switch.switch(nname);
			omsg.edit(genSwitchEmbed(Switch));
		}
	});
};

function genSwitchEmbed(Switch, disable = false) {
	if (!Switch || !(Switch instanceof SwitchArch)) throw new TypeError("GenSwitchEmbed: Switch not of type Switch");

	const modules = Switch.modules,
		cat = Switch.category, // current category if any
		intoCat = Switch.mode === "category", // category mode
		cmode = Switch.scope === "channel", // channel mode
		gdcmds = modules["gd"], // guild disabled
		cdcmds = modules["cd"], // channel disabled
		cecmds = modules["ce"]; // channel enabled

	const embed = {
		color: mode == "c" ? 0x7289da : 0xea6a3d, // TODO: change
		title: `${!cat ? "Category" : cat.slice(0, 1).toUpperCase() + cat.slice(1)} switches`,
		fields: [],
	};
	embed.description = intoCat ? "**Selecting a category**" : `Current view: ${cmode ? "**Channel**" : "**Guild**"}`;
	if (!disable) embed.description += "\n\nType a categories name to change it's settings.";

	if (!cat) {
		const gdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => gdcmds.includes(cmd)));
		const cdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cdcmds.includes(cmd)));
		const cenabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cecmds.includes(cmd)));

		for (cat of catsArr) {
			const disabled = cmode ? ((gdisabledcats.includes(cat) || cdisabledcats.includes(cat)) && !cenabledcats.includes(cat)) : gdisabledcats.includes(cat),
				override = cmode && (cats[cat]["cmds"].some(cmd => cdcmds.includes(cmd) || cecmds.includes(cmd))),
				disabledCount = cats[cat].cmds.map(cmd => ((gdcmds.includes(cmd) || (cmode ? cdcmds.includes(cmd) : false)) && (cmode ? !cecmds.includes(cmd) : true)) ? 1 : 0).reduce((a, b) => a + b, 0),
				catName = cat.slice(0, 1).toUpperCase() + cat.slice(1);
			embed.fields.push({
				name: `${(disabled ? (override && cmode ? R_WR : _emoji("off")) : disabledCount ? (override && cmode ? R_WO : _emoji("partial")) : (override && cmode ? R_WG : _emoji("on")))} ${catName}`,
				value: disabledCount && !disabled ? `${MINI_ON}${cats[cat].cmds.length - disabledCount}    ${MINI_OFF}${disabledCount} ` : `${cats[cat]["cmds"].length} commands`,
				inline: true,
			});
		}
	} else {
		let fieldCount = 1;
		let cmdCount = cats[cat]["cmds"].length;
		if (cmdCount > 5) {
			if (!(cmdCount % 3)) fieldCount = 3;
			else fieldCount = 2;
		}
		for (let i = 0; i < fieldCount; i++) embed.fields.push({ name: "\u200b", value: "", inline: true });
		let currField = 0;
		const cmds = cats[cat]["cmds"];
		for (cmd of cmds) {
			currField++;
			if (currField === fieldCount) currField = 0;
			const disabled = cmode ? (cdcmds.includes(cmd) || (gdcmds.includes(cmd)) && !cecmds.includes(cmd)) : gdcmds.includes(cmd),
				override = cmode && (cdcmds.includes(cmd) || cecmds.includes(cmd)),
				cmdName = cmd.slice(0, 1).toUpperCase() + cmd.slice(1);
			embed.fields[currField].value += (disabled ? override ? R_WR : _emoji("off") : override ? R_WG : _emoji("on")) + ` ${cmdName}\n`;
		}
	}

	while (embed.fields.length % 3) embed.fields.push({ name: "\u200b", value: "\u200b", inline: true });
	return { embed };
};

module.exports = {
	init,
	pub: true,
	cmd: "switch",
	perms: 2,
	cat: "mod",
	aliases: [],
	botPerms: ["manageMessages"],
	guildOnly: true,
};