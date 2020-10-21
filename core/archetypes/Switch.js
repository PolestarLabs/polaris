//@ts-check
const readdirAsync = Promise.promisify(require("fs").readdir);

/**
 * Function to load and sort categories
 * - Will not work on dashboard codebase
 */
function loadCategories(route = "") {
	return new Promise((resolve, reject) => {
		readdirAsync("./core/commands/" + route).then(async items => {
			let obj = {};
			for (let item of items) {
				if (item.endsWith(".js")) {
					try {
						const cmd = require(`../commands/${route}/${item}`);
						if (cmd.hidden || cmd.protected || cmd.pub === false || !cmd.cmd) continue;
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
		}).catch(err => {
			// Dashboard Fallback
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
let ready = false;
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
const categories = new Categories();



module.exports = class Switch {
	_guild;
	_channel;

	gd = []; // Guild Disabled Commands
	cd = []; // Channel Disabled Commands
	ce = []; // Channel Enabled Commands

	history = []; // Keep a history
	maxHistory; // max length of history
	historyPointer = -1;

	_scope = "guild"; // (g)uild / (c)hannel
	_mode = "global"; // (g)lobal / (c)ategory
	catPointer = null; // Currently selected category
	unsaved = false; // Did we make any changes?

	categories = categories.cats; // { cat: [..., command, ...] }
	categoriesArr = categories.catsArr; // [..., category, ...] abc sorted
	commandsArr = categories.cmdsArr; // [..., command, ...] [category → abc] sorted

	messageLink = null; // variable for command implementation

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
		this._guild = Guild;
		this._channel = Channel;
		this._load();

		// Initiate history
		this.maxHistory = maxHistory;
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
		if (!["channel", "guild", "global", "category"].includes(newMode)) throw new Error("Switch - set mode: unknown mode\nAvailable: [guild/channel & global/category]");
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
		if (!channel.guild?.id || channel.guild?.id !== this._guild.id) throw new TypeError("Channel has to be a child of the Guild this switch was instanciated with");
		this.history = [];
		this.historyPointer = 0;
		this._channel = channel;
		return this._load();
	}

	_load() {
		// Load or create modules
		return Promise.all([
			DB.servers.get(this._guild.id),
			DB.channels.get(this._channel.id),
		]).then(([guildobj, channelobj]) => {
			if (!guildobj) guildobj = DB.guilds.new(this._guild);
			if (!channelobj) channelobj = DB.channels.new(this._channel);

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
		if (this.historyPointer + amt > this.history.length - 1) return this.modules;
		this.historyPointer += amt;
		this.modules = this.history[this.historyPointer];
		return this.modules;
	}

	/**
	 * Saves current state to DB
	 */
	save() {
		return Promise.all([
			DB.servers.set(this._guild.id, { $set: { "modules.DISABLED": this.gd } }),
			DB.channels.set(this._channel.id, { $set: { "modules.DISABLED": this.cd, "modules.ENABLED": this.ce } }),
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
		if (this.historyPointer !== this.history.length - 1) this.history = this.history.slice(0, this.historyPointer + 1);
		this.history.push(this.modules);
		if (this.history.length > this.maxHistory) this.history.splice(0, 1);
		else this.historyPointer++;
		console.table(this.history);
		console.log(`Pointer: ${this.historyPointer}`);
	}

	/**
	 * Switch state of a command or category
	 * @param {string} name cmd/cat name or alternatively "all"
	 */
	switch(name = "") {
		name = name.toLowerCase();

		// initializing some values
		this.unsaved = true;
		if (!this.history.length) this._saveHistory();

		if (name === "all" && this.mode === "global") {
			// "all" inside a category means switch entire category on/neutral/off
			// which is the same logic as doing it from global view
			// so look outside this if statement for that code
			if (this.scope === "guild") {
				// if anything's disabled, enable everything
				// otherwise disable everything
				if (this.gd.length) this.guildAllEnable();
				else this.guildAllDisable();

				this._saveHistory();
				return this.modules;
			}

			if (this.scope === "channel") {
				// First enable everything, then disable, then neutral, then enable...
				if (this.categories.map(cat => cat.cmds).flat().every(cmd => this.gd.includes(cmd))) this.channelAllNeutral(); // all were disabled
				else if (this.categories.map(cat => cat.cmds).flat().every(cmd => this.ce.includes(cmd))) this.channelAllDisable(); // all were enabled
				else this.channelAllEnable(); // they were not all disabled nor all enabled

				this._saveHistory();
				return this.modules;
			}
		}

		if (this.mode === "global" && !(this.categoriesArr.includes(name) || name === "all")) throw new TypeError(`Switch.switch(): Could not find category: ${name}`);
		if (this.mode === "category" && !(this.commandsArr.includes(name) || name === "all")) throw new TypeError(`Switch.switch(): Could not find given command: ${name}`);

		if (this.scope === "guild") {
			if (this.mode === "global" || name === "all") {
				if (name === "all") name = this.catPointer;
				// ?? -> disable all -> enable all
				if (this.categories[name]["cmds"].every(cmd => this.gd.includes(cmd))) this.guildCategoryEnable(name);
				else this.guildCategoryDisable(name);

				this._saveHistory();
				return this.modules;
			}

			if (this.mode === "category" && name !== "all") {
				// disabled -> enabled, enabled -> disabled
				if (this.gd.includes(name)) this.guildCommandEnable(name);
				else this.guildCommandDisable(name);

				this._saveHistory();
				return this.modules;
			}
		}

		if (this.scope === "channel") {
			// GUILD MIX/DISABLED: neutral → on → off → neutral;
			// GUILD ENABLED: neutral → off → on → neutral;

			if (this.mode === "global" || name === "all") {
				if (name === "all") name = this.catPointer;
				const catcmds = this.categories[name]["cmds"];
				const enabledByChannel = catcmds.every(cmd => this.ce.includes(cmd));
				const disabledByChannel = catcmds.every(cmd => this.cd.includes(cmd));
				const someDisabledByGuild = catcmds.some(cmd => this.gd.includes(cmd));

				if (someDisabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
					this.channelCategoryDisable(name);
				} else if (someDisabledByGuild ? (disabledByChannel && !enabledByChannel) : enabledByChannel) {
					this.channelCategoryNeutral(name);
				} else {
					this.channelCategoryEnable(name);
				}

				this._saveHistory();
				return this.modules;
			}

			if (this.mode === "category") {
				const disabledByGuild = this.gd.includes(name);
				const enabledByChannel = this.ce.includes(name);
				const disabledByChannel = this.cd.includes(name);

				if (disabledByGuild ? enabledByChannel : (!enabledByChannel && !disabledByChannel)) {
					this.channelCommandDisable(name);
				} else if (disabledByGuild ? disabledByChannel : enabledByChannel) {
					this.channelCommandNeutral(name);
				} else {
					this.channelCommandEnable(name);
				};

				this._saveHistory();
				return this.modules;
			}
		}
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


	/**
	 * Some methods to shorten switch code and readable.
	 * Works like this.scope.mode.action;
	 */
	guildAllEnable() { this.gd = []; }
	guildAllDisable() { this.gd = Object.keys(this.categories).map(cat => this.categories[cat].cmds).flat(); }

	guildCategoryEnable(category) {
		this.gd = this.gd.filter(cmd => !this.categories[category]["cmds"].includes(cmd));
	}
	guildCategoryDisable(category) {
		this.gd = [...this.gd,
		...this.categories[category]["cmds"].filter(cmd => !this.gd.includes(cmd))];
	}

	guildCommandEnable(command) {
		if (this.gd.includes(command)) this.gd.splice(this.gd.indexOf(command), 1);
	}
	guildCommandDisable(command) {
		if (!this.gd.includes(command)) this.gd.push(command);
	}


	channelAllEnable() { this.cd = []; this.ce = this.categories.map(cat => cat.cmds).flat(); }
	channelAllNeutral() { this.cd = []; this.ce = []; }
	channelAllDisable() { this.ce = []; this.cd = this.categories.map(cat => cat.cmds).flat(); }

	channelCategoryEnable(category) {
		const cmds = this.categories[category]["cmds"];
		this.ce = [...this.ce, ...cmds.filter(cmd => !this.ce.includes(cmd))];
		this.cd = this.cd.filter(cmd => !cmds.includes(cmd));
	}
	channelCategoryNeutral(category) {
		const cmds = this.categories[category]["cmds"];
		this.ce = this.ce.filter(cmd => !cmds.includes(cmd));
		this.cd = this.cd.filter(cmd => !cmds.includes(cmd));
	}
	channelCategoryDisable(category) {
		const cmds = this.categories[category]["cmds"];
		this.ce = this.ce.filter(cmd => !cmds.includes(cmd));
		this.cd = [...this.cd, ...cmds.filter(cmd => !this.cd.includes(cmd))];
	}

	channelCommandEnable(command) {
		if (!this.ce.includes(command)) this.ce.push(command);
		if (this.cd.includes(command)) this.cd.splice(this.cd.indexOf(command), 1);
	}
	channelCommandNeutral(command) {
		if (this.ce.includes(command)) this.ce.splice(this.ce.indexOf(command), 1);
		if (this.cd.includes(command)) this.cd.splice(this.cd.indexOf(command), 1);
	}
	channelCommandDisable(command) {
		if (this.ce.includes(command)) this.ce.splice(this.ce.indexOf(command), 1);
		if (!this.cd.includes(command)) this.cd.push(command);
	}
};