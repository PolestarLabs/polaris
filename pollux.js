const path = require('path');
global.appRoot = path.resolve(__dirname);
global.Promise = require('bluebird');
require('./utils/paths').run();


const ERIS = require("eris");
const Eris = require("eris-additions")(ERIS);
const pGear = require("./core/structures/PrimitiveGearbox.js");

//Eris Mods-----//
require('./core/structures/ReactionCollector.js')(ERIS);
Eris.Embed.prototype.setColor = function(color){
   this.color = parseInt(color.replace(/^#/, ''), 16);
   return this;
}

//---------------//

const cfg = require('./config.json');

const colors = require('colors');




const POLLUX = new Eris(cfg.token,{


  maxShards:1,

  firstShardID:0,
  lastShardID:0,
  defaultImageSize:512,

  defaultImageFormat:'png',
  disableEvents: {
    'TYPING_START': true,
    'TYPING_STOP': true,
    'GUILD_MEMBER_SPEAKING': true
  }

});

global.POLLUX= POLLUX;

//DATABASE INITIALIZING

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const tunnel = require('tunnel-ssh');
 console.log("Connecting to Database...");
const server = tunnel(cfg.tunnel,  (err, server)=> {
    if(err)console.error("SSH tunnel  error: " + err);

mongoose.connect(cfg.dbURL, {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  keepAlive: 1,
  connectTimeoutMS: 30000,

}, (err) => {
    if (err) return console.error(err,'Failed to connect to Database!');
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'DB connection error:'.red));
    db.once('open', function() {
        console.log("DB connection successful".green);
    });
});

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
            console.warn("[!] Failed to Load Translations".yellow)
        }
        multilang.setT(t);
    });
});
//----------------[i18n END]-------<



//=======================================//
//      BOT EVENT HANDLER
//=======================================//





POLLUX.on("ready", async (msg) => {
  console.log(" READY ".bold.bgGreen);
  if (POLLUX.shard) {
    POLLUX.user.setStatus('online');
    console.log(("● ".green)+'Shard' + (1 + POLLUX.shard.id) + '/' + POLLUX.shard.count + " [ONLINE]")
  }
})

//require('./core/subroutines/cronjobs.js').run(POLLUX);

const fs= require('fs')
fs.readdir("./eventHandlers/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventor = require(`./eventHandlers/${file}`);
    let eventide = file.split(".")[0];
    POLLUX.on(eventide, (...args) => eventor.run( ...args));
  });
});


function postConnect(x){
  console.log("Discord Client Connected".green)
}

POLLUX.on("shardReady", shard=>console.log("•".green,"Shard",(shard+"").magenta,"is Ready -"))
POLLUX.on("shardResume", shard=>console.log("•".yellow,"Shard",(shard+"").magenta,"resumed Activity -"))
POLLUX.on("shardDisconnect", (err,shard)=>{
  console.warn("•".red,"Shard",(shard+"").blue,"Disconnected -")
  console.group();
  console.error(err)
  console.groupEnd();
})
//POLLUX.shardPreReady(shard=>console.log("•".blue,"Shard",(shard+"").magenta,"Reading Packet -"))



POLLUX.connect().then(x=>postConnect(x));
