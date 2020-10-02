const readdirAsync = Promise.promisify(require("fs").readdir);

const cats = {};
let catsArr = [];
let cmdsArr = [];
/**
 * Function to load and sort categories
 * - Will not work on dashboard codebase
 */
function loadCategories(route = "./core/commands") {
	readdirAsync(route).then(async items => {
		for (item of items) {
			if (item.endsWith(".js")) {
				try {
					const cmd = require(`../${folder}/${command}`);
					if (cmd.hidden || cmd.pub === false || !cmd.cmd) continue;
					if (!cmd.cat) cmd.cat = "uncategorized";
					if (!cats[cmd.cat]) cats[cmd.cat] = { cmds: [] };
					cats[cmd.cat.toLowerCase()]["cmds"].push(cmd.cmd.toLowerCase());
				} catch (e) { null; }
			} else {
				toApply = await loadCategories(`${route}/${item}`);
				Object.assign(cats, toApply);
			}
		}
	}).finally(() => {
		// Fill and sort catsArr, cmdsArr
		catsArr = Object.keys(cats).sort();
		for (cat of catsArr) {
			cats[cat]["cmds"].sort();
			cmdsArr = [...cmdsArr, cats[cat]["cmds"]];
		}
	});
}
loadCategories();

module.exports = class Switch {
	guild;
	channel;

	gd = []; // Guild Disabled Commands
	cd = []; // Channel Disabled Commands
	ce = []; // Channel Enabled Commands

	history = []; // Keep a history
	maxHistory; // max length of history
	historyPointer = 0;

	_scope = "guild"; // (g)uild / (c)hannel
	_mode = "global"; // (g)lobal / (c)ategory
	catPointer = null; // Currently selected category
	unsaved = false; // Did we make any changes?

	static categories = cats; // { cat: [..., command, ...] }
	static categoriesArr = catsArr; // [..., category, ...] abc sorted
	static commandsArr = cmdsArr; // [..., command, ...] [category → abc] sorted

	/**
	 * SWITCH
	 * A per-channel command switch
	 * @param {Guild} Guild 
	 * @param {TextChannel} Channel 
	 * @param {number} maxHistory 
	 */
	constructor(Guild, Channel, maxHistory = 10) {
		if (!(Guild && Channel)) throw new Error("Switch: missing constructor arguments");
		if (maxHistory < 0) throw new Error("HistoryLength must be more than 0");
		if (Channel.guild.id !== Guild.id) throw new Error("Switch: Channel not a child of Guild");

		// Initiate modules
		this.guild = Guild;
		this.channel = Channel;
		this.load();

		// Initiate history
		this.maxHistory = maxHistory;
		this.save();
	}

	/*********************\
	 * GETTERS & SETTERS *
	\*********************/

	/** Get category */
	get category() {
		return this.catPointer;
	}
	set category(name = "") {
		name = name.toLowerCase();
		if (!catsArr.includes(name)) throw new TypeError("Switch set category: given name not a category");
		this.catPointer = name;
	}

	/**
	 * Get & Set current switch mode
	 * Modes: channel/guild | global/category
	 */
	get mode() {
		return this._mode;
	}
	set mode(newMode = "") {
		if (!newMode || typeof newMode !== "string") throw new TypeError("Switch - set mode: new mode has to be of type String");
		newMode = newMode.toLowerCase();
		if (!["channel", "guild", "global", "category"].includes(newMode)) return new Error("Switch - set mode: unknown mode\nAvailable: [guild/channel & global/category]");
		if (["channel", "guild"].includes(newMode)) this._scope = newMode;
		else this._mode = newMode;
	}

	/**
	 * Get current state of modules
	 */
	get modules() {
		return {
			gd: JSON.parse(JSON.stringify(this.gd)),
			cd: JSON.parse(JSON.stringify(this.cd)),
			ce: JSON.parse(JSON.stringify(this.ce)),
		};
	}
	set modules(modules) {
		if (!(modules.gd || modules.cd || modules.ce)) throw new TypeError("Switch - set modules: modules not in correct format.");
		if (modules.gd) this.gd = JSON.parse(JSON.stringify(gd));
		if (modules.cd) this.cd = JSON.parse(JSON.stringify(cd));
		if (mdoules.ce) this.ce = JSON.parse(JSON.stringify(ce));
	}

	/** whether it's saved */
	get saved() {
		return !this.unsaved;
	}
	/** Channel or guild scope */
	get scope() {
		return this._scope;
	}

	/***********\
	 * METHODS *
	\***********/

	/**
	 * Can be used for channel-switching
	 * - WARNING: history will be gone
	 * @param {TextChannel} TextChannel 
	 */
	setChannel(channel) {
		// check valid param
		if (!channel.guild?.id || channel.guild?.id !== this.guild.id) throw new TypeError("Channel has to be a child of the Guild this switch was instanciated with");
		this.history = [];
		this.channel = channel;
		return this._load();
	}

	_load() {
		// Load or create modules
		return Promise.all([
			DB.servers.get(this.guild.id),
			DB.channels.get(this.channel.id),
		]).then(([guildobj, channelobj]) => {
			if (!guildobj) guildobj = DB.guilds.new(this.guild);
			if (!channelobj) channelobj = DB.channels.new(this.channel);

			this.gd = guildobj.modules?.DISABLED || [];
			this.cd = channelobj.modules?.DISABLED || [];
			this.ce = channelobj.modules?.ENABLED || [];

			return this.modules;
		});
	}

	/**
	 * Goes one step forward in ...history?
	 * @param {number} amt
	 */
	redo(amt = 1) {
		if (this.historyPointer + amt === this.history.length - 1) return this.modules;
		this.historyPointer += amount;
		this.modules = this.history[this.historyPointer];
		return this.modules;
	}

	/**
	 * Saves current state to DB
	 */
	save() {
		return Promise.all([
			DB.servers.set(this.guild.id, { $set: { "modules.DISABLED": this.gd } }),
			DB.channels.set(this.channel.id, { $set: { "modules.DISABLED": this.cd, "modules.ENABLED": this.ce } }),
		]).then(() => {
			lastSaved = true;
			omsg.edit(genSwitchEmbed(Switch));
			return this.modules;
		}).catch(e => {
			MC.stop("error");
			RC.stop("error");
			throw new Error("Couldn't save changes");
		});
	}

	/**
	 * Switch state of a command or category
	 * @param {string} name cmd or cat name
	 */
	switch(name = "") {
		name = name.toLowerCase();
		const modules = this.modules;

		if (this.mode === "category") { // we're inside a category so cmd
			if (!cmdsArr.includes(name)) throw new TypeError(`Switch.switch(): Could not find given command: ${name}`);

			let disabledByGuild = modules.gd.includes(name);
			if (cmode) { // channel mode
				// GUILD DISABLED: neutral → on → off → neutral;
				// GUILD ENABLED: neutral → off → on → neutral;

				let enabledByChannel = modules.ce.includes(name);
				let disabledByChannel = modules.cd.includes(name);
				if (disabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
					// disable command
					modules.ce.splice(modules.ce.indexOf(name), 1);
					if (modules.cd.indexOf(name) === -1) modules.cd.push(name);
				} else if (disabledByGuild ? disabledByChannel : enabledByChannel) {
					// make neutral
					modules.cd.splice(modules.cd.indexOf(name), 1);
				} else {
					// enable command
					modules.ce.push(name);
				};
			} else { // guild mode
				if (disabledByGuild) modules.gd.splice(modules.gd.indexOf(name), 1);
				else modules.gd.push(name);
			}
		} else { // enabling/disabling an entire category.
			if (!catsArr.includes(name)) throw new TypeError(`Switch.switch(): Could not find category: ${name}`);

			let gnewdisabledcmds,
				cnewdisabledcmds,
				cnewenabledcmds;

			if (cmode) { // channel mode
				if (name === "all") {
					// neutral -> enabled -> disabled -> neutral...
					if (catsArr.every(cat => cats[cat]["cmds"]).every(cmd => modules.ce.includes(cmd))) {
						cnewenabledcmds === [];
						cnewdisabledcmds = catsArr.map(cat => cats[cat]["cmds"]).flat();
					} else if (catsArr.every(cat => cats[cat]["cmds"]).every(cmd => modules.cd.includes(cmd))) {
						cnewdisabledcmds = [];
					} else {
						cnewenabledcmds = catsArr.map(cat => cats[cat]["cmds"]).flat();
					}
				} else {
					const catcmds = cats[name]["cmds"];
					// GUILD MIX/DISABLED: neutral → on → off → neutral;
					// GUILD ENABLED: neutral → off → on → neutral;
					const enabledByChannel = catcmds.every(cmd => modules.ce.includes(cmd));
					const disabledByChannel = catcmds.every(cmd => modules.cd.includes(cmd));
					const someDisabledByGuild = catcmds.some(cmd => modules.gd.includes(cmd));

					if (someDisabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
						// disable cat
						cnewenabledcmds = modules.ce.filter(cmd => !catcmds.includes(cmd));
						cnewdisabledcmds = [...modules.cd, ...catcmds.filter(cmd => !modules.cd.includes(cmd))];
					} else if (someDisabledByGuild ? (disabledByChannel && !enabledByChannel) : enabledByChannel) {
						// make neutral
						cnewenabledcmds = modules.ce.filter(cmd => !catcmds.includes(cmd));
						cnewdisabledcmds = modules.cd.filter(cmd => !catcmds.includes(cmd));
					} else {
						// enable cat
						cnewenabledcmds = [...modules.ce, ...catcmds.filter(cmd => !modules.ce.includes(cmd))];
						cnewdisabledcmds = modules.cd.filter(cmd => !catcmds.includes(cmd));
					}
				}
			} else { // guild mode

				if (name === "all") {
					if (!modules.gd.length) gnewdisabledcmds = catsArr.map(cat => cats[cat]["cmds"]).flat();
					else gnewdisabledcmds = [];
				} else {
					const gdcmds = cats[name]["cmds"].filter(cmd => modules.gd.includes(cmd));
					if (gdcmds.length) gnewdisabledcmds = modules.gd.filter(cmd => !gdcmds.includes(cmd));
					else gnewdisabledcmds = [...modules.gd, ...cats[name]["cmds"]];
				}
			}
		}

		this.modules = {
			gd: gnewdisabledcmds || modules.gd,
			cd: cnewdisabledcmds || modules.cd,
			ce: cnewenabledcmds || modules.ce,
		};

		return this.modules;
	}

	/**
	 * Goes one step back in history
	 * @param {number} amt
	 */
	undo(amt = 1) {
		if (this.historyPointer - amt < 0) return this.modules;
		this.historyPointer--;
		this.modules = this.history[this.historyPointer];
		return this.modules;
	}
};