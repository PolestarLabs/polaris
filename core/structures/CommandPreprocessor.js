const crypto = require("crypto");
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
  if (msg.channel.members) {
    if (!msg.channel.members.has(PLX.user.id)) {
      return null; // msg.addReaction( _emoji('channel').reaction  );
    }
  }

  if (!msg.content.includes("ev") && !msg.content.includes("activate") && PLX.isPRIME && msg.guild.prime === false) {
    msg.addReaction(":UNAUTHORIZED:773091703464525844");
    return false;
  }

  if (PLX.blacklistedUsers?.includes(msg.author.id)) {
    msg.addReaction(":BLACKLISTED_USER:406192511070240780");
    return false;
  }
  if ([ msg.command.cat, msg.command.module ].includes("nsfw") && !msg.channel.nsfw) {
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
    if (permchk !== "ok" && msg.channel.permissionsOf(PLX.user.id).has("addReactions")) return msg.addReaction(_emoji("CHECK_PERMISSIONS").reaction).catch((err) => console.error(`Messed up perms at ${msg.guild.id}`)), false;
  }
  if (msg.commandDenyChn || msg.commandDenySer) return msg.addReaction(_emoji("COMMAND_DISABLED").reaction), false;
  if (msg.command.disabled && [ ...cfg.admins, cfg.owner ].includes(msg.author.id)) return msg.addReaction(_emoji("COMMAND_DISABLED").reaction), false;

  return !uIDs.length || uIDs.includes(msg.author.id);
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
  cooldownMessage: (msg) => `⏱ ${rand$t([ `responses.cooldown.${msg.command.cmd}`, "responses.cooldown.generic" ], { lngs: msg.lang })}`,
  cooldownReturns: 2,
  cooldownExclusions: { guildIDs: ["789382326680551455"] },
  requirements: { custom: PERMS_CALC },
  permissionMessage: (msg) => { // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (msg.channel.members) {
      if (!msg.channel.members.has(PLX.user.id)) {
        return;// msg.addReaction( _emoji('channel').reaction  );
      }
    }

    msg.guild.disaReply
      ? msg.commandDenyChn
        ? msg.channel.send($t("responses.toggle.disabledComChn", { lngs: msg.lang, command: msg.command.label, channel: msg.channel.id }))
        : msg.commandDenySer
          ? msg.channel.send($t("responses.toggle.disabledComSer", { lngs: msg.lang, command: msg.command.label }))
          : msg.addReaction(_emoji("nope").reaction)
      : null;
  },
  hooks: {
    preCommand: async (m, a) => {
      if (PLX.isPRIME && m.guild && !m.guild?.prime) {
        await DB.users.findOne({ "prime.servers": m.guild.id }).cache()
          .then((usr) => {
            m.guild.prime = !!usr?.id;
          });
      }

      m.args = a;
      m.lang = [ m.channel.LANG || m.guild?.LANG || "en", "dev" ];
      m.runtime = performance.now();
      DB.users.new(m.author).catch((err) => null);
    },
    postCheck: (m, a, chk) => {
      if (!chk) return null;
      //if (m.command.sendTyping !== false) m.channel?.sendTyping();
      commandRoutine.commLog(m, m.command);
      commandRoutine.updateMeta(m, m.command);
      return undefined;
    },
    postCommand: (m, a, res) => {

    },
    postExecution: (m, a, status) => {
      if (!status) return;
      if (m.command.argsRequired && !a.length) return;

      global?.Progression?.emit(`command.${m.command.label}`, { msg: m });
      commandRoutine.saveStatistics(m, m.command);
      commandRoutine.administrateExp(m.author.id, m.command);
      const benchmark = performance.now() - m.runtime;

      INSTR.inc("command.usage", [ `shard:${m.guild?.shard?.id}`, `guild:${m.guild?.id}`, `command:${m.command.label}`, "status:executed" ]);
      INSTR.gauge("command.benchmark", benchmark, [ `shard:${m.guild?.shard?.id}`, `guild:${m.guild?.id}`, `command:${m.command.label}` ]);
      INSTR.gauge(`command.${m.command.label}.bench`, benchmark);

      if (m.content.includes("--bmk")) {
        m.channel.send({
          embed: {
            description: `⏱ ${runtimeOutput(benchmark)}`, color: status ? 0x3355cc : numColor(_UI.colors.red),
          },
        });
      }
    },
  },
  errorMessage: async function errorMessage(msg, err) {
    console.error(" COMMAND ERROR ".bgRed);
    console.error(err);
    const errorCode =  BigInt(`0x${crypto.createHash("md5").update(err.message + msg.command.label, "utf8")
      .digest("hex")}`).toString(24);
    INSTR.inc("command.errors", [ `shard:${msg.guild?.shard?.id}`, `guild:${msg.guild?.id}`, `command:${msg.command.label}`, "status:error" ]);

    const knownError = await DB.globals.findOne({code: errorCode, type: "errorCode", known: true });
    if (!knownError) await DB.globals.updateOne({code: errorCode},{ $set:{ known: false , type: "errorCode"},$inc:{ocurrences: 1} });
    else await DB.globals.updateOne({code: errorCode}, { $inc:{ocurrences: 1} });



    /*
    Sentry.setTag("module", msg.command.module);
    Sentry.setTag("type", "USER-FACING ERROR");
    Sentry.setContext("Command", {
      label: msg.command.label,
      author: msg.author.id
    });
    Sentry.setContext("Permissions", msg.channel.permissionsOf(PLX.user.id));
    {
      const { id, username, discriminator, createdAt, publicFlags, bot } = msg.author;
      Sentry.setContext("user", { id, username, discriminator, createdAt, publicFlags, bot });
    }
    {
      const { id, name, topic, nsfw } = msg.channel;
      Sentry.setContext("Channel", { id, name, topic, nsfw });
    }
    {
      const { name, id, ownerID, premiumSubscriptionCount, region, systemChannelID, createdAt, description, explicitContentFilter, joinedAt, memberCount } = msg.guild;
      Sentry.setContext("Guild", { name, id, ownerID, premiumSubscriptionCount, region, systemChannelID, createdAt, description, explicitContentFilter, joinedAt, memberCount });
    }

    Sentry.captureException(err, {
      user: {
        ip_address: msg.author.id,
        username: msg.author.username,
        id: msg.author.id
      }
    });

    */

    INSTR?.error(
      `User Facing Error: ${errorCode}`, err?.stack || err?.message || err || "UNKNOWN ERROR",
      {
        aggregation_key: errorCode,
        tags: {
          command: msg.command?.label || "unknown",
          cluster: PLX.cluster.name,
          shard: msg.guild?.shard?.id,
          error_code: errorCode,
          err_type: "UFE",
        },
      },
    );
    /*
    const hookResponse = await hook.error(`
    **User-Facing Error**
    \`\`\`js
${(err?.stack || err?.message || err || "UNKNOWN ERROR").slice(0, 1850)}
    \`\`\`
    **Command:** \`${msg.command.label || "NO-COMMAND-LABEL"}\`
    **CODE:** \`${errorCode}\`
    `, { hook: errorsHook });
    */
    msg.channel.send({
      embed: {
        // description: "Oh **no**! Something went wrong...\n"
        // + `If this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n
        description: "Oh **no**! Something went wrong...\n"
          + `If this issue persists, please stop by our [Support Channel](https://discord.gg/G6XvE9ZgRQ) to sort this out!\n${
          // PLX.beta || cfg.testChannels.includes(msg.channel.id)
          // ? ` \`\`\`js\n${err?.stack || err?.message || "UNKNOWN ERROR"}\`\`\``
          // ?
          `Error Code: **\`${errorCode}\`**` + 
          knownError?.details ? "<:statOPL:712316874511351869> **This is a known error!**"+
          `Root: ${knownError.details.cause}`+
          "Course of action:" +
          `${knownError.details.solution}`+
          "*Contact Support if the solution above does not work or if there's no solution available.*" 
          : ''
          // : ""
          }`,
        thumbnail: { url: `${paths.CDN}/build/assorted/error_aaa.gif?` },
        color: 0xF05060,
      },
    });
  },
  hidden: false,
};

function QUEUED_COMMAND(commandFile) {
  return (...args) => {
    if (PLX.maintenance) {
      if (args[0]?.guild.id == "277391723322408960" && args[0]?.channel.id != "488142034776096772") {
        return args[0]?.reply("🔧" + " • Maintenance ongoing.");
      }
      if (![ cfg.STAFF_GUILD, cfg.OFFICIAL_GUILD ].includes(args[0]?.guild.id)) return args[0]?.reply("🔧" + " • Maintenance ongoing.");
    }
    if (PLX.restarting) {
      return args[0]?.reply(`${_emoji("TIME1")} • Restart in progress... please wait up to a minute.`);
    }
    const execCommand =       typeof commandFile.init === "function"
      ? commandFile.init(...args)
      : typeof commandFile.gen === "function"
        ? commandFile.gen(...args)
        : null;
    if (!execCommand) return commandFile.init || commandFile.gen;

    // PLX.execQueue.push(new Promise((res, rej) =>
    // return execCommand.then(res).catch((e) => console.error(e) );
    // ));

    return execCommand;
  };
}

const registerOne = (folder, _cmd) => {
  // console.log("Register",folder,"/",_cmd)
  try {
    delete require.cache[require.resolve(`${CMD_FOLDER}/${folder}/${_cmd}`)];
    const commandFile = require(`${CMD_FOLDER}/${folder}/${_cmd}`);
    if (commandFile.slashable) {
//      require("./SlashCommandPreprocessor.js").proc(commandFile);
    }
    // commandFile.fill = function (_, $) { !(_ in this) && (this[_] = $) };
    commandFile.hidden = !commandFile.pub; // legacy port

    if (commandFile.disabled && !PLX.beta) return null;
    if (commandFile.noCMD) return null;

    const cmdQ = QUEUED_COMMAND(commandFile);
    const CMD = PLX.registerCommand(_cmd, cmdQ, commandFile);
    // console.info("Register command: ".blue, _cmd.padEnd(20, ' '), " ✓".green)
    PLX.commands[CMD.label].slashOptions = commandFile.slashOptions;
    PLX.commands[CMD.label].cmd = commandFile.cmd;
    PLX.commands[CMD.label].cat = commandFile.cat;
    PLX.commands[CMD.label].scope = commandFile.scope;
    PLX.commands[CMD.label].related = commandFile.related;
    PLX.commands[CMD.label].helpImage = commandFile.helpImage;
    PLX.commands[CMD.label].module = folder;
    PLX.commands[CMD.label].sendTyping = typeof commandFile.sendTyping === "boolean" ? commandFile.sendTyping : false;
    PLX.commands[CMD.label].botPerms = [ "attachFiles", "embedLinks", "addReactions", "externalEmojis", "manageMessages" ]
      .concat(commandFile.botPerms || []).filter((v, i, a) => a.indexOf(v) === i);
    if (commandFile.subs) {
      commandFile.subs.forEach((sub) => {
        delete require.cache[require.resolve(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`)];
        const subCfile = require(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`);

        CMD.registerSubcommand(sub, QUEUED_COMMAND(subCfile), subCfile);
      });
    }
    if (commandFile.teleSubs) {
      commandFile.teleSubs.forEach((TELE) => {
        delete require.cache[require.resolve(`${CMD_FOLDER}/${TELE.path}`)];
        const subCfile = require(`${CMD_FOLDER}/${TELE.path}`);

        CMD.registerSubcommand(TELE.label, (msg, args) => QUEUED_COMMAND(subCfile)(msg, args, TELE.pass), subCfile);
      });
    }
    if (commandFile.autoSubs) {
      commandFile.autoSubs.forEach((AUTOSUB) => {
        CMD.registerSubcommand(AUTOSUB.label, QUEUED_COMMAND(AUTOSUB), AUTOSUB.options);
      });
    }
    CMD.registerSubcommand("help", DEFAULT_CMD_OPTS.invalidUsageMessage);
    return { pass: true, cmd: _cmd, hidden: !commandFile.pub };
  } catch (e) {
    console.info(" SoftERR ".bgYellow, _cmd.padEnd(20, " ").yellow, e.message.red);

    INSTR.warn("Soft Error", e.stack, { aggregation_key: "soft_err", tags: { command: _cmd, err_type: "soft" } });

    return { pass: false, cmd: _cmd };
  }
};
const registerCommands = (rel) => {
  if (rel) {
    Object.keys(PLX.commands).forEach((cmd) => PLX.unregisterCommand(cmd));
  }
  readdirAsync("./core/commands").then((modules) => {
    let results = [];
    Promise.all(modules.map(async (folder) => {
      const commands = (await readdirAsync(`./core/commands/${folder}`)).map((_c) => _c.split(".")[0]);
      results = results.concat(commands.map((_cmd) => registerOne(folder, _cmd)).filter((x) => !!x));
    })).then((res) => {
      INSTR.info(
        "Commands Reloaded",
        `
      **Commands Reloaded**
        **${results.filter((_) => !!_.pass).length}** / ${results.length} commands registered.
        *(${results.filter((_) => _.hidden).length} hidden)*
        ${results.filter((_) => !_.pass).length} commands failed.
        ${results.filter((_) => !_.pass).length
    ? `
        \`\`\`js
        ${results.filter((_) => !_.pass).map((c) => ` • ${c.cmd}`)
    .join("\n")}
        \`\`\`
        ` : ""
}  `,
        { tags: { err_type: "soft" } },
      );
    })
      .catch(console.error);
  });
};

module.exports = {
  registerCommands,
  commandRoutine,
  registerOne,
  DEFAULT_CMD_OPTS,
  PERMS_CALC,
};
