// STARTUP FLAIR
  process.stdout.write('\033c');
  console.log(require('./asciiPollux.js').ascii());
//===========================================

global.clusterNames = require("./clusters.json")
 
const path = require('path');
global.appRoot = path.resolve(__dirname);
global.GNums = require('./GlobalNumbers.js');
global.Promise = require('bluebird');
Promise.config({
  longStackTraces: true 
})
require('./utils/paths').run();


const ERIS = require("eris");
const Eris = require("eris-additions")(ERIS);
const pGear = require("./core/structures/PrimitiveGearbox.js");
const cmdPreproc = require("./core/structures/CommandPreprocessor");

//Eris Mods-----//
require('./core/structures/ReactionCollector.js')(ERIS);


Eris.Guild.prototype.member = function (user){
  if(!user) return null;
  user = user.id || user;
  return this.members.find(usr=>usr.id===user.id || usr.id === user);
}
Eris.Embed.prototype.setColor = function(color){
   this.color = parseInt(color.replace(/^#/, ''), 16);
   return this;
}

//global.piggyback = true;

//---------------//

const cfg = require('./config.json');

const colors = require('colors');

//console.log = function(){}

const SHARDS_PER_CLUSTER = 1
const CLUSTER_ID = parseInt(process.env.CLUSTER_ID) || 0
const TOTAL_SHARDS = parseInt(process.env.TOTAL_SHARDS) || 1

const POLLUX = new Eris.CommandClient(cfg.token,{
  maxShards: TOTAL_SHARDS ,
  firstShardID: (SHARDS_PER_CLUSTER * CLUSTER_ID) - SHARDS_PER_CLUSTER +1 ,
  lastShardID: SHARDS_PER_CLUSTER * (CLUSTER_ID+1) - 1 ,
  defaultImageSize:512,
  defaultImageFormat:'png',
  disableEvents: {
    'TYPING_START': true,
    'TYPING_STOP': true,
    'GUILD_MEMBER_SPEAKING': true
  }
},{
  defaultHelpCommand: false,
  ignoreBots: true,
  defaultCommandOptions: cmdPreproc.DEFAULT_CMD_OPTS,
  prefix: ["plx!","p!","+","@mention"]
});

global.POLLUX= POLLUX;

POLLUX.beta = true
POLLUX.maintenance = false
POLLUX.cluster = {id:CLUSTER_ID,name: clusterNames[CLUSTER_ID] }

//=======================================//
//      INTERNAL POOLS
//=======================================//

POLLUX.execQueue = [ ];
POLLUX.commandPool = { };

POLLUX.registerCommands = cmdPreproc.registerCommands;
POLLUX.registerOne      = cmdPreproc.registerOne;

POLLUX.blackListedUsers = [];
POLLUX.blackListedServers = [];
POLLUX.updateBlacklists = (DB) =>{
  return Promise.all([
    DB.users.find({'blacklisted':{$exists:true}},{id:1,_id:0}).lean().exec(),
    DB.servers.find({'blacklisted':{$exists:true}},{id:1,_id:0}).lean().exec()
  ]).then( (users,servers) => {
    POLLUX.blacklistedUsers = (users||[]).map(usr=>usr.id);
    POLLUX.blacklistedServers = (servers||[]).map(svr=>svr.id);
  });
}

//DATABASE INITIALIZING

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
console.log("• ".blue,"Connecting to Database...");

//const tunnel = require('tunnel-ssh');
/*
   tunnel(cfg.tunnel,  (err, server)=> {
     if(err)console.error("• ".red,"SSH tunnel  error: " + err);
*/     

mongoose.connect(cfg.dbURL, {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  keepAlive: 1,
  connectTimeoutMS: 30000,
  
}, (err) => {
    if (err) return console.error(err,"• ".red+'Failed to connect to Database!');
  });

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, "• ".red+'DB connection error:'.red));
    db.once('open', function() {
        console.log("• ".green,"DB connection successful");
        POLLUX.updateBlacklists(require('./core/database/db_ops')).then(res=>{
          console.log("• ".blue,"Blacklist Loaded!");
        })
    });
//});

  
Promise.promisifyAll(require("mongoose"));

//---

//Translation Engine ------------- <
const i18next = require('i18next');
const multilang = require('./utils/i18node.js');


const i18n_backend = require('i18next-node-fs-backend');
const backendOptions = {
    loadPath: './locales/{{lng}}/{{ns}}.json',
    jsonIndent: 2
};

pGear.getDirs('./locales/').then(list => {
    i18next.use(i18n_backend).init({
        backend: backendOptions,
        lng: 'en',
        fallbackLng:["en","dev"],
        fallbackToDefaultNS: true,
        fallbackOnNull: true,
        returnEmptyString:false,
        preload: list,
        load: 'currentOnly',
        ns:['bot_strings','events','commands','website','translation'],
            defaultNS: 'bot_strings',
            fallbackNS: 'translation',
            interpolation:{
                 escapeValue: false
            }
    }, (err, t) => {
        if (err) {
            console.warn("• ".yellow,"Failed to Load Translations", err)
        }

        multilang.setT(t);
        global.$t = multilang.getT()
        global.rand$t = multilang.rand
    });
});
//----------------[i18n END]-------<


//=======================================//
//      BOT EVENT HANDLER
//=======================================//
//const {msgPreproc} = require('./core/subroutines/onEveryMessage');

const readdirAsync = Promise.promisify(require('fs').readdir);
POLLUX.once("ready", async (msg) => {
  console.log(" READY ".bold.bgCyan);
  if (POLLUX.shard) {
    POLLUX.user.setStatus('online');
    console.log(("● ".green)+'Shard' + (1 + POLLUX.shard.id) + '/' + POLLUX.shard.count + " [ONLINE]")
  }
  //msgPreproc.run()

  readdirAsync("./eventHandlers/").then(files => {
    files.forEach(file => {
      let eventor = require(`./eventHandlers/${file}`);
      let eventide = file.split(".")[0];
      POLLUX.on(eventide, (...args) => eventor( ...args));
    });
  }).catch(console.error);


  //POLLUX.updatePrefixes(require('./core/database/db_ops'));
  // PRE=REGISTER=COMMANDS
  POLLUX.microserver = new (require('./core/archetypes/Microserver'))(cfg.crossAuth); 
  POLLUX.microserver.microtasks.updateServerCache("all"); 
  
  POLLUX.registerCommands()



})

POLLUX.on('error', (error, shard) =>
  error && console.error(`${'[Pollux]'.red} ${shard !== undefined ? `Shard ${shard} error` : 'Error'}:`, error.stack));
POLLUX.on('disconnected', () => this.logger.warn(`${'[Pollux]'.yellow} Disconnected from Discord`));
POLLUX.on("shardReady", shard=>console.log("•".green,"Shard",(shard+"").magenta,"is Ready -"))
POLLUX.on("shardResume", shard=>console.log("•".yellow,"Shard",(shard+"").magenta,"resumed Activity -"))
POLLUX.on("shardDisconnect", (err,shard)=>{
  console.warn("•".red,"Shard",(shard+"").blue,"Disconnected -")
  console.group();
  console.error(err)
  console.groupEnd();
})



require('./core/subroutines/cronjobs.js').run(POLLUX);


//=======================================//
//      AUX SIDE FUNCTIONS
//=======================================//


POLLUX.softKill = ()=>{
    console.log("Soft killing".bgBlue)
    POLLUX.restarting = true;
    //POLLUX.removeListener('messageCreate')
    
    Promise.all(POLLUX.execQueue).then(() => {
      POLLUX.disconnect({ reconnect: false });
      process.exit(0)
    }).catch(error => {
      console.error(error);
      process.exit(1);
    });
}
POLLUX.hardKill = ()=>{
  console.log("Hard killing".red)
  POLLUX.removeListener('messageCreate',()=>null)
  POLLUX.disconnect({ reconnect: false });
  process.exit(1);
}
POLLUX.setAvatar = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: { 'Accept': 'image/*' },
      responseType: 'arraybuffer'
    });
    await POLLUX.editSelf({avatar: `data:${response.headers['content-type']};base64,${response.data.toString('base64')}`});
  
  } catch (err) {   
    console.error(err);
  }
}
POLLUX.findUser = (query) => {
  query = query.toLowerCase().trim();

  if (/^[0-9]{16,19}$/.test(query)) { // If query looks like an ID try to get by ID
    const user = POLLUX.users.get(query);
    if (user)
      return user;
  }

  let result = POLLUX.users.find(user => user.username.toLowerCase() === query);
  if (!result)
    result = POLLUX.users.find(user => user.username.toLowerCase().includes(query));
  return result || null;
}
POLLUX.findMember = (query, members) => {
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


function postConnect(x){
  console.log("Discord Client Connected".cyan)
}

//POLLUX.shardPreReady(shard=>console.log("•".blue,"Shard",(shard+"").magenta,"Reading Packet -"))



POLLUX.connect().then(x=>postConnect(x));


process.on("uncaughtException", err=>{
  console.error(" UNCAUGHT EXCEPTION ".bgRed)
  console.error(err)
})


process.on("unhandledRejection", err=>{
  console.error(" UNHANDLED REJECTION ".bgYellow)
  console.error(err)
})