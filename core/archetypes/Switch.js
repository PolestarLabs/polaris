const readdirAsync = Promise.promisify(require("fs").readdir);

/**
 * Function to load and sort categories
 * - Will not work on dashboard codebase
 */
function loadCategories(route = "") {
	return new Promise((resolve, reject) => {
		readdirAsync("./core/commands/" + route).then(async items => {
			let obj = {};
			for (item of items) {
				if (item.endsWith(".js")) {
					try {
						const cmd = require(`../commands/${route}/${item}`);
						if (cmd.hidden || cmd.pub === false || !cmd.cmd) continue;
						if (!cmd.cat) cmd.cat = "uncategorized";
						if (!obj[cmd.cat]) obj[cmd.cat] = { cmds: [] };
						obj[cmd.cat.toLowerCase()]["cmds"].push(cmd.cmd.toLowerCase());
					} catch (e) { console.warn(e); }
				} else if (!item.includes(".")) {
					await loadCategories(`${route}/${item}`).then(toApply => {
						Object.assign(obj, toApply);
					});
				}
			}
			resolve(obj);
		});
	});
}

/**
 * For some reason this loads less cmds
 */
function loadCategories2() {
	return new Promise((resolve, reject) => {
		const cats = {};
		const cmds = Object.keys(PLX.commands);
		cmds.forEach((cmd, index, arr) => {
			cmd = PLX.commands[cmd];
			if (cmd.hidden || cmd.pub === false || !cmd.cmd) return;
			if (!cmd.cat) cmd.cat = "uncategorized";
			if (!cats[cmd.cat]) cats[cmd.cat] = { cmds: [] };
			cats[cmd.cat.toLowerCase()]["cmds"].push(cmd.cmd.toLowerCase());
			if (index === arr.length - 1) resolve(cats);
		});
	});
}

/**
 * Just a way to get this loading to function before Switch is called
 */
class Categories {
	cats = {};
	catsArr = [];
	cmdsArr = [];

	constructor() {
		loadCategories().then(toApply => {
			this.cats = toApply;
			this.catsArr = Object.keys(this.cats).sort();
			for (let cat of this.catsArr) {
				this.cats[cat]["cmds"].sort();
				this.cmdsArr = [...this.cmdsArr, ...this.cats[cat]["cmds"]];
			}
		});
	}
}
const categories = new Categories;



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

	categories = categories.cats; // { cat: [..., command, ...] }
	categoriesArr = categories.catsArr; // [..., category, ...] abc sorted
	commandsArr = categories.cmdsArr; // [..., command, ...] [category → abc] sorted

	/**
	 * SWITCH
	 * A per-channel command switch
	 * @param {Guild} Guild 
	 * @param {TextChannel} Channel 
	 * @param {number} maxHistory 
	 */
	constructor(Guild, Channel, maxHistory = 10) {
		if (!(Guild && Channel)) throw new TypeError("Switch: missing constructor arguments");
		if (maxHistory < 0) throw new TypeError("maxHistory must be more than 0");
		if (Channel.guild.id !== Guild.id) throw new TypeError("Switch: Channel not a child of Guild");

		// Initiate modules - await load if timing problems arise.
		this.guild = Guild;
		this.channel = Channel;
		this._load();

		// Initiate history
		this.maxHistory = maxHistory;
		this._saveHistory();
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
		if (!this.categoriesArr.includes(name)) throw new TypeError("Switch set category: given name not a category");
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
		if (modules.gd) this.gd = JSON.parse(JSON.stringify(modules.gd));
		if (modules.cd) this.cd = JSON.parse(JSON.stringify(modules.cd));
		if (modules.ce) this.ce = JSON.parse(JSON.stringify(modules.ce));
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

			console.log("\n\nGUILD AND CHANNEL OBJECTS:\n");
			console.log(require("util").inspect(guildobj));
			console.log("\n\n\n");
			console.log(require("util").inspect(channelobj));
			console.log("\n\n\n");

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
			this.unsaved = false;
			return this.modules;
		}).catch(e => {
			MC.stop("error");
			RC.stop("error");
			throw new Error("Couldn't save changes");
		});
	}

	_saveHistory() {
		// to manage history
		if (this.historyPointer !== this.history.length - 1) this.history = this.history.slice(0, this.historyPointer);
		this.history.push(this.modules);
		this.historyPointer++;
		if (this.history.length > this.maxHistory) this.history.splice(0, 1);
	}

	/**
	 * Switch state of a command or category
	 * @param {string} name cmd or cat name
	 */
	switch(name = "") {
		this.unsaved = true;
		this._saveHistory();

		name = name.toLowerCase();
		const { ce, cd, gd } = this.modules;
		let gnewdisabledcmds,
			cnewdisabledcmds,
			cnewenabledcmds;

		console.log(require("util").inspect(this.modules));

		if (this._mode === "category") { // we're inside a category so cmd
			if (!this.commandsArr.includes(name)) throw new TypeError(`Switch.switch(): Could not find given command: ${name}`);

			let disabledByGuild = gd.includes(name);
			if (this._scope === "channel") { // channel mode
				// GUILD DISABLED: neutral → on → off → neutral;
				// GUILD ENABLED: neutral → off → on → neutral;

				let enabledByChannel = ce.includes(name);
				let disabledByChannel = cd.includes(name);
				if (disabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
					// disable command
					ce.splice(ce.indexOf(name), 1);
					if (cd.indexOf(name) === -1) cd.push(name);
				} else if (disabledByGuild ? disabledByChannel : enabledByChannel) {
					// make neutral
					if (disabledByChannel) cd.splice(cd.indexOf(name), 1);
					else ce.splice(ce.indexOf(name), 1);
				} else {
					// enable command
					if (ce.indexOf(name) === -1) ce.push(name);
				};
			} else { // guild mode
				if (disabledByGuild) gd.splice(gd.indexOf(name), 1);
				else gd.push(name);
			}
		} else { // enabling/disabling an entire category.
			if (!this.categoriesArr.includes(name)) throw new TypeError(`Switch.switch(): Could not find category: ${name}`);

			if (this._scope === "channel") { // channel mode
				if (name === "all") {
					// neutral -> enabled -> disabled -> neutral...
					if (this.categoriesArr.every(cat => this.categories[cat]["cmds"]).every(cmd => ce.includes(cmd))) {
						cnewenabledcmds === [];
						cnewdisabledcmds = this.categoriesArr.map(cat => this.categories[cat]["cmds"]).flat();
					} else if (this.categoriesArr.every(cat => this.categories[cat]["cmds"]).every(cmd => cd.includes(cmd))) {
						cnewdisabledcmds = [];
					} else {
						cnewenabledcmds = this.categoriesArr.map(cat => this.categories[cat]["cmds"]).flat();
					}
				} else {
					const catcmds = this.categories[name]["cmds"];
					// GUILD MIX/DISABLED: neutral → on → off → neutral;
					// GUILD ENABLED: neutral → off → on → neutral;
					const enabledByChannel = catcmds.every(cmd => ce.includes(cmd));
					const disabledByChannel = catcmds.every(cmd => cd.includes(cmd));
					const someDisabledByGuild = catcmds.some(cmd => gd.includes(cmd));

					if (someDisabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
						// disable cat
						cnewenabledcmds = ce.filter(cmd => !catcmds.includes(cmd));
						cnewdisabledcmds = [...cd, ...catcmds.filter(cmd => !cd.includes(cmd))];
					} else if (someDisabledByGuild ? (disabledByChannel && !enabledByChannel) : enabledByChannel) {
						// make neutral
						cnewenabledcmds = ce.filter(cmd => !catcmds.includes(cmd));
						cnewdisabledcmds = cd.filter(cmd => !catcmds.includes(cmd));
					} else {
						// enable cat
						cnewenabledcmds = [...ce, ...catcmds.filter(cmd => !ce.includes(cmd))];
						cnewdisabledcmds = cd.filter(cmd => !catcmds.includes(cmd));
					}
				}
			} else { // guild mode

				if (name === "all") {
					if (!gd.length) gnewdisabledcmds = this.categoriesArr.map(cat => this.categories[cat]["cmds"]).flat();
					else gnewdisabledcmds = [];
				} else {
					const gdcmds = this.categories[name]["cmds"].filter(cmd => gd.includes(cmd));
					if (gdcmds.length) gnewdisabledcmds = gd.filter(cmd => !gdcmds.includes(cmd));
					else gnewdisabledcmds = [...gd, ...this.categories[name]["cmds"]];
				}
			}
		}

		this.modules = {
			gd: gnewdisabledcmds || gd,
			cd: cnewdisabledcmds || cd,
			ce: cnewenabledcmds || ce,
		};

		console.log(require("util").inspect(this.modules));

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