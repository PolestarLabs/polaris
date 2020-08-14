// Create cat map with commands and other useful information
const readdirAsync = Promise.promisify(require("fs").readdir);

const
    N_NOPE =  _emoji('nope').name,
    N_YEP  =  _emoji('yep').name,
    N_CHANNEL = _emoji('channel').name,
    N_SAVE    = _emoji('save').name,
    N_UNDO    = _emoji('undo').name,
    OVERRIDE    = _emoji('override'),

    R_NOPE =  _emoji('nope').reaction,
    R_YEP  =  _emoji('yep').reaction,

    R_UNDO    = _emoji('undo').reaction,
    R_SAVE    = _emoji('save').reaction,
    R_CHANNEL = _emoji('channel').reaction,

    MINI_ON  = _emoji('on_small'),
    MINI_OFF = _emoji('off_small');


const cats = {};
let ready = false;
let catsArr;
readdirAsync("./core/commands").then(async(modules) => {
    let counter = 0;
    modules.forEach(async (folder) => {
        const commands = (await readdirAsync(`./core/commands/${folder}`)).map((_c) => _c.split(".")[0]);
        for (command of commands) {
            try {
                const cmd = require(`../${folder}/${command}`);
                if (cmd.hidden || cmd.pub === false || !cmd.cmd) continue;
                if (!cats[cmd.cat]) cats[cmd.cat] = { cmds: [] };
                cats[cmd.cat]["cmds"].push(cmd.cmd);
            } catch (e) { null }
        }
        counter++;
        if (counter === modules.length) {
            // Sort to keep embed & indicators consistent
            catsArr = Object.keys(cats);
            catsArr.sort();
            for (cat of catsArr) cats[cat]["cmds"].sort();
            ready = true;
        }
    });
});

// Menu emojis
const menuEmoijis = [
    R_NOPE
    ,R_SAVE
    ,R_UNDO
    ,R_CHANNEL
     , ["", "⬅"]]; // ["➡", "⬅"]
// Menu emojis
const menuEmoijisNames = [
    N_NOPE
    ,N_SAVE
    ,N_UNDO
    ,N_CHANNEL
     , ["", "⬅"]]; // ["➡", "⬅"]

// Only one switch per guild to combat race conditions
const switches = new Map();

const savingEmbed = {
    embed: {
        color: 0x000, // TODO: change
        title: "Standby, saving changes...",
        description: "Both server and channel changes will be saved."
    }
};

const listeners = new Map();
PLX.on("messageReactionRemove", (msg, emoji, userID) => { if (listeners.has(msg.channel.id || msg.channel)) listeners.get(msg.channel.id || msg.channel)(emoji, userID); });

const init = async(msg) => {
    if (msg.content.split(" ")[1]?.toLowerCase() === "-r") switches.delete(msg.guild.id);

    const P = { lngs: msg.lang, prefix: msg.prefix };
    if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

    if (switches.get(msg.guild.id)) return msg.reply("There is already a switch open in this guild");
    if (!ready) return msg.reply("Whoops the command hasn't loaded yet, try again in a moment");
    switches.set(msg.guild.id, this);

    let mode = "g", // "c"
        currentCat =  null, // Category
        intoCat = false, // true
        lastSaved = true; // false

    let [guild, channel] = await Promise.all([
        DB.servers.get(msg.guild.id),
        DB.channels.get(msg.channel.id)
    ]);
    if (!guild) guild = DB.guilds.new(msg.guild);
    if (!channel) channel = DB.channels.new(msg.channel);


    const modules = {
        gd: guild.modules?.DISABLED || [],
        cd: channel.modules?.DISABLED || [],
        ce: channel.modules?.ENABLED || [],
    };
    const history = [];
    function save() {
        history.push(JSON.parse(JSON.stringify(modules)));
        if (history.length >= 10) history.splice(0, 1);
    }
    function load() {
        return history.splice(history.length - 1, 1)[0];
    }

    let omsg = await msg.channel.send({ embed: { color: 0x22d, title: "Please wait", description: "Currently configuring everything..." } });
    for (emoji of menuEmoijis) if(!Array.isArray(emoji) || emoji[0].length) await omsg.addReaction(Array.isArray(emoji) ? emoji[0] : emoji);

    omsg.edit(genSwitchEmbed(modules, mode, currentCat));

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
        if (![N_NOPE, N_CHANNEL ].includes(emoji.name)) omsg.removeReaction( emoji.name+":"+emoji.id, msg.author.id).catch(e => null);
        let length = currentCat ? cats[currentCat]["cmds"].length : catsArr.length; // 0 - emojisNeeded

        if (emoji.name === N_CHANNEL) {
            mode = "c";
            omsg.edit(genSwitchEmbed(modules, mode, currentCat, intoCat));
        } else if (emoji.name === "⬅") {
            // undo button
            currentCat = null;
            omsg.edit(genSwitchEmbed(modules, mode, currentCat));
            omsg.removeReaction("⬅");
            // omsg.addReaction("➡");
        } else if (emoji.name === N_UNDO ) {
            Object.assign(modules, load());
            omsg.edit(genSwitchEmbed(modules, mode, currentCat));
        } else if (emoji.name === N_SAVE) {
            // save button
            Promise.all([
                omsg.edit(savingEmbed),
                DB.servers.set(msg.guild.id, { $set: { "modules.DISABLED": modules.gd } }),
                DB.channels.set(msg.channel.id, { $set: { "modules.DISABLED": modules.cd, "modules.ENABLED": modules.ce } }),
            ]).then(([nomsg, s, c]) => {
                lastSaved = true;
                omsg.edit(genSwitchEmbed(modules, mode, currentCat));
            }).catch(e => {
                MC.stop("error");
                RC.stop("error");
                omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
            });
        } else if (emoji.name === N_NOPE ) {
            // exit command
            MC.stop("User input");
            RC.stop("user input");
            mode = "d" + mode;
            omsg.edit(genSwitchEmbed(modules, mode));

            // let's make sure they meant to leave without saving
            if (!lastSaved) {
                msg.channel.send({ embed: { color: 0x33D, title: "Oops! You didn't save your changes.", description: "Do you want to save your changes? (yes|no)" } }).then(savemsg => {
                    savemsg.addReaction(R_YEP);
                    savemsg.addReaction(R_NOPE);
                    Promise.race([
                        msg.channel.awaitMessages(m => msg.author.id === m.author.id && /yes|no/.test(m.content), { maxMatches: 1, time: 6e4 }),
                        savemsg.awaitReactions(r => msg.author.id === r.userID && [N_YEP, N_NOPE].includes(r.emoji.name), { maxMatches: 1, time: 6e4 }),
                    ]).then(r => {
                        if (r.length && (r[0].content?.toLowerCase() === "yes" || r[0].emoji?.name === N_YEP )) {
                            Promise.all([
                                savemsg.edit(savingEmbed),
                                DB.servers.set(msg.guild.id, { $set: { "modules.DISABLED": modules.gd } }),
                                DB.channels.set(msg.channel.id, { $set: { "modules.DISABLED": modules.cd, "modules.ENABLED": modules.ce } }),
                            ]).then(([nomsg, s, c]) => {
                                lastSaved = true;
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
            mode = "g";
            omsg.edit(genSwitchEmbed(modules, mode, currentCat, intoCat));
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
            omsg.edit(genSwitchEmbed(modules, mode, currentCat)); 
            omsg.removeReaction("➡");
            omsg.addReaction("⬅");
        } else {
            save();
            let nname = name === "all" && currentCat ? currentCat : name;
            let ncurrentCat = name === "all" ? null : currentCat;
            updateModules(modules, mode, nname, ncurrentCat).then(updatedModules => {
                omsg.edit(genSwitchEmbed(updatedModules, mode, currentCat));
                Object.assign(modules, updatedModules)
                lastSaved = false;
            });
        }
    });
};

function genSwitchEmbed(modules, mode, cat, intoCat) {
    const gdcmds = modules["gd"]; // guild disabled
    const cdcmds = modules["cd"]; // channel disabled
    const cecmds = modules["ce"]; // channel enabled
    const cmode = mode === "c" || mode.slice(1) === "c"; // channel mode

    const embed = {
        color: mode == "c" ? 0x7289da : 0xea6a3d, // TODO: change
        title: `${!cat ? "Category" : cat.slice(0,1).toUpperCase() + cat.slice(1)} switches`,
        fields: [],
    };
    embed.description = intoCat ? "**Selecting a category**" : `Current view: ${cmode ? "**Channel**" : "**Guild**"}`;
    if (!mode.startsWith("d")) embed.description += "\n\nType a categories name to change it's settings.";

    if (!cat) {
        const gdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => gdcmds.includes(cmd)));
        const cdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cdcmds.includes(cmd)));
        const cenabledcats =  catsArr.filter(cat => cats[cat]["cmds"].every(cmd => cecmds.includes(cmd)));
        
        for (cat of catsArr) {
            const disabled = cmode ? (gdisabledcats.includes(cat) || cdisabledcats.includes(cat)) && !cenabledcats.includes(cat) : gdisabledcats.includes(cat),
                override = cmode && (cats[cat]["cmds"].some(cmd => cdcmds.includes(cmd) || cecmds.includes(cmd))),
                disabledCount = cats[cat].cmds.map(cmd => ((gdcmds.includes(cmd) || (cmode ? cdcmds.includes(cmd) : false)) && (cmode ? !cecmds.includes(cmd) : true)) ? 1 : 0).reduce((a, b) => a + b, 0),
                catName = cat.slice(0,1).toUpperCase() + cat.slice(1);

            embed.fields.push({
                name: disabled ? `${_emoji('off')} ~~${catName}~~` : disabledCount ? `${_emoji('partial')} ${catName}` : `${_emoji('on')} ${catName}` + (override ? ` ${OVERRIDE}`  : ""),
                value: disabledCount && !disabled ? `${MINI_ON}${cats[cat].cmds.length-disabledCount}  ${MINI_OFF}${disabledCount} ` : `${cats[cat]["cmds"].length} commands`,
                inline: true,
            });
        }
    } else {
        let fieldCount = 1;
        let cmdCount = cats[cat]["cmds"].length;
        if (cmdCount > 10) {
            if (!(cmdCount % 3)) fieldCount = 3;
            else fieldCount = 2;
        }
        for (let i = 0; i < fieldCount; i++) embed.fields.push({ name: "\u200b", value: "" });
        let currField = 0;
        const cmds = cats[cat]["cmds"];
        for (cmd of cmds) {
            currField++;
            if (currField === fieldCount) currField = 0;
            const disabled = cmode ? (cdcmds.includes(cmd) || (gdcmds.includes(cmd)) && !cecmds.includes(cmd)) : gdcmds.includes(cmd),
                override = cmode && (cdcmds.includes(cmd) || cecmds.includes(cmd)),
                cmdName = cmd.slice(0,1).toUpperCase() + cmd.slice(1);
            embed.fields[currField].value += disabled ? `${_emoji('off')} ~~${cmdName}~~${override ? ` ${OVERRIDE}`  : ""}\n` : !override ? `${_emoji('onoff_neutral')} ${cmdName}\n` : `${_emoji('on')} ${cmdName}${override ? ` ${OVERRIDE}`  : ""}\n`;
        }
    }

    if (embed.fields.length % 3) embed.fields.push({ name: "\u200b", value: "\u200b", inline: true });
    return { embed };
};

function updateModules(modules, mode, name, cat) {
    return new Promise((resolve, reject) => {
        const cmode = mode === "c";
        if (cat) { // we're inside a category so cmd
            if (cmode) { // channel mode

                // neutral -> enabled -> disabled -> neutral...
                if (modules.ce.includes(name)) {
                    modules.ce.splice(modules.ce.indexOf(name), 1);
                    if (modules.cd.indexOf(name) === -1) modules.cd.push(name);
                } else if (modules.cd.includes(name)) {
                    modules.cd.splice(modules.cd.indexOf(name), 1);
                } else {
                    modules.ce.push(name);
                };
            } else { // guild mode

                if (modules.gd.includes(name)) modules.gd.splice(modules.gd.indexOf(name), 1);
                else modules.gd.push(name);
            }
        } else { // enabling/disabling an entire category.
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
                    catcmds = cats[name]["cmds"];
                    // neutral -> enabled -> disabled -> neutral...
                    if (catcmds.every(cmd => modules.ce.includes(cmd))) {
                        cnewenabledcmds = modules.ce.filter(cmd => !catcmds.includes(cmd));
                        cnewdisabledcmds = [ ...modules.cd, ...catcmds.filter(cmd => !modules.cd.includes(cmd)) ];
                    } else if (catcmds.every(cmd => modules.cd.includes(cmd))) {
                        cnewenabledcmds = modules.ce.filter(cmd => !catcmds.includes(cmd));
                        cnewdisabledcmds = modules.cd.filter(cmd => !catcmds.includes(cmd));
                    } else {
                        cnewenabledcmds = [ ...modules.ce, ...catcmds.filter(cmd => !modules.ce.includes(cmd)) ];
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
                    else gnewdisabledcmds = [ ...modules.gd, ...cats[name]["cmds"]];
                }
            }
            modules.gd = gnewdisabledcmds || modules.gd;
            modules.cd = cnewdisabledcmds || modules.cd;
            modules.ce = cnewenabledcmds || modules.ce;
        }
        resolve(modules);
    });
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