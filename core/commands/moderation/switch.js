// Create cat map with commands and other useful information
const cats = {};
for (command of Object.keys(PLX.commands)) {
    command = PLX.commands[command];
    if (command.hidden || command.pub === false || !command.cmd) continue;
    if (!cats[command.cat]) cats[command.cat] = { cmds: [] };
    cats[command.cat]["cmds"].push(command.cmd);
}

// Sort to keep embed & indicators consistent
const catsArr = Object.keys(cats);
catsArr.sort();
for (cat of catsArr) cats[cat]["cmds"].sort();

// Menu emojis
const menuEmoijis = ["❌", "💾", "↩", ["➡", "⬅"]];

// Only one switch per guild to combat race conditions
const switches = new Map();

const savingEmbed = {
    embed: {
        color: 0x000, // TODO: change
        title: "Standby, saving changes...",
        description: "Both server and channel changes will be saved."
    }
};

const init = async(msg) => {
    if (msg.content.split(" ")[1]?.toLowerCase() === "-r") switches.delete(msg.guild.id);

    const P = { lngs: msg.lang, prefix: msg.prefix };
    if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

    if (switches.get(msg.guild.id)) return msg.reply("There is already a switch open in this guild");
    switches.set(msg.guild.id, this);

    let mode = "g", // "c"
        currentCat =  null, // Category
        intoCat = false; // true

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
    for (emoji of menuEmoijis) await omsg.addReaction(Array.isArray(emoji) ? emoji[0] : emoji);

    omsg.edit(genSwitchEmbed(modules, mode, currentCat));

    const messageFilter = m => msg.author.id === m.author.id && (currentCat ? cats[currentCat]["cmds"].includes(m.content.toLowerCase()) : catsArr.includes(m.content.toLowerCase()));
    const reactionFilter = r => msg.author.id === r.userID && menuEmoijis.flat().includes(r.emoji.name);
    const MC = msg.channel.createMessageCollector(messageFilter, { time: 60e5 });
    const RC = omsg.createReactionCollector(reactionFilter, { time: 60e5 });

    RC.on("emoji", emoji => {
        omsg.removeReaction(emoji.name, msg.author.id).catch(e => null);
        let length = currentCat ? cats[currentCat]["cmds"].length : catsArr.length; // 0 - emojisNeeded

        if (emoji.name === "➡") {
            // into cat button
            intoCat = !intoCat;
            omsg.edit(genSwitchEmbed(modules, mode, currentCat, intoCat));
        } else if (emoji.name === "⬅") {
            // undo button
            currentCat = null;
            omsg.edit(genSwitchEmbed(modules, mode, currentCat));
            omsg.removeReaction("⬅");
            omsg.addReaction("➡");
        } else if (emoji.name === "↩") {
            console.log("test");
            console.log(modules);
            Object.assign(modules, load());
            console.log(modules);
            omsg.edit(genSwitchEmbed(modules, mode, currentCat));
        } else if (emoji.name === "💾") {
            // save button
            Promise.all([
                omsg.edit(savingEmbed),
                DB.servers.set(msg.guild.id, { $set: { "modules.DISABLED": modules.gd } }),
                DB.channels.set(msg.channel.id, { $set: { "modules.DISABLED": modules.cd, "modules.ENABLED": modules.ce } }),
            ]).then(([nomsg, s, c]) => {
                if (!s.ok || !c.ok) {
                    MC.stop("error");
                    RC.stop("error");
                    omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
                } else {
                    omsg.edit(genSwitchEmbed(modules, mode, currentCat));
                }
            }).catch(e => {
                MC.stop("error");
                RC.stop("error");
                omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
            });
        } else if (emoji.name === "❌") {
            // exit command
            mode = "d";
            omsg.edit(genSwitchEmbed(modules, mode, currentCat));
            MC.stop("User input");
            RC.stop("user input");
        };
    });
    RC.on("end", c => {
        omsg.removeReactions();
        switches.delete(msg.guild.id);
    });

    MC.on("message", m => {
        m.delete().catch(_ => null);
        name = m.content.toLowerCase();
        if (intoCat) {
            // if intocat is enabled we go to the category's menu
            intoCat = false;
            currentCat = name;
            omsg.edit(genSwitchEmbed(modules, mode, currentCat)); 
            omsg.removeReaction("➡");
            omsg.addReaction("⬅");
        } else {
            save();
            updateModules(modules, mode, name, currentCat).then(updatedModules => {
                omsg.edit(genSwitchEmbed(updatedModules, mode, currentCat));
                Object.assign(modules, updatedModules)
            });
        }
    });
};

function genSwitchEmbed(modules, mode, cat, intoCat) {
    const gdcmds = modules["gd"]; // guild disabled
    const cdcmds = modules["cd"]; // channel disabled
    const cecmds = modules["ce"]; // channel enabled
    const cmode = mode === "c"; // channel mode

    const embed = {
        color: 0x000, // TODO: change
        title: `${!cat ? "Category" : cat.slice(0,1).toUpperCase() + cat.slice(1)} switches`,
        fields: [],
    };
    if (mode !== "d") embed.description = `${intoCat ? "**Selecting a category**" : `Current view: ${cmode ? "**Channel**" : "**Guild**"}`} \n\nType a categories name to change it's settings.`;

    if (!cat) {
        const gdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => gdcmds.includes(cmd)));
        const cdisabledcats = catsArr.filter(cat => cats[cat]["cmds"].every(cmd => !cecmds.includes(cmd) && (gdcmds.includes(cmd) || cdcmds.includes(cmd))));

        for (cat of catsArr) {
            const disabled = cmode ? cdisabledcats.includes(cat) : gdisabledcats.includes(cat),
                override = cmode && cdisabledcats.includes(cat) !== gdisabledcats.includes(cat),
                disabledCount = cats[cat].cmds.map(cmd => (gdcmds.includes(cmd) && (cmode ? !cecmds.includes(cmd) : true)) ? 1 : 0).reduce((a, b) => a + b, 0),
                catName = cat.slice(0,1).toUpperCase() + cat.slice(1);

            embed.fields.push({
                name: disabled ? `:red_square: ~~${catName}~~${override ? " **🇴**" : ""}` : disabledCount ? `:orange_square: ${catName}${override ? " **🇴**" : ""}` : `:green_square: ${catName}${override ? " **🇴**" : ""}`,
                value: disabled ? "Disabled" : disabledCount ? `\:x:${disabledCount} : \:white_check_mark:${cats[cat].cmds.length-disabledCount}` : "Enabled",
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
            const disabled = cmode ? (cdcmds.includes(cmd) || (gdcmds.includes(cmd) && !cecmds.includes(cmd))) : gdcmds.includes(cmd),
                override = cmode && (disabled ? !gdcmds.includes(cmd) : gdcmds.includes(cmd)),
                cmdName = cmd.slice(0,1).toUpperCase() + cmd.slice(1);
            embed.fields[currField].value += disabled ? `:red_square: ~~${cmdName}~~${override ? " **🇴**" : ""}\n` : `:green_square: ${cmdName}${override ? " **🇴**" : ""}\n`;
        }
    }

    return { embed };
};

function updateModules(modules, mode, name, cat) {
    return new Promise((resolve, reject) => {
        const cmode = mode === "c";
        if (cat) {
            // we're inside a category so cmd
            if (cmode) {
                if (modules.cd.includes(name)) modules.cd.splice(modules.cd.indexOf(name), 1);
                if (modules.gd.includes(name)) modules.ce.push(name);
            } else {
                if (modules.gd.includes(name)) modules.gd.splice(modules.gd.indexOf(name), 1);
                else modules.gd.push(name);
            }
        } else {
            // enabling/disabling an entire category.
            if (cmode) {
                // channel mode 
                let disabledcmds = cats[name]["cmds"].filter(cmd => (cdcmds.includes(cmd) || gdcmds.includes(cmd) && !cecmds.includes(cmd)));
                let gnewdisabledcmds,
                    cnewdisabledcmds,
                    cnewenabledcmds;
                if (disabledcmds.length) {
                    // enable all commands, channel only takes presendence if some are disabled by guild // TODO: decide priority
                    cnewdisabledcmds = modules.cd.filter(cmd => !disabledcmds.includes(cmd));
                    disabledcmds = cats[name]["cmds"].filter(cmd => gdcmds.includes(cmd));
                    cnewenabledcmds = [ ...modules.ce, ...disabledcmds ];          
                } else {
                    // disable all commands, channel always takes presedence // TODO: decide priority
                    cnewdisabledcmds = [ ...modules.cd, ...cats[name]["cmds"] ];
                    cnewenabledcmds = modules.ce.filter(cmd => !cats[name]["cmds"].includes(cmd));
                }
                modules.gd = gnewdisabledcmds;
                modules.cd = cnewdisabledcmds;
                modules.ce = cnewenabledcmds;
            } else {
                // guild mode // TODO: decide priority
                const disabledcmds = cats[name]["cmds"].filter(cmd => modules.gd.includes(cmd));
                let newdisabledcmds;
                if (disabledcmds.length) newdisabledcmds = modules.gd.filter(cmd => !disabledcmds.includes(cmd));
                else newdisabledcmds = [ ...modules.gd, ...cats[name]["cmds"]];
                modules.gd = newdisabledcmds;
            }
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