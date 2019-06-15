const RSSembedGenerator = require('../commands/utility/rss.js').embedGenerator;
const rq = require('request')
const { readFileSync } = require('fs');
const { servers } = require( "../database/db_ops");
const cfg = require(appRoot+"/config.json")
const g = require( '../utilities/Gearbox');
const DB = require( '../database/db_ops');
let RSS = require('rss-parser');
let parser = new RSS();

const userDB = DB.users

const Discoin = require( "../archetypes/Discoin.js");
const discoin = new Discoin(cfg.discoin);
const coinbase = require("../../resources/lists/discoin.json");
const gear = g
const { receive } = require( '../archetypes/Economy.js');
const { CronJob } = require( 'cron');


async function resolveExchange(exchange_itm,bot){
    
              let usr = exchange_itm.user + "";
              let ts = Date(exchange_itm.timestamp * 1000);
              let src = exchange_itm.source;
              let amt = Number(Math.floor(exchange_itm.amount));
              let inv = exchange_itm.receipt;
              let taxes =  0 //Math.ceil(amt*0.1837)
              let coinfee =  0 //Math.floor(amt*(coinbase[src]||{rbnRate:0.005}).rbnRate)
              let newAmt = Math.floor(amt - taxes - coinfee);

            if (newAmt < 1) {
              discoin.reverse(inv);
              return bot.users.fetch(usr)
                .then(u => u.send(`:warning: Transaction Reversed :: Amount of Rubines below Zero`)
                      .catch(e=>console.warn(`User ${u.id} cannot receive DMs`)));
            };

            userDB.findOne({id: usr},{id:1}).then(async USDATA => {
              if (!USDATA) {
                discoin.reverse(inv)
                bot.users.fetch(usr)
                  .then(u => u.send(`Transaction Reversed :: Not in Pollux Database`)
                        .catch(e=>console.warn(`User ${u.id} cannot receive DMs`)))
                  .catch(e => console.error(e));                
                return;
              };
              receive(usr,newAmt,"discoin","RBN","+","DISCOIN_"+src).then(ok=>{
                  function aN(inc,ref=amt){
                    let len  = ref.toString().length
                    let len2 = inc.toString().length
                    let spaces = ""
                    for (i=0;i<len-len2;i++){
                     spaces += " "
                    }
                    return spaces+inc
                  }
                bot.users.fetch(usr).then(u => {
                  
                u.getDMChannel().then(dmChan=>{dmChan.send(`
\`${src}\` ${coinbase[src].icon}:currency_exchange: ${gear.emoji('rubine')} \`RBN\`
**Exchange Processed!**

Inbound  : ${gear.emoji('rubine')} × **${amt}**
Fees         : ${gear.emoji('rubine')} × **${taxes+coinfee}**
\`\`\`diff
+Inbound Amount   :  ${aN(amt)}
-Transaction Fee  :  ${aN(taxes)}
-Exg. Tax for ${src} :  ${aN(coinfee)}
---------------------------
 Net Income       :  ${aN(newAmt)}
\`\`\`
Received **${newAmt}** **RBN**(*Pollux Rubines*) converted from **${src}**(*${coinbase[src].bot+" "+coinbase[src].name}*)!
---
*Transaction Receipt:*
\`${ts}\`
\`\`\`${inv}\`\`\`

`).catch(e=>console.warn("[DISCOIN] User can't recveive DMs"));
              }).catch(e => console.log(e,"\n\nERROR ON FETCH"))
                 })
            })
  })
}


//======================================================================================
//======================================================================================
//======================================================================================
//======================================================================================
//======================================================================================


exports.run = async function(bot){
  
  console.log("• ".blue,"Loading CRON subroutines...");

const MIDNIGHT   = new CronJob('0 0 * * *', ()=> {
  //======================================================================================
  /* EVERY MIDNIGHT */
  //======================================================================================

  userDB.updateMany(
     {'limits.slots':{$gt:10}},
     {$set:{'limits.slots':0}}
   ).then(x=>console.log("Daily Limit Reset for Slots "));
  userDB.updateMany(
     {'limits.blackjack':{$gt:10}},
     {$set:{'limits.blackjack':0}}
   ).then(x=>console.log("Daily Limit Reset for Blackjack "));
  userDB.updateMany(
     {'limits.receive':{$gt:2}},
     {$set:{'limits.receive':0}}
   ).then(x=>console.log("Daily Limit Reset for Receive "));
  userDB.updateMany(
     {'limits.give':{$gt:2}},
     {$set:{'limits.give':0}}
   ).then(x=>console.log("Daily Limit Reset for Give "));   

  
},null,true);
            
const FIVEminute = new CronJob('*/5  * * * *', async ()=> {
  //======================================================================================
  /* EVERY 5 MINUTES */
  //======================================================================================
   //DB.globalDB.set({$set:{['data.shardData.'+(Number((bot.shard||{id:process.env.SHARD}).id)+1)+".servers"]:bot.guilds.size}}).then(x=>x=null);
   //DB.globalDB.set({$set:{['data.shardData.'+(Number((bot.shard||{id:process.env.SHARD}).id)+1)+".users"]:bot.users.size}}).then(x=>x=null);
   //DB.globalDB.set({$set:{['data.shardData.'+(Number((bot.shard||{id:process.env.SHARD}).id)+1)+".channels"]:bot.channels.size}}).then(x=>x=null);

  let gchange = gear.gamechange();
  //let sname = gear.getShardCodename(bot,Number(process.env.SHARD)+1)
  //bot.user.setPresence({shardID:Number(process.env.SHARD),status:'online',activity:{name:sname,type:0}});
    


  
},null,true);


const ONEhour = new CronJob('* */1 * * *', async () => {



  (async ()=>{
    DB.feed.find({ server: { $in: POLLUX.guilds.map(g => g.id) } }).then(serverFeeds => {
      serverFeeds.forEach(async svFd => {
        const serverData = await DB.servers.get(svFd.server);
        svFd.feeds.forEach(async feed => {          
          if (feed.type === 'youtube'){
            const {ytEmbedCreate, getYTData} = require('../commands/utility/ytalert.js');
            const data = await  getYTData(feed.url,cfg.google);
            if (data && data.items[0] && ((feed.last||{}).id||{}).videoId != (data.items[0].id||{}).videoId ) {
              const embed = await ytEmbedCreate(data.items[0],null);
              const P = {lngs: [serverData.modules.LANGUAGE || 'en', 'dev']}
              P.tuber = embed.author.name;
              let LastVideoLink = `
              ${$t("interface.feed.newYoutube",`**${P.tuber} has posted a new video!** Check it out at:`,P)}
              https://youtube.com/watch?v=${data.items[0].id.videoId}`
              await DB.feed.updateOne({server:svFd.server,'feeds.url':feed.url},{'feeds.$.last':data.items[0] });        
              POLLUX.getChannel(feed.channel).send( {content:LastVideoLink}).then(m=>m.channel.send({embed}));
            }
          }
        })
      })
    })    
  })()


});


const FIFTEENminute = new CronJob('*/15 * * * *', async () => {


  (async ()=>{
    DB.feed.find({ server: { $in: POLLUX.guilds.map(g => g.id) } }).then(serverFeeds => {
      serverFeeds.forEach(async svFd => {
        const serverData = await DB.servers.get(svFd.server);
        svFd.feeds.forEach(async feed => {
          
          if (feed.type === 'rss'){
            const data = await parser.parseURL(feed.url);
            if (data.items[0] && feed.last.guid != data.items[0].guid) {
              const embed = await RSSembedGenerator(data.items[0],data);
              await DB.feed.updateOne({server:svFd.server,'feeds.url':feed.url},{'feeds.$.last':data.items[0] });
              POLLUX.getChannel(feed.channel).send({embed});
            }        
          }
          
          if (feed.type === 'twitch'){
            const thisFeed = feed
            const options = { 
              method: 'GET', url: 'https://api.twitch.tv/helix/streams', qs: { user_login: feed.url },
              headers:{ 'User-Agent': 'Pollux@Polaris.beta-0.1', 'Client-ID': cfg.twitch }
            };
            rq(options, function (err, res, body) {
              if (err) throw new Error(err);
              const StreamData = JSON.parse(body).data[0];
              if(
                !(
                  thisFeed.last.type === StreamData.type &&
                  thisFeed.last.title === StreamData.title 
                )
              ){
                let opts = { 
                  method: 'GET', url: 'https://api.twitch.tv/helix/users', qs: { login: thisFeed.url },
                  headers:{ 'Client-ID': 'pxft8d1oya7iwgh7br053z9ezjgfno' } 
                };
                rq(opts, async function (err, res, bod) {
                  if (err) throw new Error(rr);
                  const streamer = JSON.parse(bod).data[0];
                  const embed = new gear.Embed;
                        embed.thumbnail(streamer.profile_image_url);
                        embed.author(StreamData.title);
                        embed.image(StreamData.thumbnail_url.replace('{width}','400').replace('{height}','240'));
                        embed.timestamp(StreamData.started_at);
                        embed.color("#6441A4");
                  const P = {lngs: [serverData.modules.LANGUAGE || 'en', 'dev'], streamerName: streamer.display_name };   
                  await DB.feed.updateOne({server:svFd.server,'feeds.url':thisFeed.url},{'feeds.$.last':StreamData});
                  POLLUX.getChannel(thisFeed.channel).send({
                    content : $t('interface.feed.newTwitchStatus',`**${P.streamerName}** is Live now!`,P )+` <https://twitch.tv/${streamer.login}>`
                    ,embed
                  });
                });
              }
            });
          } 
        })
      })
    })    
  })()


})


const ONEminute = new CronJob('*/1 * * * *', async () => {


  //======================================================================================
  /* EVERY 1 MINUTE */
  //======================================================================================

  /* Manage Mutes */ //================================
  DB.mutes.find({expires: {$lte: Date.now()} })
  .then(mutes => {
    mutes.forEach(mtu=>{
      DB.servers.get(mtu.server.id).then(svData=>{
        DB.mutes.expire(Date.now()).then(console.log);
        let logSERVER = POLLUX.guilds.get(mtu.server);
        let logUSER = bot.users.find(x=> x.id  === mtu.user);
        if(!logSERVER||!logUSER) return;
        let logMEMBER = logSERVER.member(logUSER);
        logMEMBER.removeRole(svData.modules.MUTEROLE).catch(err=>"Die Silently");
        
        if (svData.dDATA || svData.logging) {
          return;
          //delete require.cache[require.resolve('./modules/dev/logs_infra.js')]
          let log = require('./modules/dev/logs_infra.js');
          log.init({
            bot,
            server: logSERVER,
            member: logMEMBER,
            user: logUSER,
            logtype: "usrUnmute"
          });
        }      
      })
    })
  });

  /* Exchange Currency */ //================================
  /*
  discoin.fetch().then(async trades => {
    trades = JSON.parse(trades)
    if (!trades.length || trades.length === 0) return;
    await gear.wait(Number(process.env.SHARD) * 2);
    Promise.all(trades.map(td => resolveExchange(td, bot)));
  });
*/
  //---CRON END----///-----////------/////
}, null, true);

MIDNIGHT.start();
FIVEminute.start();
ONEminute.start();
ONEhour.start();
FIFTEENminute.start();
console.log("• ".green,"CRONs ready");

}