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
  if (PLX.blacklistedUsers.includes(msg.author.id)) {
    msg.addReaction(":BLACKLISTED_USER:406192511070240780");
    return false;
  }

  let uIDs;
  switch (msg.command.module) {
    case "_botOwner": uIDs = [cfg.owner]; break;
    case "_botStaff":
    case "dev": uIDs = cfg.admins; break;
    default: uIDs = [];
  }

  const GUILD = msg.guild || {};
  const switches = !(GUILD.DISABLED?.includes(msg.command.label) || GUILD.DISABLED?.includes(msg.command.cat));
  if (msg.author.looting === true) {
    msg.addReaction(_emoji("nope").reaction);
    return false;
  }
  const perms = msg.command.botPerms;
  if (perms && msg.channel.permissionsOf) {
    delete require.cache[require.resolve("./PermsCheck.js")];
    const permchk = require("./PermsCheck.js").run(msg.command.cat, msg, perms);
    if (permchk !== "ok") return false;
  }
  if (!switches) msg.commandDeny = true;
  return (switches && (!uIDs.length || uIDs.includes(msg.author.id)));
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
    }
    PLX.autoHelper("force", {
      msg, cmd: msg.command.cmd, opt: msg.command.cat, aliases: msg.command.aliases, scope: msg.command.scope, related: msg.command.related,
    });
  },
  cooldown: 3456.777,
  cooldownMessage: (msg) => `⏱ ${rand$t([`responses.cooldown.${msg.command.cmd}`, "responses.cooldown.generic"], { lngs: msg.lang })}`,
  cooldownReturns: 2,
  requirements: { custom: PERMS_CALC },
  permissionMessage: (msg) => (msg.commandDeny
    ? msg.channel.send($t("responses.toggle.disabledComSer", { lngs: msg.lang }))
    : msg.addReaction(_emoji("nope").reaction)),
  hooks: {
    preCommand: (m, a) => {
      m.args = a;
      m.lang = [m.channel.LANG || m.guild?.LANG || "en", "dev"];
      m.runtime = performance.now();
    },
    postCheck: (m, a, chk) => {
      if (!chk) return null;
      m.channel.sendTyping();
      commandRoutine.commLog(m, m.command);
      commandRoutine.updateMeta(m, m.command);
      return undefined;
    },
    postCommand: (m) => {
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
  errorMessage: function errorMessage(msg, err) {
    return ({
      embed: {
      // description: "Oh **no**! Something went wrong...\n"
      // + `If this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n
        description: "Oh **no**! Something went wrong...\n"
      + `If this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n${
        PLX.beta || cfg.testChannels.includes(msg.channel.id) ? ` \`\`\`js\n${err.stack}\`\`\`` : ""}`,
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
    commandFile.hidden = !commandFile.pub; // legacy port

    if (commandFile.noCMD) return null;

    const CMD = PLX.registerCommand(_cmd, commandFile.init, commandFile);
    // console.info("Register command: ".blue, _cmd.padEnd(20, ' '), " ✓".green)
    PLX.commands[CMD.label].cmd = commandFile.cmd;
    PLX.commands[CMD.label].cat = commandFile.cat;
    PLX.commands[CMD.label].scope = commandFile.scope;
    PLX.commands[CMD.label].related = commandFile.related;
    PLX.commands[CMD.label].module = folder;
    PLX.commands[CMD.label].botPerms = commandFile.botPerms;
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
    return undefined;
  } catch (e) {
    console.info(" SoftERR ".bgYellow, _cmd.padEnd(20, " ").yellow, e.message.red);
    // console.info("Register command: ".blue, _cmd.padEnd(20, ' ').yellow, " ✘".red)
    // console.error("\r                                " + e.message.red)
    return null;
  }
};
const registerCommands = (rel) => {
  if (rel) {
    Object.keys(PLX.commands).forEach((cmd) => PLX.unregisterCommand(cmd));
  }
  readdirAsync("./core/commands").then((modules) => {
    modules.forEach(async (folder) => {
      const commands = (await readdirAsync(`./core/commands/${folder}`)).map((_c) => _c.split(".")[0]);
      commands.forEach((_cmd) => registerOne(folder, _cmd));
    });
  });
};

module.exports = {
  registerCommands,
  commandRoutine,
  registerOne,
  DEFAULT_CMD_OPTS,
};
