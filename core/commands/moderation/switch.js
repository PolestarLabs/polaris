// Create cat map with commands and other useful information
const cats = {};
for (command of PLX.commands) {
    if (command.hidden || command.pub === false) continue;
    if (!cats[command.cat]) cats[command.cat] = { cmds: [] };
    cats[command.cat]["cmds"].push(command.name);
}

// Sort to keep embed & indicators consistent
const catsArr = Object.keys(cats);
catsArr.sort();
for (cat of catsArr) cats[cat]["cmds"].sort();

// Get amount of emojis needed
let emojisNeeded = catsArr.length;
for (cat of catsArr) cats[cat]["cmds"].length;
let currentLetter = "a",
    indicatorArr = [];
for (let i = 0; i < emojisNeeded; i++) {if (i !== 0) currentLetter = String.fromCharCode(currentLetter.charCodeAt(0)); indicatorArr.push(`regional_indicator_${currentLetter}`);};
const menuEmoijis = ["❌", "💾", "➡️"];

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
    const P = { lngs: msg.lang, prefix: msg.prefix };
    if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

    if (switches.get(msg.guild.id)) return msg.reply("There is already a switch open in this guild");

    let mode = "g", // "c"
        currentCat =  null, // Category
        intoCat = false; // true

    const [guild, channel] = await Promise.all([
        DB.servers.get(msg.guild.id),
        DB.channels.get(msg.channel.id)
    ]);
    const modules = {
        gd: guild.modules.DISABLED,
        cd: channel.modules.DISABLED,
        ce: channel.modules.ENABLED,
    };
    const reactionFilter = r => {
        msg.author.id === r.userID &&
        (   menuEmoijis.includes(r.emoji.name) ||
            indicatorArr.includes(r.emoji.name)   );
    };

    let omsg = await msg.channel.send({ color: 0x22d, title: "Please wait", description: "Currently configuring everything..." });
    for (emoji in menuEmoijis) await omsg.addReaction(emoji);
    for (emoji in indicatorArr) await omsg.addReaction(emoji);

    omsg.edit(genSwitchEmbed(modules, mode, currentCat));

    const collector = omsg.createReactionCollector(reactionFilter, { });
    collector.on("emoji", emoji => {
        omsg.removeReaction(emoji.name, msg.author.id).catch(e => null);
        let length = currentCat ? cats[currentCat]["cmds"].length : catsArr.length; // 0 - emojisNeeded
        
        if (indicatorArr.slice(0, length-1).includes(emoji.name)) {
            // if the emoji is linked to a category or command
            const selector = indicatorArr.indexOf(emoji.name);
            if (intoCat) {
                // if intocat is enabled we go to the category's menu
                intoCat = false;
                currentCat = catsArr[selector];
            } else {
                // else we enable/disable a category/cmd
                const cmode = mode === "c";
                if (currentCat) {
                    // we're inside a category so cmd
                    const cmd = cats[currentCat]["cmds"][selector];
                    if (cmode) {
                        if (modules.cd.includes(cmd)) modules.cd.splice(modules.cd.indexOf(cmd), 1);
                        if (modules.gd.includes(cmd)) modules.ce.push(cmd);
                    } else {
                        if (modules.gd.includes(cmd)) modules.gd.splice(modules.gd.indexOf(cmd), 1);
                        else modules.gd.push(cmd);
                    }
                } else {
                    // enabling/disabling an entire category.
                    if (cmode) {
                        // channel mode 
                        let disabledcmds = cats[currentCat].filter(cmd => (cdcmds.includes(cmd) || gdcmds.includes(cmd) && !cecmds.includes(cmd)));
                        let gnewdisabledcmds,
                            cnewdisabledcmds,
                            cnewenabledcmds;
                        if (disabledcmds) {
                            // enable all commands, channel only takes presendence if some are disabled by guild // TODO: decide priority
                            cnewdisabledcmds = modules.cd.filter(cmd => !disabledcmds.includes(cmd));
                            disabledcmds = cats[currentCat].filter(cmd => gdcmds.includes(cmd));
                            cnewenabledcmds = [ ...modules.ce, ...disabledcmds ];          
                        } else {
                            // disable all commands, channel always takes presedence // TODO: decide priority
                            cnewdisabledcmds = [ ...modules.cd, ...cats[currentCat]["cmds"] ];
                            cnewenabledcmds = modules.ce.filter(cmd => !cats[currentCat].includes(cmd));
                        }
                        modules.gd = gnewdisabledcmds;
                        modules.cd = cnewdisabledcmds;
                        modules.ce = cnewenabledcmds;
                    } else {
                        // guild mode // TODO: decide priority
                        const disabledcmds = cats[currentCat].filter(cmd => gdcmds.includes(cmd));
                        let newdisabledcmds;
                        if (disabledcmds) newdisabledcmds = modules.gd.filter(cmd => !disabledcmds.includes(cmd));
                        else newdisabledcmds = [ ...modules.gd, cats[currentCat]["cmds"]];
                        modules.gd = newdisabledcmds;
                    }
                }
                omsg.edit(genSwitchEmbed(modules, mode, currentCat)); 
            }
        } else if (emoji.name === "➡️") {
            // button for selecting a category
            intoCat = !intoCat;
            omsg.edit(genSwitchEmbed(modules, mode, currentCat, intoCat));
        } else if (emoji.name === "💾") {
            // save button
            Promise.all([
                omsg.edit(savingEmbed),
                DB.servers.set(msg.guild.id, { $set: { "modules.DISABLED": gd } }),
                DB.channels.set(msg.channel.id, { $set: { "modules.DISABLED": cd, "modules.ENABLED": ce } }),
            ]).then(([nomsg, s, c]) => {
                if (!s.ok || !c.ok) {
                    collector.stop("error");
                    omsg.edit({ embed: { title: "Something went wrong...", description: "Could not save the changes" } }); // TODO: find normal error embed / just create an error
                } else {
                    omsg.edit(genSwitchEmbed(modules, mode, currentCat));
                }
            });
        } else if (emoji.name === "❌") {
            // exit command
            collector.stop("user input");
        };
    });
    collector.on("end", c => {
        omsg.removeReactions();
        switches.get(msg.guild.id).delete();
    });
};

function genSwitchEmbed(modules, mode, cat, intoCat) {
    const gdcmds = modules["gd"]; // guild disabled
    const cdcmds = modules["cd"]; // channel disabled
    const cecmds = modules["ce"]; // channel enabled
    const cmode = mode === "c"; // channel mode

    const embed = {
        color: 0x000, // TODO: change
        title: `${cat ? "Category" : cat.slice(0,1).toUpperCase() + cat.slice(1)} switches`,
        description: `Current mode: ${intoCat ? "Selecting a category" : cmode ? "Channel" : "Guild"} \n\nHere you can enable/disable commands & categories.\nUse the reactions below the embed.`,
        fields: [],
    };

    if (!cat) {
        const gdisabledcats = cats.filter(cat => cat["cmds"].all(cmd => gdcmds.includes(cmd)));
        const cdisabledcats = cats.filter(cat => cat["cmds"].all(cmd => !cecmds.includes(cmd) && (gdcmds.includes(cmd) || cdcmds.includes(cmd))));

        for (cat in catsArr) {
            const disabled = cmode ? cdisabledcats.includes(cat) : gdisabledcats.includes(cat),
                override = cmode && cdisabledcats.includes(cat) !== gdisabledcats.includes(cat),
                disabledCount = cats[cat].cmds.map(cmd => (gdcmds.includes(cmd) && (cmode ? !cecmds.includes(cmd) : true)) ? 1 : 0).reduce((a, b) => a + b, 0),
                letter = indicatorArr[catsArr.indexOf(cat)].substring(19).toUpperCase();

            embed.fields.push({
                name: disabled ? `:red_square: ~~${letter}.${cat}~~${override ? " **🇴**" : ""}` : disabledCount ? `:orange_square: ${letter}.${cat}${override ? " **🇴**" : ""}` : `:green_squre: ${letter}.${cat}${override ? " **🇴**" : ""}`,
                description: disabled ? "Disabled" : disabledCount ? `:x:${disabledCount}::white_check_mark:${cats[cat].cmds.length-disabledCount}` : "Enabled",
                inline: true,
            });
        }
    } else {
        let fieldCount = 1;
        let cmdCount = cats[arr]["cmds"].lenght;
        if (cmdCount > 10) {
            if (!(cmdCount % 3)) fieldCount = 3;
            else fieldCount = 2;
        }
        for (let i = 0; i < fieldCount; i++) embed.fields.push({ name: "\u200b", value: "" });
        let currField = 0;
        const cmds = cats[cat]["cmds"];
        for (cmd in cmds) {
            currField++;
            if (currField === fieldCount) currField = 0;
            const letter = indicatorArr[cmds.indexOf(cmd)].subString(19).toUpperCase(),
                disabled = cmode ? (cdcmds.includes(cmd) || (gdcmds.includes(cmd) && !cecmds.includes(cmd))) : gdcmds.includes(cmd),
                override = cmode && (disabled ? !gdcmds.includes(cmd) : gdcmds.includes(cmd));
            embeds.fields[currField].value += disabled ? `:red_square: ~~${letter}.${cmd}~~${override ? " **🇴**" : ""}` : `:green_square: ${letter}.${cmd}${override ? " **🇴**" : ""}`;
        }
    }

    return { embed };
};

module.exports = {
    init,
    pub: true,
    cmd: "switch",
    perms: 2,
    cat: "mod",
    aliases: [],
    botPerms: [],
    guildOnly: true,
  };