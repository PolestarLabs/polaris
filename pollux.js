// STARTUP FLAIR
// process.stdout.write("\x1Bc");

console.log(require("./resources/asciiPollux.js").ascii());
// ===========================================

global.Promise = require("bluebird");
global.clusterNames = require("./resources/lists/clusters.json");
global.GNums = require("./resources/lists/GlobalNumbers.js");


const Sentry          = require("@sentry/node");
const { performance } = require("perf_hooks");
const path            = require("path");
const ERIS            = require("eris");
const axios           = require("axios");
const Eris            = require("eris-additions")(ERIS);
const readdirAsync    = Promise.promisify(require("fs").readdir);
const cmdPreproc      = require("./core/structures/CommandPreprocessor");
const cfg             = require("./config.json");
const WebhookDigester = require("./utils/WebhookDigester.js");
// Eris Mods-----//
require("./core/structures/ReactionCollector.js")(ERIS);

const runtime         = performance.now();
global.appRoot = path.resolve(__dirname);
Sentry.init({ dsn: cfg.sentryDSN });
Promise.config({ longStackTraces: true });
require("./utils/paths").run();

Eris.Guild.prototype.member = function member(user) {
  if (!user) return null;
  user = user.id || user;
  return this.members.find((usr) => usr.id === user.id || usr.id === user);
};
Eris.Embed.prototype.setColor = function setColor(color) {
  this.color = parseInt(color.replace(/^#/, ""), 16);
  return this;
};

const SHARDS_PER_CLUSTER = parseInt(process.env.SHARDS_PER_CLUSTER, 10) || 1;
const CLUSTER_ID = parseInt(process.env.CLUSTER_ID, 10) || 0;
const TOTAL_SHARDS = parseInt(process.env.TOTAL_SHARDS, 10) || 1;

console.table({
  SHARDS_PER_CLUSTER,
  CLUSTER_ID,
  TOTAL_SHARDS,
});

global.PLX = new Eris.CommandClient(cfg.token, {
  maxShards: TOTAL_SHARDS,
  firstShardID: (SHARDS_PER_CLUSTER * CLUSTER_ID),
  lastShardID: SHARDS_PER_CLUSTER * (CLUSTER_ID + 1) - 1,
  defaultImageSize: 512,
  restMode: true,
  defaultImageFormat: "png",
  intents: 5767,
  disableEvents: {
    TYPING_START: true,
    TYPING_STOP: true,
    GUILD_MEMBER_SPEAKING: true,
  },
}, {
  defaultHelpCommand: false,
  ignoreBots: true,
  defaultCommandOptions: cmdPreproc.DEFAULT_CMD_OPTS,
  prefix: ["===", "p!+", "@mention"],
});


global.MARKET_TOKEN = cfg["pollux-api-token"];

PLX.engine = Eris;
PLX.beta = process.env.NODE_ENV !== "production";
PLX.maintenance = process.env.maintenance;
PLX.cluster = { id: CLUSTER_ID, name: clusterNames[CLUSTER_ID] };
console.report = (...args) =>  console.log(` ${PLX.cluster.name} `.white.bgBlue + " • ".gray + [...args].join(' '));
global.hook = new WebhookDigester(PLX);

Gearbox = require("./core/utilities/Gearbox");

Object.assign(global, Gearbox.Global);
Object.assign(PLX, Gearbox.Client);

//= ======================================//
//      INTERNAL POOLS
//= ======================================//

PLX.execQueue = [];
PLX.commandPool = {};

global._emoji = (E, F) => new (require("./resources/lists/emoji.js")).PolluxEmoji(E, F);

PLX.registerCommands = cmdPreproc.registerCommands;
PLX.registerOne = cmdPreproc.registerOne;

PLX.blackListedUsers = [];
PLX.blackListedServers = [];
PLX.updateBlacklists = (DB) => Promise.all([
  DB.users.find({ blacklisted: { $exists: true } }, { id: 1, _id: 0 }).lean().exec(),
  DB.servers.find({ blacklisted: { $exists: true } }, { id: 1, _id: 0 }).lean().exec(),
]).then(([users, servers]) => {
  PLX.blacklistedUsers = (users || []).map((usr) => usr.id);
  PLX.blacklistedServers = (servers || []).map((svr) => svr.id);
});

const DBSchema = require("@polestar/database_schema");

const dbConnectionData = {
  hook,
  url: cfg.dbURL,
  options: {
    useNewUrlParser: true,
    keepAlive: 1,
    connectTimeoutMS: 8000,
    useUnifiedTopology: true,
    promiseLibrary: global.Promise,
    poolSize: 16,
  },
};

DBSchema(dbConnectionData).then((Connection) => {
  global.DB = Connection;

  setTimeout(() => {
    console.log("Discord connection start...");
    PLX.connect().then(postConnect).catch(console.error);
  }, CLUSTER_ID * SHARDS_PER_CLUSTER * 1200);
});

// Translation Engine ------------- <
global.translateEngineStart = () => {
  const i18next = require("i18next");
  const multilang = require("./utils/i18node.js");
  const i18nBackend = require("i18next-node-fs-backend");
  const backendOptions = {
    loadPath: "./locales/{{lng}}/{{ns}}.json",
    jsonIndent: 2,
  };
  readdirAsync("./locales/").then((list) => {
    i18next.use(i18nBackend).init({
      backend: backendOptions,
      lng: "en",
      fallbackLng: ["en", "dev"],
      fallbackToDefaultNS: true,
      fallbackOnNull: true,
      returnEmptyString: false,
      preload: list,
      load: "currentOnly",
      ns: ["bot_strings", "events", "commands", "website", "items", "translation"],
      defaultNS: "bot_strings",
      fallbackNS: "translation",
      interpolation: {
        escapeValue: false,
      },
    }, (err, t) => {
      if (err) {
        console.warn("• ".yellow, "Failed to Load Some Translations".yellow, `\n${err.map((e) => e.path.gray).join("\n")}`);
      }
      console.log("• ".green, "Translation Engine Loaded");

      multilang.setT(t);
      global.i18n = i18next;
      global.$t = multilang.getT();
      global.rand$t = multilang.rand;
    });
  });
  return "Translation Engine Loading!";
};
translateEngineStart();

//= ======================================//
//      BOT EVENT HANDLER
//= ======================================//

// const {msgPreproc} = require('./core/subroutines/onEveryMessage');

PLX.once("ready", async () => {
  console.log(" READY ".bold.bgCyan);
  require("./core/subroutines/cronjobs.js").run();
  if (PLX.shard) {
    PLX.user.setStatus("online");
    console.log(`${"● ".green}Shard${1 + PLX.shard.id}/${PLX.shard.count} [ONLINE]`);
  }

  PLX.updateBlacklists(DB).then(() => {
    console.log("• ".blue, "Blacklist Loaded!");
  }).catch(console.error);

  readdirAsync("./eventHandlers/").then((files) => {
    files.forEach((file) => {
      const eventor = require(`./eventHandlers/${file}`);
      const eventide = file.split(".")[0];
      PLX.on(eventide, (...args) => eventor(...args));
    });
  }).catch(console.error);

  PLX.registerCommands();
  try {
    PLX.microserver = new (require("./core/archetypes/Microserver"))(cfg.crossAuth);
    PLX.microserver.microtasks.updateServerCache("all");
    PLX.microserver.microtasks.updateChannels("all");
  } catch (e) {
    console.error(e);
    for (const i in new Int8Array(10)) console.error("ERROR MTASK");
  }

  hook.info(`**INFO:** Cluster connected and all shards reported online!
            Startup Time: ${(((performance.now() - runtime - (CLUSTER_ID * 20000)) / 1000).toFixed(3))}s`);

  require("./core/utilities/debugTools");
});

PLX.on("error", (error, shard) => error && console.error(`${"[Pollux]".red} ${shard !== undefined ? `Shard ${shard} error` : "Error"}:`, error));
PLX.on("disconnected", () => this.logger.warn(`${"[Pollux]".yellow} Disconnected from Discord`));
PLX.on("shardReady", (shard) => console.log("•".green, "Shard", (`${shard}`).magenta, "is Ready -"));
PLX.on("shardResume", (shard) => console.log("•".yellow, "Shard", (`${shard}`).magenta, "resumed Activity -"));
PLX.on("shardDisconnect", (err, shard) => {
  console.warn("•".red, "Shard", (`${shard}`).blue, "Disconnected -");
  console.group();
  console.error(err);
  console.groupEnd();
});

//= ======================================//
//      AUX SIDE FUNCTIONS
//= ======================================//

PLX.softKill = () => {
  console.log("Soft killing".bgBlue);
  PLX.restarting = true;
  // PLX.removeListener('messageCreate')

  Promise.all(PLX.execQueue).then(() => {
    PLX.disconnect({ reconnect: false });
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
};
PLX.hardKill = () => {
  console.log("Hard killing".red);
  PLX.removeListener("messageCreate", () => null);
  PLX.disconnect({ reconnect: false });
  process.exit(1);
};
PLX.setAvatar = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: { Accept: "image/*" },
      responseType: "arraybuffer",
    });
    await PLX.editSelf({ avatar: `data:${response.headers["content-type"]};base64,${response.data.toString("base64")}` });
  } catch (err) {
    console.error(err);
  }
};

PLX.bean = (guild, user, delete_message_days = 0, reason = "No reason specified") => axios.put(`https://discord.com/api/guilds/${guild}/bans/${user}`, { delete_message_days, reason }, { headers: { Authorization: PLX.token } });
PLX.unbean = (guild, user, delete_message_days = 0, reason = "No reason specified") => axios.delete(`https://discord.com/api/guilds/${guild}/bans/${user}`, { delete_message_days, reason }, { headers: { Authorization: PLX.token } });
PLX.reply = (msg, content) => {
  const payload = {
    message_reference: {
      channel_id: msg.channel.id,
      guild_id: msg.guild.id,
      message_id: msg.id,
    },
  };
  if (typeof content === "string") payload.content = content;
  else Object.assign(payload, content);

  return axios.post(`https://discord.com/api/v8/channels/${msg.channel.id}/messages`, payload, { headers: { Authorization: PLX.token } });
};

function postConnect() {
  console.log("Discord Client Connected".cyan);
  // POST STATS TO LISTS
}

global.errorsHook = cfg.errorsHook;

process.on("uncaughtException", (err) => {
  console.error(" UNCAUGHT EXCEPTION ".bgRed);
  console.error(err);
  hook.error(`
  **Uncaught Exception**
  \`\`\`js
${err.slice(0, 1900)}
  \`\`\`
  `, { hook: cfg.errorsHook });
  // if(!PLX.beta) PLX.softKill();
  // else PLX.hardKill();
});

process.on("unhandledRejection", (err) => {
  console.error(" UNHANDLED REJECTION ".bgYellow);
  console.error(err);
  hook.warn(`
  **Unhandled Rejection**
  \`\`\`js
${err.stack.slice(0, 1900)}
  \`\`\`
  `, { hook: cfg.errorsHook });
  // if(!PLX.beta) PLX.softKill();
  // else PLX.hardKill();
});


