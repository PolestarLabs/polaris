/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable comma-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/order */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

const CLIENT_DATA = process.env.CLIENT_DATA;

if (!CLIENT_DATA) {
  if (!process.env.DEBUG) {
    console.error("No CLIENT_DATA environment variable found. Exiting.");
    process.exit(1);
  }
  console.error("*** No CLIENT_DATA environment variable found. Proceeding in debug mode. ***");
}

const CLIENT_NAME         = process.env.PRIME_FLAVORED_CLIENT;
const SHARDS_PER_CLUSTER  = parseInt(process.env.SHARDS_PER_CLUSTER) || 1;
const CLUSTER_ID          = parseInt(process.env.CLUSTER_ID) || 0;
const TOTAL_SHARDS        = parseInt(process.env.TOTAL_SHARDS) || 1;
const isPRIME             = process.env.PRIME === "true" || process.env.PRIME === true;
const BANNER              = require("./resources/asciiPollux.js");
const DB_INFO             = process.env.DB_INFO;
const VANILLA_DB_INFO     = process.env.VANILLA_DB_INFO;

const { readdirSync }     = require("fs");
const axios               = require("axios");
const Bluebird            = require("bluebird");
const TopGG               = require("@top-gg/sdk");
const ErisLib             = require("eris");
const Eris                = require("eris-additions")(ErisLib);

const DBSchema            = require("@polestar/database_schema");
const CLUSTER_NAMES       = require("@polestar/constants/clusters")?.default;
const cfg                 = require("./config.json");
const cmdPreproc          = require("./core/structures/CommandPreprocessor");
const Gearbox             = require("./core/utilities/Gearbox");
const WebhookDigester     = require("./utils/WebhookDigester.js");

global.appRoot = process.env.BOT_PATH;

require("./utils/paths").run();
require("./startup/instrumentation.js");

global.Promise = Bluebird;
Promise.config({ longStackTraces: true });

// safety wrappers for Eris
const originalOnMessageCreate = ErisLib.CommandClient.prototype.onMessageCreate;
ErisLib.CommandClient.prototype.onMessageCreate = function safeOnMessageCreate(msg) {
  if (!msg) {
    this.emit("warn", "MessageCreate received without a message object.");
    return;
  }
  if (!msg.author) {
    this.emit("warn", "MessageCreate received without an author.");
    return;
  }
  return originalOnMessageCreate.call(this, msg);
};
const originalWsEvent = ErisLib.Shard.prototype.wsEvent;
ErisLib.Shard.prototype.wsEvent._original = originalWsEvent;
ErisLib.Shard.prototype.wsEvent = function safeWsEvent(packet) {
  try {
    return originalWsEvent.call(this, packet);
  } catch (err) {
    // various eris bugs result in TypeErrors inside wsEvent when
    // the packet data refers to undefined caches.  We want to ignore
    // those instead of crashing the whole shard.
    if (
      err instanceof TypeError &&
      /reading '(?:remove|get)'/.test(String(err.message || err))
    ) {
      this.client?.emit?.("warn", `Shard wsEvent ignored: ${err.message}`);
      return;
    }
    throw err;
  }
};

// Eris Mods-----//
require("./core/structures/ReactionCollector.js")(ErisLib);
require("./core/structures/ButtonCollector.js")(ErisLib);
require("./core/structures/ComponentsHandler.js")(Eris);

Eris.Guild.prototype.member = function member(user) {
  if (!user) return null;
  user = user.id || user;
  return this.members.find((usr) => usr.id === user.id || usr.id === user);
};
Eris.Embed.prototype.setColor = function setColor(color) {
  this.color = parseInt(color.replace(/^#/, ""), 16);
  return this;
};
const oldSend = Eris.Channel.createMessage;
Eris.Channel.prototype.createMessage = function createMsgModded(...args) {
  if (!this.permissionsOf(PLX.user.id).has("sendMessages")) return;
  // eslint-disable-next-line consistent-return
  return oldSend(...args);
};

const TopGG_api = new TopGG.Api(cfg.topgg);
global.MARKET_TOKEN = cfg["pollux-api-token"];
global.PLX = new Eris.CommandClient(
  CLIENT_DATA.token,
  {
    maxShards: TOTAL_SHARDS,
    firstShardID: SHARDS_PER_CLUSTER * CLUSTER_ID,
    lastShardID: SHARDS_PER_CLUSTER * (CLUSTER_ID + 1) - 1,
    defaultImageSize: 512,
    restMode: true,
    ratelimiterOffset: 128,
    rest: {
      baseURL: "/api/v9",
      latencyThreshold: 5000,
      ratelimiterOffset: 800,
    },
    defaultImageFormat: "png",
    intents: ["guilds", "guildMembers", "guildBans", "guildWebhooks", "guildInvites", "guildVoiceStates", "guildPresences", "guildMessages", "guildMessageReactions", "guildMessageTyping", "messageContent"],
    disableEvents: {
      TYPING_START: true,
      TYPING_STOP: true,
      GUILD_MEMBER_SPEAKING: true,
    },
  },
  {
    defaultHelpCommand: false,
    ignoreBots: true,
    requestTimeout: 5000,
    defaultCommandOptions: cmdPreproc.DEFAULT_CMD_OPTS,
    prefix: ["+", "p!", "plx!", "@mention"],
  }
);

require("./core/utilities/SelfAPI.js");

PLX.engine      = Eris;
PLX.staging     = process.env.NODE_ENV !== "production";
PLX.maintenance = process.env.maintenance;
PLX.isPRIME     = Boolean(isPRIME);
PLX._flavordata = CLIENT_DATA;

if (isPRIME === true) {
  PLX.cluster = { id: 0, name: `Prime: ${CLIENT_DATA.fname}` };
} else {
  PLX.cluster = { id: CLUSTER_ID, name: CLUSTER_NAMES[CLUSTER_ID] };
}

console.table({
  PERCLUSTER: SHARDS_PER_CLUSTER,
  CLUSTER_ID,
  SHARDS: TOTAL_SHARDS,
});
console.report = (...args) => {
  console.log(
    ` ${PLX.cluster.name} `.white.bgBlue + " • ".gray + [...args].join(" ")
  );
};

Object.assign(global, Gearbox.Global);
Object.assign(PLX, Gearbox.Client);

PLX.execQueue = [];
PLX.commandPool = {};

PLX.registerCommands = cmdPreproc.registerCommands;
PLX.registerOne = cmdPreproc.registerOne;

PLX.blackListedUsers = [];
PLX.blackListedServers = [];
PLX.updateBlacklists = async (DB) => {
  const result = await Promise.all([
    DB.users
      .find({ blacklisted: { $exists: true } }, { id: 1, _id: 0 })
      .lean()
      .exec(),
    DB.servers
      .find({ blacklisted: { $exists: true } }, { id: 1, _id: 0 })
      .lean()
      .exec(),
  ]).then(([users, servers]) => {
    PLX.blacklistedUsers = (users || []).map((usr) => usr.id);
    PLX.blacklistedServers = (servers || []).map((svr) => svr.id);
  });

  return result;
};

const databaseConnectOptions = {
  useNewUrlParser: true,
  keepAlive: true,
  connectTimeoutMS: 8000,
  useUnifiedTopology: true,
  promiseLibrary: global.Promise,
  poolSize: 16,
};

const DB_CONNECTION_DATA      = { url: DB_INFO, hook: debugHook(), options: databaseConnectOptions };
const VANILLA_CONNECTION_DATA = { url: VANILLA_DB_INFO, hook: debugHook(), options: databaseConnectOptions };

DBSchema(DB_CONNECTION_DATA, {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
})
  .then((Connection) => {
    global.DB = Connection;

    try {
      let ProgMgr = require("@polestar/progression");
      ProgMgr.init(PLX);
      console.log("PROGRESSION MANAGER LOADED");
    } catch (err) {
      console.error("PROGRESSION MANAGER LOADED FAILED", err);
    }

    const _tokenPreview = (FLAVORED_CLIENT_DATA.token || "").slice(0, 12) + "…";
    console.log("Discord connection start...", {
      token: _tokenPreview,
      firstShard: SHARDS_PER_CLUSTER * CLUSTER_ID,
      lastShard: SHARDS_PER_CLUSTER * (CLUSTER_ID + 1) - 1,
      totalShards: TOTAL_SHARDS,
    });

    PLX.logDebug = true;

    const _connectTimeout = setTimeout(() => {
      console.error(
        " CONNECT TIMEOUT ".bgRed,
        "PLX.connect() did not resolve within 30s — likely stuck at gateway WS or token rejected"
      );
      // Log shard statuses for visibility
      for (const [id, shard] of PLX.shards) {
        console.error(`  Shard ${id}: status=${shard.status} seq=${shard.seq} sessionID=${shard.sessionID ?? "none"}`);
      }
    }, 10_000);

    PLX.connect()
      .then(() => {
        clearTimeout(_connectTimeout);
        PLX.logDebug = false;
        postConnect();
      })
      .catch((err) => {
        clearTimeout(_connectTimeout);
        PLX.logDebug = false;
        console.error(" PLX.connect() REJECTED ".bgRed, err);
      });
  })
  .catch((err) => {
    console.error(" DBSchema connect FAILED ".bgRed, err);
  });

DBSchema(vanillaConnection, { redis: null }).then((vConnection) => {
  global.vDB = vConnection;
  console.log("•".yellow, " Connected to Vanilla DB".blue);
});

// Translation Engine ------------- <
global.translateEngineStart = require("@polestar/i18n").translateEngineStart;
translateEngineStart();

let ReadyCount = 0;
PLX.on("ready", () => {
  console.log(" READY ".bold.bgYellow, "ReadyCount:", ReadyCount);
  ReadyCount++;
  // eslint-disable-next-line no-undef
  INSTR.gauge("READY_count", ReadyCount);
  console.log(BANNER.ascii());  
});
PLX.once("ready", async () => {
  if (PLX._flavordata?.name === "main") {
    await TopGG_api.postStats({
      serverCount: PLX.guilds.size,
      shardCount: TOTAL_SHARDS,
    });
  }

  PLX.topGG = TopGG_api;

  PLX.on("rawWS", (payload) => {
    if (payload.t === "INTERACTION_CREATE") {
      require("./eventHandlers/interactions")(payload);
    }
    if (PLX.logRaw) {
      console.log(
        `${" RAW WS ".bgCyan} }`,
        require("util").inspect(payload, 0, 2, 1)
      );
    }
  });

  console.log(" READY ".bold.bgCyan);
  require("./core/subroutines/cronjobs.js").run();
  if (PLX.shard) {
    PLX.user.setStatus("online");
    console.log(
      `${"● ".green}Shard${1 + PLX.shard.id}/${PLX.shard.count} [ONLINE]`
    );
  }

  PLX.registerCommands();

  PLX.updateBlacklists(DB)
    .then(() => {
      console.log("• ".blue, "Blacklist Loaded!");
    })
    .catch(console.error);
});

require("./startup/technicalEventLogs.js")(PLX);
require("./startup/auxiliarySideFunctions.js")(PLX);
require("@polestar/emoji-grimoire").initialize(PLX);

global.errorsHook = cfg.errorsHook;

// Global exception handlers
process.on("uncaughtException", (err) => {
  console.error(" UNCAUGHT EXCEPTION ".bgRed);
  console.error(err);
  debugHook().error(
    `
  **Uncaught Exception**
  \`\`\`js
${err.slice(0, 1900)}
  \`\`\`
  `,
    { hook: cfg.errorsHook }
  );
});
process.on("unhandledRejection", (err) => {
  console.error(" UNHANDLED REJECTION ".bgYellow);
  console.error(err);
  debugHook().warn(
    `
  **Unhandled Rejection**
  \`\`\`js
${err?.stack?.slice(0, 1900)}
  \`\`\`
  `,
    { hook: cfg.errorsHook }
  );
});

function debugHook() {
  return new WebhookDigester(PLX);
}

function postConnect() {
  console.log("Discord Client Connected".cyan);
  initializeEvents();
  console.log("•".cyan, "Events Listening");
}

function initializeEvents() {
  function handleEvent(eventide, file) {
    PLX.on(eventide, async (...args) => {
      let result;

      try {
        const eventor = require(`./eventHandlers/${file}`);
        PLX.eventHandlerFunctions[eventide] = eventor;
        result = await eventor(...args);
      } catch (err) {
        console.error(`Error handling event: ${eventide}`, err);
        result = undefined;
      }

      return result;
    });
  }

  PLX.eventHandlerFunctions = {};

  const files = readdirSync("./eventHandlers/");
  for (const file of files) {
    const [eventide, suffix] = file.split(".");
    if (suffix !== "js") continue;

    try {
      handleEvent(eventide, file);
    } catch (err) {
      console.error(`Error registering event: ${eventide}`, err);
    }
  }

  PLX.microserverStart = () => {
    try {
      PLX.microserver = new (require("./core/archetypes/Microserver"))(
        cfg.crossAuth // TODO: Replace with Env
      );
      PLX.microserver.microtasks.updateServerCache("all");
      PLX.microserver.microtasks.updateChannels("all");
    } catch (e) {
      console.error(" ERROR Microserver Start ".bgRed);
      console.error(e);
      console.error("--------------------------------------------\n\n");
    }
  };

  require("./core/utilities/debugTools");
}
