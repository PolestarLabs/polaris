// Create cat map with commands and other useful information
const SwitchArch = require("../../archetypes/Switch");
let cats,
	catsArr;

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
	R_WG = `<:${_emoji("ONPARTIAL").reaction}>`,
	R_WO = `<:${_emoji("NOTSOPARTIAL").reaction}>`,
	R_WR = `<:${_emoji("OFFPARTIAL").reaction}>`,

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

// Embed during time it takes to save changes
const savingEmbed = {
	embed: {
		color: 0x000, // TODO: change
		title: "Standby, saving changes...",
		description: "Both server and channel changes will be saved.",
	},
};

// Guide to how switch works
const helpEmbed = {
	embed: {
		color: 0xffb366,
		title: "Switch guide",
		description: `Through switch you can control which commands are enabled/disabled server- or channel-wide. All of the buttons are also available as typed commands.`,
		fields: [
			{
				name: "Switching",
				value: "> economy\nEnable/disable economy.\n> **>**economy\nShow economy commands.",
				inline: true,
			},
			{
				name: "Buttons",
				value: `<:${R_NOPE}> exit\
				\n<:${R_SAVE}> save\
				\n<:${R_UNDO}> undo\
				\n<:${R_CHANNEL}> mode (channel)\
				\n> ⬅ return\
				`,
				inline: true
			},
			{
				name: "Advanced mode",
				value: "Coming to you in the near future...",
				inline: true,
			},
			{
				name: "Channel states",
				value: `When you switch in channel mode, things get more difficult.\nThis is what the different states mean:
				\n> ${_emoji("on")}/${_emoji("partial")}/${_emoji("off")} on/mixed/off following server settings\
				\n> ${R_WG} enabled in channel, has priority over server settings\
				\n> ${R_WO} some enabled, some disabled, not matching server settings (category view)\
				\n> ${R_WR} disabled in channel, has priority over server settings\
				`,
				inline: false,
			},
		],
	}
};

// Custom implementation for a reactionremove listener.
const listeners = new Map();
PLX.on("messageReactionRemove", (msg, emoji, userID) => { const listener = listeners.get(msg.channel.id || msg.channel); if (listener) listener(emoji, userID); });

// Helper function for handling switch guide (sending and removing)
async function sendHelpEmbed(msg) {
	if (!msg) throw new Error("Missing message");
	const omsg = await msg.channel.send(helpEmbed);
	await omsg.addReaction(R_NOPE);
	const reactionRemoveFunction = (r) => {
		if (r.userID !== msg.author.id) return false;
		if (r.emoji.name !== N_NOPE) return false;
		omsg.delete();
		return true;
	};
	const RC = omsg.createReactionCollector(reactionRemoveFunction, { time: 60e5, max: 1 });
	RC.on("emoji", () => RC.stop());
}

async function init(msg) {
	// for testing purposes
	if (msg.content.split(" ")[1]?.toLowerCase() === "-r") switches.delete(msg.guild.id); // TODO: delete

	// Standard PLX things
	const P = { lngs: msg.lang, prefix: msg.prefix };
	if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

	// Only one switch per guild or things would get messed up.
	if (switches.get(msg.guild.id)) return msg.reply("There is already a switch open in this guild");
	// Make new switch
	const Switch = new SwitchArch(msg.guild, msg.channel);
	switches.set(msg.guild.id, Switch);

	// Initialize global vars for first time
	if (!cats || !catsArr) {
		cats = Switch.categories;
		catsArr = Switch.categoriesArr;
	}

	// Add buttons to the switch msg, then send switch msg
	let omsg = await msg.channel.send({ embed: { color: 0x22d, title: "Please wait", description: "Currently configuring everything..." } });
	for (emoji of menuEmoijis) if (!Array.isArray(emoji) || emoji[0].length) await omsg.addReaction(Array.isArray(emoji) ? emoji[0] : emoji);
	omsg.edit(genSwitchEmbed(Switch));

	// Start message and reaction collectors
	// inputs holds all valid messages besides category/command names
	const inputs = ["help", "all", "exit", "save", "<", "undo", "mode", "return"];
	function messageFilter(m) {
		if (msg.author.id !== m.author.id) return false;
		if (inputs.includes(m.content.toLowerCase())) return true;
		let name;
		if (m.content.startsWith(">")) name = m.content.slice(1).toLowerCase();
		else name = m.content.toLowerCase();
		return (Switch.mode === "category" ? cats[Switch.category]["cmds"].includes(name) : catsArr.includes(name));
	}
	const reactionFilter = r => msg.author.id === r.userID && menuEmoijisNames.flat().includes(r.emoji.name);
	const MC = msg.channel.createMessageCollector(messageFilter, { time: 60e5 });
	const RC = omsg.createReactionCollector(reactionFilter, { time: 60e5 });

	// On emoji added
	RC.on("emoji", emoji => {
		if (![N_NOPE, N_CHANNEL].includes(emoji.name)) omsg.removeReaction(`${emoji.name}:${emoji.id}`, msg.author.id).catch(e => null);
		handleInput(emoji.name);
	});

	// On emoji removed
	const reactionRemoveFunction = (emoji, userID) => {
		if (userID !== msg.author.id) return;
		if (emoji.name === N_CHANNEL) {
			Switch.mode = "guild";
			omsg.edit(genSwitchEmbed(Switch));
		}
	};
	listeners.set(msg.channel.id, reactionRemoveFunction);

	// On message
	MC.on("message", m => {
		m.delete().catch(_ => null);
		const content = m.content.toLowerCase();

		let name;
		if (inputs.includes(content)) {
			handleInput(m.content);
		} else if (content.startsWith(">")) {
			name = m.content.slice(1).toLowerCase();
			Switch.category = name;
			Switch.mode = "category";
			omsg.edit(genSwitchEmbed(Switch));
			omsg.addReaction("⬅");
		} else {
			Switch.switch(content);
			omsg.edit(genSwitchEmbed(Switch));
		}
	});

	// Handle generic input from message/reaction
	// Switch for DRY code and easy to build on
	function handleInput(input = "") {
		switch (input) {
			case "exit":
			case N_NOPE:
				exit();
				break;

			case "save":
			case N_SAVE:
				omsg.edit(savingEmbed);
				Switch.save().then(() => {
					omsg.edit(genSwitchEmbed(Switch));
				}).catch(() => {
					omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
				});
				break;

			case "undo":
			case N_UNDO:
				Switch.undo();
				omsg.edit(genSwitchEmbed(Switch));
				break;

			case "mode":
			case N_CHANNEL:
				if (Switch.scope === "channel") Switch.mode = "guild";
				else Switch.mode = "channel";
				omsg.edit(genSwitchEmbed(Switch));
				break;


			case "return":
			case "<":
			case "⬅":
				Switch.mode = "global";
				omsg.edit(genSwitchEmbed(Switch));
				omsg.removeReaction("⬅");
				break;


			case "all":
				Switch.mode = "global";
				Switch.switch(Switch.category);
				Switch.mode = "category";
				omsg.edit(genSwitchEmbed(Switch));
				break;


			case "help":
				sendHelpEmbed(msg);
				break;

			default:
				return false;
		}
		return true;
	}

	// Exit function; too complex to put in Switch
	function exit() {
		// exit command
		omsg.removeReactions();
		switches.delete(msg.guild.id);
		MC.stop("User input");
		RC.stop("user input");
		omsg.edit(genSwitchEmbed(Switch, { disable: true }));

		// let's make sure they meant to leave without saving
		if (!Switch.saved) {
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
	}
};

/**
 * Function to make visualize Switch state
 * Returns Message params with MessageEmbed
 * @param {*} Switch the Switch instance for which to visualize
 * @param {*} options { disable: Bool }
 */
function genSwitchEmbed(Switch, options) {
	/**
	 * Notes; the different states.
	 * global
	 * - guild
	 * - - enabled
	 * - - partial : show amount on/off (mini versions)
	 * - - disabled
	 * - channel
	 * - - enabled
	 * - - enabled overwrite
	 * - - partial : show amount on/off (mini versions)
	 * - - partial overwrite : show amount on/off (mini versions)
	 * - - disabled
	 * - - disable overwrite
	 * 
	 * category
	 * - guild
	 * - - enabled
	 * - - disabled
	 * - channel
	 * - - enabled
	 * - - enabled overwrite
	 * - - disabled
	 * - - disabled overwrite
	 * 
	 */
	if (!Switch || !(Switch instanceof SwitchArch)) throw new TypeError("GenSwitchEmbed: Switch not of type Switch");

	const modules = Switch.modules,
		disable = options?.disable || false, // whether exited
		cat = Switch.mode === "category" ? Switch.category : null, // current category if any
		cmode = Switch.scope === "channel", // channel mode
		gdcmds = modules["gd"], // guild disabled
		cdcmds = modules["cd"], // channel disabled
		cecmds = modules["ce"]; // channel enabled

	const embed = {
		color: Switch.mode === "category" ? 0x7289da : 0xea6a3d, // TODO: change
		title: `${!cat ? "Category" : cat.slice(0, 1).toUpperCase() + cat.slice(1)} switches : ${cmode ? "**Channel**" : "**Server**"} mode`,
		fields: [],
	};
	if (!disable) embed.description += " | change with #\nType `help` for instructions.";

	if (!cat) {
		const gdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => gdcmds.includes(cmd)));
		const cdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cdcmds.includes(cmd)));
		const cenabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cecmds.includes(cmd)));

		for (let cat of catsArr) {
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