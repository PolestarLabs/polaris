// STARTUP FLAIR
process.stdout.write('\033c');
console.log(require('./asciiPollux.js').ascii());
//===========================================

global.clusterNames = require("./clusters.json");
global.GNums        = require('./GlobalNumbers.js');
global.Promise      = require('bluebird');
Promise.config({longStackTraces: true})
const path          = require('path');
global.appRoot      = path.resolve(__dirname);
require('./utils/paths').run();
const cfg           = require('./config.json');   
const ERIS          = require("eris");
const Eris          = require("eris-additions")(ERIS);
const cmdPreproc    = require("./core/structures/CommandPreprocessor");
const mongoose      = require('mongoose');
const colors        = require('colors');

const readdirAsync  = Promise.promisify(require('fs').readdir);

//Eris Mods-----//
require('./core/structures/ReactionCollector.js')(ERIS);
Eris.Guild.prototype.member = function (user) {
    if (!user) return null;
    user = user.id || user;
    return this.members.find(usr => usr.id === user.id || usr.id === user);
}
Eris.Embed.prototype.setColor = function (color) {
    this.color = parseInt(color.replace(/^#/, ''), 16);
    return this;
}


const SHARDS_PER_CLUSTER = parseInt(process.env.SHARDS_PER_CLUSTER) || 1
const CLUSTER_ID = parseInt(process.env.CLUSTER_ID) || 0
const TOTAL_SHARDS = parseInt(process.env.TOTAL_SHARDS) || 1

console.table({SHARDS_PER_CLUSTER,
    CLUSTER_ID,
    TOTAL_SHARDS})

global.PLX= new Eris.CommandClient(cfg.token, {
    maxShards: TOTAL_SHARDS,
    firstShardID: (SHARDS_PER_CLUSTER * CLUSTER_ID) ,
    lastShardID: SHARDS_PER_CLUSTER * (CLUSTER_ID + 1) - 1,
    defaultImageSize: 512,
    defaultImageFormat: 'png',
    disableEvents: {
        'TYPING_START': true,
        'TYPING_STOP': true,
        'GUILD_MEMBER_SPEAKING': true
    }
}, {
        defaultHelpCommand: false,
        ignoreBots: true,
        defaultCommandOptions: cmdPreproc.DEFAULT_CMD_OPTS,
        prefix: ["plx!", "p!", "+", "@mention"]
    });

PLX.engine = Eris;
PLX.beta = process.env.NODE_ENV !== 'production'
PLX.maintenance = process.env.maintenance
PLX.cluster = { id: CLUSTER_ID, name: clusterNames[CLUSTER_ID] }

Gearbox = require("./core/utilities/Gearbox"); 
Object.assign(global,Gearbox.Global);
Object.assign(PLX,Gearbox.Client);

//=======================================//
//      INTERNAL POOLS
//=======================================//

PLX.execQueue = [];
PLX.commandPool = {};

global._emoji = E => new (require("./resources/lists/emoji.js")).PolluxEmoji(E);

PLX.registerCommands = cmdPreproc.registerCommands;
PLX.registerOne = cmdPreproc.registerOne;

PLX.blackListedUsers = [];
PLX.blackListedServers = [];
PLX.updateBlacklists = (DB) => {
    return Promise.all([
        DB.users.find({ 'blacklisted': { $exists: true } }, { id: 1, _id: 0 }).lean().exec(),
        DB.servers.find({ 'blacklisted': { $exists: true } }, { id: 1, _id: 0 }).lean().exec()
    ]).then((users, servers) => {
        PLX.blacklistedUsers = (users || []).map(usr => usr.id);
        PLX.blacklistedServers = (servers || []).map(svr => svr.id);
    });
}


//DATABASE INITIALIZING
mongoose.Promise = global.Promise;
Promise.promisifyAll(require("mongoose"));
console.info("• ".blue, "Connecting to Database...");

mongoose.connect(cfg.dbURL, {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    keepAlive: 1,
    connectTimeoutMS: 30000,
}, (err) => {
    if (err) return console.error(err, "• ".red + 'Failed to connect to Database!');
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, "• ".red + 'DB connection error:'.red));
db.once('open', function () {
    console.log("• ".green, "DB connection successful");
    PLX.updateBlacklists(require('./core/database/db_ops')).then(res => {
        console.log("• ".blue, "Blacklist Loaded!");
    })
});


//Translation Engine ------------- <
global.translateEngineStart = ()=>{

    const i18next = require('i18next');
    const multilang = require('./utils/i18node.js');
    const i18n_backend = require('i18next-node-fs-backend');
    const backendOptions = {
        loadPath: './locales/{{lng}}/{{ns}}.json',
        jsonIndent: 2
    };
    readdirAsync('./locales/').then(list => {
        i18next.use(i18n_backend).init({
            backend: backendOptions,
            lng: 'en',
            fallbackLng: ["en", "dev"],
            fallbackToDefaultNS: true,
            fallbackOnNull: true,
            returnEmptyString: false,
            preload: list,
            load: 'currentOnly',
            ns: ['bot_strings', 'events', 'commands', 'website', 'items', 'translation'],
            defaultNS: 'bot_strings',
            fallbackNS: 'translation',
            interpolation: {
                escapeValue: false
            }
        }, (err, t) => {
            if (err) {
                console.warn("• ".yellow, "Failed to Load Some Translations".yellow, "\n"+err.map(e=>e.path.gray).join('\n'))
            }
            console.log("• ".green, "Translation Engine Loaded")

            multilang.setT(t);
            global.$t = multilang.getT()
            global.rand$t = multilang.rand
        });
    });
    return "Translation Engine Loading!"
}
translateEngineStart();

//=======================================//
//      BOT EVENT HANDLER
//=======================================//

//const {msgPreproc} = require('./core/subroutines/onEveryMessage');

PLX.once("ready", async (msg) => {

    console.log(" READY ".bold.bgCyan);

    if (PLX.shard) {
        PLX.user.setStatus('online');
        console.log(("● ".green) + 'Shard' + (1 + PLX.shard.id) + '/' + PLX.shard.count + " [ONLINE]")
    }
    //msgPreproc.run()
    readdirAsync("./eventHandlers/").then(files => {
        files.forEach(file => {
            let eventor = require(`./eventHandlers/${file}`);
            let eventide = file.split(".")[0];
            PLX.on(eventide, (...args) => eventor(...args));
        });
    }).catch(console.error);

    PLX.microserver = new (require('./core/archetypes/Microserver'))(cfg.crossAuth);
    PLX.microserver.microtasks.updateServerCache("all");
    PLX.microserver.microtasks.updateChannels("all");
    PLX.registerCommands()

})

PLX.on('error', (error, shard) =>
    error && console.error(`${'[Pollux]'.red} ${shard !== undefined ? `Shard ${shard} error` : 'Error'}:`, error));
PLX.on('disconnected', () => this.logger.warn(`${'[Pollux]'.yellow} Disconnected from Discord`));
PLX.on("shardReady", shard => console.log("•".green, "Shard", (shard + "").magenta, "is Ready -"))
PLX.on("shardResume", shard => console.log("•".yellow, "Shard", (shard + "").magenta, "resumed Activity -"))
PLX.on("shardDisconnect", (err, shard) => {
    console.warn("•".red, "Shard", (shard + "").blue, "Disconnected -")
    console.group();
    console.error(err)
    console.groupEnd();
})

//=======================================//
//      AUX SIDE FUNCTIONS
//=======================================//

PLX.softKill = () => {
    console.log("Soft killing".bgBlue)
    PLX.restarting = true;
    //PLX.removeListener('messageCreate')

    Promise.all(PLX.execQueue).then(() => {
        PLX.disconnect({ reconnect: false });
        process.exit(0)
    }).catch(error => {
        console.error(error);
        process.exit(1);
    });
}
PLX.hardKill = () => {
    console.log("Hard killing".red)
    PLX.removeListener('messageCreate', () => null)
    PLX.disconnect({ reconnect: false });
    process.exit(1);
}
PLX.setAvatar = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: { 'Accept': 'image/*' },
            responseType: 'arraybuffer'
        });
        await PLX.editSelf({ avatar: `data:${response.headers['content-type']};base64,${response.data.toString('base64')}` });

    } catch (err) {
        console.error(err);
    }
}
PLX.findUser = (query) => {
    query = query.toLowerCase().trim();

    if (/^[0-9]{16,19}$/.test(query)) { // If query looks like an ID try to get by ID
        const user = PLX.users.get(query);
        if (user)
            return user;
    }

    let result = PLX.users.find(user => user.username.toLowerCase() === query);
    if (!result)
        result = PLX.users.find(user => user.username.toLowerCase().includes(query));
    return result || null;
}
PLX.findMember = (query, members) => {
    query = query.toLowerCase().trim();

    if (/^[0-9]{16,19}$/.test(query)) { // If query looks like an ID try to get by ID
        const member = members.get(query);
        if (member)
            return member;
    }

    let result = members.find(member => member.user.username.toLowerCase() === query);
    if (!result) result = members.find(member => member.nick && member.nick.toLowerCase() === query);
    if (!result) result = members.find(member => member.user.username.toLowerCase().includes(query));
    if (!result) result = members.find(member => member.nick && member.nick.toLowerCase().includes(query));
    return result || null;
}

function postConnect(x) {
    console.log("Discord Client Connected".cyan)
    
    require('./core/subroutines/cronjobs.js').run();

    // POST STATS TO LISTS
}

PLX.connect().then( postConnect ).catch(console.error);

process.on("uncaughtException", err => {
    console.error(" UNCAUGHT EXCEPTION ".bgRed)
    console.error(err)
    //if(!PLX.beta) PLX.softKill();
    //else PLX.hardKill();
})

process.on("unhandledRejection", err => {
    console.error(" UNHANDLED REJECTION ".bgYellow)
    console.error(err)
    //if(!PLX.beta) PLX.softKill();
    //else PLX.hardKill();
})