const { performance } = require("perf_hooks");
// const gear = require('../utilities/Gearbox/global');
const readdirAsync = Promise.promisify(require("fs").readdir);
const cfg = require("../../config.json");

const runtimeOutput = (rtm) => {
  if (rtm * 1000 < 1000) return `${Math.floor(rtm * 1000)}μs `;
  if (rtm < 1000) return `${rtm.toFixed(2)}ms `;
  return `${(rtm / 1000).toFixed(2)}s `;
};

const commandRoutine = require("../subroutines/onEveryCommand");

const CMD_FOLDER = "../commands/";

/*
const POST_EXEC = function CommandPostExecution(msg, args, success) {
  if (success) return null;
  return "exec fail";
};
*/

const PERMS_CALC = function CommandPermission(msg) {
  if (PLX.blacklistedUsers?.includes(msg.author.id)) {
    msg.addReaction(":BLACKLISTED_USER:406192511070240780");
    return false;
  }
  if ([msg.command.cat, msg.command.module].includes("nsfw") && !msg.channel.nsfw) {
    msg.channel.send($t("responses.errors.not-a-NSFW-channel", { lngs: msg.lang }));
    return false;
  }

  let uIDs;
  switch (msg.command.module) {
    case "_botOwner": uIDs = [cfg.owner]; break;
    case "_botStaff":
    case "dev": uIDs = cfg.admins.concat(cfg.owner); break;
    default: uIDs = [];
  }

  const GUILD = msg.guild || {};
  const CHANNEL = msg.channel || {};
  if (!CHANNEL.ENABLED?.includes(msg.command.label)) {
    if (CHANNEL.DISABLED?.includes(msg.command.label)) {
      msg.commandDenyChn = true;
    } else if (GUILD?.DISABLED?.includes(msg.command.label)) {
      msg.commandDenySer = true;
    }
  }

  if (msg.author.looting === true) {
    msg.addReaction(_emoji("nope").reaction);
    return false;
  }
  const perms = msg.command.botPerms;
  if (perms && msg.channel.permissionsOf) {
    delete require.cache[require.resolve("./PermsCheck.js")];
    const permchk = require("./PermsCheck.js").run(msg.command.cat, msg, perms);
    if (permchk !== "ok") return msg.addReaction(_emoji("CHECK_PERMISSIONS").reaction).catch((err) => console.error(`Messed up perms at ${msg.guild.id}`)), false;
  }
  if (msg.commandDenyChn || msg.commandDenySer) return msg.addReaction(_emoji("COMMAND_DISABLED").reaction), false;
  if(msg.command.disabled && [...cfg.admins,cfg.owner].includes(msg.author.id)) return msg.addReaction(_emoji('COMMAND_DISABLED').reaction), false;

  return (!uIDs.length || uIDs.includes(msg.author.id));
};

const DEFAULT_CMD_OPTS = {
  caseInsensitive: true,
  invalidUsageMessage: (msg) => {
    if (msg.command.parentCommand) {
      msg.command.cmd = msg.command.parentCommand.cmd;
      msg.command.cat = msg.command.parentCommand.cat;
      msg.command.scope = msg.command.parentCommand.scope;
      msg.command.related = msg.command.parentCommand.related;
      msg.command.aliases = msg.command.parentCommand.aliases;
      msg.command.helpImage = msg.command.parentCommand.helpImage;
    }

    PLX.autoHelper("force", {
      msg,
      cmd: msg.command.cmd,
      opt: msg.command.cat,
      aliases: msg.command.aliases,
      scope: msg.command.scope,
      related: msg.command.related,
      helpImage: msg.command.helpImage,
    });
  },
  cooldown: 3456.777,
  cooldownMessage: (msg) => `⏱ ${rand$t([`responses.cooldown.${msg.command.cmd}`, "responses.cooldown.generic"], { lngs: msg.lang })}`,
  cooldownReturns: 2,
  cooldownExclusions: { guildIDs: ["789382326680551455"] },
  requirements: { custom: PERMS_CALC },
  permissionMessage: (msg) => { // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    msg.guild.disaReply
      ? msg.commandDenyChn
        ? msg.channel.send($t("responses.toggle.disabledComChn", { lngs: msg.lang, command: msg.command.label, channel: msg.channel.id }))
        : msg.commandDenySer
          ? msg.channel.send($t("responses.toggle.disabledComSer", { lngs: msg.lang, command: msg.command.label }))
          : msg.addReaction(_emoji("nope").reaction)
      : null;
  },
  hooks: {
    preCommand: (m, a) => {
      m.args = a;
      m.lang = [m.channel.LANG || m.guild?.LANG || "en", "dev"];
      m.runtime = performance.now();
    },
    postCheck: (m, a, chk) => {
      if (!chk) return null;
      if (m.command.sendTyping !== false) m.channel.sendTyping();
      commandRoutine.commLog(m, m.command);
      commandRoutine.updateMeta(m, m.command);
      return undefined;
    },
    postCommand: (m) => {
      Progression.emit(`command.${m.command.label}`, { msg: m });
      commandRoutine.saveStatistics(m, m.command);
      commandRoutine.administrateExp(m.author.id, m.command);
      if (m.content.includes("--bmk")) {
        m.channel.send({
          embed: {
            description: `⏱ ${runtimeOutput(performance.now() - m.runtime)}`, color: 0x3355cc,
          },
        });
      }
    },
  },
  errorMessage: async function errorMessage(msg, err) {
    console.error(" COMMAND ERROR ".bgRed);
    console.error(err);
    const errorCode = `0x${(Date.now()).toString(16).toUpperCase()}`;

    const hookResponse = await hook.error(`
    **User-Facing Error**
    \`\`\`js
${(err?.stack || err?.message || "UNKNOWN ERROR").slice(0, 1850)}
    \`\`\`
    **Command:** \`${msg.command.label || "NO-COMMAND-LABEL"}\`
    **CODE:** \`${errorCode}\`
    `, { hook: errorsHook });

    msg.channel.send({
      embed: {
        // description: "Oh **no**! Something went wrong...\n"
        // + `If this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n
        description: "Oh **no**! Something went wrong...\n"
          + `If this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n${
            PLX.beta || cfg.testChannels.includes(msg.channel.id)
            // ? ` \`\`\`js\n${err?.stack || err?.message || "UNKNOWN ERROR"}\`\`\``
              ? `Error Code: [**\`${errorCode}\`**](${hookResponse.jumpLink})`
              : ""
          }`,
        thumbnail: { url: `${paths.CDN}/build/assorted/error_aaa.gif?` },
        color: 0xF05060,
      },
    });
  },
  hidden: false,
};

const registerOne = (folder, _cmd) => {
  try {
    delete require.cache[require.resolve((`${CMD_FOLDER}/${folder}/${_cmd}`))];
    const commandFile = require(`${CMD_FOLDER}/${folder}/${_cmd}`);
    // commandFile.fill = function (_, $) { !(_ in this) && (this[_] = $) };
    commandFile.hidden = !commandFile.pub;  // legacy port
    
    if(commandFile.disabled && !PLX.beta) return null;
    if (commandFile.noCMD) return null;

    const CMD = PLX.registerCommand(_cmd, commandFile.init, commandFile);
    // console.info("Register command: ".blue, _cmd.padEnd(20, ' '), " ✓".green)
    PLX.commands[CMD.label].cmd = commandFile.cmd;
    PLX.commands[CMD.label].cat = commandFile.cat;
    PLX.commands[CMD.label].scope = commandFile.scope;
    PLX.commands[CMD.label].related = commandFile.related;
    PLX.commands[CMD.label].helpImage = commandFile.helpImage;
    PLX.commands[CMD.label].module = folder;
    PLX.commands[CMD.label].sendTyping = typeof commandFile.sendTyping === "boolean" ? commandFile.sendTyping : true;
    PLX.commands[CMD.label].botPerms = ["attachFiles", "embedLinks", "externalEmojis"]
      .concat(commandFile.botPerms || []).filter((v, i, a) => a.indexOf(v) === i);
    if (commandFile.subs) {
      commandFile.subs.forEach((sub) => {
        delete require.cache[require.resolve(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`)];
        const subCfile = require(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`);

        CMD.registerSubcommand(sub, subCfile.init, subCfile);
      });
    }
    if (commandFile.teleSubs) {
      commandFile.teleSubs.forEach((TELE) => {
        delete require.cache[require.resolve(`${CMD_FOLDER}/${TELE.path}`)];
        const subCfile = require(`${CMD_FOLDER}/${TELE.path}`);

        CMD.registerSubcommand(TELE.label, (msg, args) => subCfile.init(msg, args, TELE.pass), subCfile);
      });
    }
    if (commandFile.autoSubs) {
      commandFile.autoSubs.forEach((AUTOSUB) => {
        CMD.registerSubcommand(AUTOSUB.label, AUTOSUB.gen, AUTOSUB.options);
      });
    }
    CMD.registerSubcommand("help", DEFAULT_CMD_OPTS.invalidUsageMessage);
    return { pass: true, cmd: _cmd, hidden: !commandFile.pub };
  } catch (e) {
    console.info(" SoftERR ".bgYellow, _cmd.padEnd(20, " ").yellow, e.message.red);
    hook.error(`
    **Command Soft Error**
    \`\`\`js
${e.stack.slice(0, 1900)}
    \`\`\`
    The command \`${_cmd}\` was **not** loaded!
    `, { hook: errorsHook });
    // console.info("Register command: ".blue, _cmd.padEnd(20, ' ').yellow, " ✘".red)
    // console.error("\r                                " + e.message.red)
    return { pass: false, cmd: _cmd };
  }
};
const registerCommands = (rel) => {
  if (rel) {
    Object.keys(PLX.commands).forEach((cmd) => PLX.unregisterCommand(cmd));
  }
  readdirAsync("./core/commands").then((modules) => {
    let results = [];
    Promise.all(
      modules.map(async (folder) => {
        const commands = (await readdirAsync(`./core/commands/${folder}`)).map((_c) => _c.split(".")[0]);
        results = results.concat(commands.map((_cmd) => registerOne(folder, _cmd)).filter((x) => !!x));
        // console.log({folder},{results})
      }),
    ).then((res) => {
      // console.log({res,results})
      hook.info(`
      **Commands Reloaded**
${_emoji("yep")} **${results.filter((_) => !!_.pass).length}** / ${results.length} commands registered.
${_emoji("maybe")} *(${results.filter((_) => _.hidden).length} hidden)*
${_emoji("nope")} ${results.filter((_) => !_.pass).length} commands failed.
${results.filter((_) => !_.pass).length
    ? `
\`\`\`js
${results.filter((_) => !_.pass).map((c) => ` • ${c.cmd}`).join("\n")}
\`\`\`
` : ""
}  `);
    });
  });
};

module.exports = {
  registerCommands,
  commandRoutine,
  registerOne,
  DEFAULT_CMD_OPTS,
  PERMS_CALC,
};
