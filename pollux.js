const cfg = require("./config.json");
process.env.UV_THREADPOOL_SIZE = 256;
// STARTUP FLAIR
// process.stdout.write("\x1Bc");

console.log(require("./resources/asciiPollux.js").ascii());
// ===========================================

global.Promise = require("bluebird");
global.clusterNames = require("@polestar/constants/clusters");

const SHARDS_PER_CLUSTER  = parseInt(process.env.SHARDS_PER_CLUSTER, 10) || 1;
const CLUSTER_ID          = parseInt(process.env.CLUSTER_ID, 10) || 0;
const TOTAL_SHARDS        = parseInt(process.env.TOTAL_SHARDS, 10) || 1;

const isPRIME               = process.env.PRIME;
const FLAVORED_CLIENT       = process.env.PRIME_FLAVORED_CLIENT;// || isPRIME ? "prime" : "main";



const DummyFlavorDefault = {
  token: cfg.token,
  fname: "Dummy",
  category: "alpha",
  name: "dummy_default"
}
console.log(typeof process.env.FLAVOR_SWARM_CONFIG);
const FLAVOR_SWARM_CONFIG   = typeof process.env.FLAVOR_SWARM_CONFIG === 'object' ? process.env.FLAVOR_SWARM_CONFIG : JSON.parse(process.env.FLAVOR_SWARM_CONFIG||"[]"); // sample data on index;
const FLAVORED_CLIENT_DATA  = FLAVOR_SWARM_CONFIG.find(cli=>cli.name === FLAVORED_CLIENT) || DummyFlavorDefault;

//return console.log({isPRIME,FLAVORED_CLIENT,FLAVOR_SWARM_CONFIG ,FLAVORED_CLIENT_DATA});

global.Sentry         = require("@sentry/node");
const { performance } = require("perf_hooks");
const path            = require("path");
const ERIS            = require("eris");
const axios           = require("axios");
const Eris            = require("eris-additions")(ERIS);
const readdirAsync    = Promise.promisify(require("fs").readdir);
const cmdPreproc      = require("./core/structures/CommandPreprocessor");
const WebhookDigester = require("./utils/WebhookDigester.js");
// Eris Mods-----//
require("./core/structures/ReactionCollector.js")(ERIS);
require("./core/structures/ButtonCollector.js")(ERIS);

require("./core/structures/ComponentsHandler.js")(Eris);

const runtime = performance.now();
global.appRoot = path.resolve(__dirname);
Promise.config({ longStackTraces: true });
require("./utils/paths").run();


// ERIS MODS
Eris.Guild.prototype.member = function member(user) {
  if (!user) return null;
  user = user.id || user;
  return this.members.find((usr) => usr.id === user.id || usr.id === user);
};
Eris.Embed.prototype.setColor = function setColor(color) {
  this.color = parseInt(color.replace(/^#/, ""), 16);
  return this;
};


/* NOTE:  
    FUTURE: In case cleanContent is removed 
get cleanContent() {
        let cleanContent = this.content && this.content.replace(/<a?(:\w+:)[0-9]+>/g, "$1") || "";

        let authorName = this.author.username;
        if(this.channel.guild) {
            const member = this.channel.guild.members.get(this.author.id);
            if(member && member.nick) {
                authorName = member.nick;
            }
        }
        cleanContent = cleanContent.replace(new RegExp(`<@!?${this.author.id}>`, "g"), "@\u200b" + authorName);

        if(this.mentions) {
            this.mentions.forEach((mention) => {
                if(this.channel.guild) {
                    const member = this.channel.guild.members.get(mention.id);
                    if(member && member.nick) {
                        cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), "@\u200b" + member.nick);
                    }
                }
                cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), "@\u200b" + mention.username);
            });
        }

        if(this.channel.guild && this.roleMentions) {
            for(const roleID of this.roleMentions) {
                const role = this.channel.guild.roles.get(roleID);
                const roleName = role ? role.name : "deleted-role";
                cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, "g"), "@\u200b" + roleName);
            }
        }

        this.channelMentions.forEach((id) => {
            const channel = this._client.getChannel(id);
            if(channel && channel.name && channel.mention) {
                cleanContent = cleanContent.replace(channel.mention, "#" + channel.name);
            }
        });

        return cleanContent.replace(/@everyone/g, "@\u200beveryone").replace(/@here/g, "@\u200bhere");
    }
*/

//-------------------------------------------------------


Sentry.init({
  dsn: cfg.sentryDSN,
  environment: process.env.NODE_ENV,
  serverName: `Polaris-[C${CLUSTER_ID}]`,
  autoSessionTracking: false,

});

console.table({
  SHARDS_PER_CLUSTER,
  CLUSTER_ID,
  TOTAL_SHARDS,
  FLAVORED_CLIENT_DATA
});


global.PLX = new Eris.CommandClient( FLAVORED_CLIENT_DATA.token , {
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
  requestTimeout: 5000,
  defaultCommandOptions: cmdPreproc.DEFAULT_CMD_OPTS,
  prefix: ["+", "p!", "plx!", "@mention"],
});


global.MARKET_TOKEN = cfg["pollux-api-token"];

PLX.engine = Eris;
PLX.beta = cfg.beta || process.env.NODE_ENV !== "production";
PLX.maintenance = process.env.maintenance;
PLX.isPRIME = isPRIME;
PLX._flavordata = FLAVORED_CLIENT_DATA;

PLX.cluster = isPRIME 
  ? { id: 0, name: "Prime: "+FLAVORED_CLIENT_DATA.fname } 
  : { id: CLUSTER_ID, name: clusterNames[CLUSTER_ID] };

console.report = (...args) => console.log(` ${PLX.cluster.name} `.white.bgBlue + " • ".gray + [...args].join(" "));
global.hook = new WebhookDigester(PLX);

Gearbox = require("./core/utilities/Gearbox");

Object.assign(global, Gearbox.Global);
Object.assign(PLX, Gearbox.Client);

//= ======================================//
//      INTERNAL POOLS
//= ======================================//

PLX.execQueue = [];
PLX.commandPool = {};

require("@polestar/emoji-grimoire").initialize(PLX);

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
const { config } = require("bluebird");

const dbConnectionData = {
  hook,
  url: PLX.beta ? cfg.dbURL_beta : cfg.dbURL,
  options: {

    useNewUrlParser: true,
    keepAlive: true,
    connectTimeoutMS: 8000,
    useUnifiedTopology: true,
    promiseLibrary: global.Promise,
    poolSize: 16,
  },
};

const vanillaConnection = {
  hook,
  url: cfg.vanillaDB,
  options: {
    useNewUrlParser: true,
    keepAlive: true,
    connectTimeoutMS: 8000,
    useUnifiedTopology: true,
    promiseLibrary: global.Promise,
    poolSize: 16,
  },
};

DBSchema(dbConnectionData, {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
}).then((Connection) => {
  global.DB = Connection;

  try {
    (require("./core/archetypes/Achievements.js")).init();
    (require("./core/archetypes/Progression.js")).init();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  setTimeout(() => {
    console.log("Discord connection start...");
    PLX.connect().then(postConnect).catch(console.error);
  }, CLUSTER_ID * SHARDS_PER_CLUSTER * 1200);
}).catch((err) => {
  console.error(err);
});


DBSchema(vanillaConnection, { redis: null }).then(vConnection => {
  global.vDB = vConnection;
  console.log("•".yellow, " Connected to Vanilla DB".blue)
})


// Translation Engine ------------- <

global.translateEngineStart = require("@polestar/i18n").translateEngineStart;
translateEngineStart();

//= ======================================//
//      BOT EVENT HANDLER
//= ======================================//

// const {msgPreproc} = require('./core/subroutines/onEveryMessage');

PLX.once("ready", async () => {

  PLX.on("rawREST", payload => {
    //if (PLX.logRaw) console.log(`${" RAW RE ".bgMagenta} }`, require('util').inspect(payload,0,2,1));
  })
  PLX.on("rawWS", payload => {
    if (payload.t === "INTERACTION_CREATE") {
      require(`./eventHandlers/interactions`)(payload);
    }
    if (PLX.logRaw) console.log(`${" RAW WS ".bgCyan} }`, require('util').inspect(payload, 0, 2, 1));
  })


  console.log(" READY ".bold.bgCyan);
  require("./core/subroutines/cronjobs.js").run();
  if (PLX.shard) {
    PLX.user.setStatus("online");
    console.log(`${"● ".green}Shard${1 + PLX.shard.id}/${PLX.shard.count} [ONLINE]`);
  }

  PLX.updateBlacklists(DB).then(() => {
    console.log("• ".blue, "Blacklist Loaded!");
  }).catch(console.error);

  PLX.eventHandlerFunctions = {};
  readdirAsync("./eventHandlers/").then((files) => {
    files.forEach((file) => {
      const eventide = file.split(".")[0];
      PLX.on(eventide, (...args) => {
        const eventor = require(`./eventHandlers/${file}`);
        PLX.eventHandlerFunctions[eventide] = eventor;
        return eventor(...args);
      });
    });
  }).catch(console.error);

  PLX.registerCommands();

  PLX.microserverStart = () => {
    try {
      PLX.microserver = new (require("./core/archetypes/Microserver"))(cfg.crossAuth);
      PLX.microserver.microtasks.updateServerCache("all");
      PLX.microserver.microtasks.updateChannels("all");
    } catch (e) {
      console.error(e);
      for (const i in new Int8Array(10)) console.error("ERROR MTASK");

      process.exit(1);
    }
  };
  PLX.microserverStart();
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

PLX.softKill = (msg) => {
  console.log("Soft killing".bgBlue);
  PLX.restarting = true;
  PLX.removeListener('messageCreate', PLX.eventHandlerFunctions.messageCreate);

  Promise.all(PLX.execQueue).then(async () => {
    if (msg) await msg.reply(_emoji('yep') + " Queue consumed. Rebooting now...");
    PLX.disconnect({ reconnect: false });
    process.exit(0);
  }).timeout(30e3).catch(async (error) => {
    if (msg) await msg.reply(_emoji('nope') + " Queue errored or timed out. Hard-rebooting now...");
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

require("./core/utilities/SelfAPI.js");

PLX.bean = (guild, user, delete_message_days = 0, reason = "No reason specified") => axios.put(`https://discord.com/api/guilds/${guild}/bans/${user}`, { delete_message_days, reason }, { headers: { Authorization: PLX._token } });
PLX.unbean = (guild, user, delete_message_days = 0, reason = "No reason specified") => axios.delete(`https://discord.com/api/guilds/${guild}/bans/${user}`, { delete_message_days, reason }, { headers: { Authorization: PLX._token } });
PLX.reply = (msg, content, ping = false) => {
  const payload = {
    allowed_mentions: { replied_user: ping },
    message_reference: {
      channel_id: msg.channel.id,
      guild_id: msg.guild.id,
      message_id: msg.id,
    },
  };
  if (typeof content === "string") payload.content = content;
  else Object.assign(payload, content);

  return axios.post(`https://discord.com/api/v8/channels/${msg.channel.id}/messages`, payload, { headers: { Authorization: PLX._token } });
};

function postConnect() {
  console.log("Discord Client Connected".cyan);
  // POST STATS TO LISTS
}

global.errorsHook = cfg.errorsHook;

process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
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
  Sentry.captureException(err);
  console.error(" UNHANDLED REJECTION ".bgYellow);
  console.error(err);
  hook.warn(`
  **Unhandled Rejection**
  \`\`\`js
${err?.stack?.slice(0, 1900)}
  \`\`\`
  `, { hook: cfg.errorsHook });
  // if(!PLX.beta) PLX.softKill();
  // else PLX.hardKill();
});

PLX.getOrCreateUser = async (user) => {
  let udata = await DB.users.findOne({ id: user.id });
  if (!udata) udata = await DB.users.new(user);
  return udata;
}






