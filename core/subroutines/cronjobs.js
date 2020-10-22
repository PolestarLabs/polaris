
const moment            = require("moment");

const { CronJob }       = require("cron");

const userDB = DB.users;

/*
const Discoin = require("../archetypes/Discoin.js");

const discoin = new Discoin(cfg.discoin);
const coinbase = require("../../resources/lists/discoin.json");
// const gear = g
const { receive } = require("../archetypes/Economy.js");

async function resolveExchange(exchange_itm, bot) {
  const usr = `${exchange_itm.user}`;
  const ts = Date(exchange_itm.timestamp * 1000);
  const src = exchange_itm.source;
  const amt = Number(Math.floor(exchange_itm.amount));
  const inv = exchange_itm.receipt;
  const taxes = 0; // Math.ceil(amt*0.1837)
  const coinfee = 0; // Math.floor(amt*(coinbase[src]||{rbnRate:0.005}).rbnRate)
  const newAmt = Math.floor(amt - taxes - coinfee);

  if (newAmt < 1) {
    discoin.reverse(inv);
    return bot.users.fetch(usr)
      .then((u) => u.send(":warning: Transaction Reversed :: Amount of Rubines below Zero")
        .catch((e) => console.warn(`User ${u.id} cannot receive DMs`)));
  }

  userDB.findOne({ id: usr }, { id: 1 }).then(async (USDATA) => {
    if (!USDATA) {
      discoin.reverse(inv);
      bot.users.fetch(usr)
        .then((u) => u.send("Transaction Reversed :: Not in Pollux Database")
          .catch((e) => console.warn(`User ${u.id} cannot receive DMs`)))
        .catch((e) => console.error(e));
      return;
    }
    receive(usr, newAmt, "discoin", "RBN", "+", `DISCOIN_${src}`).then((ok) => {
      function aN(inc, ref = amt) {
        const len = ref.toString().length;
        const len2 = inc.toString().length;
        let spaces = "";
        for (i = 0; i < len - len2; i++) {
          spaces += " ";
        }
        return spaces + inc;
      }
      bot.users.fetch(usr).then((u) => {
        u.getDMChannel().then((dmChan) => {
          dmChan.send(`
\`${src}\` ${coinbase[src].icon}:currency_exchange: ${_emoji("rubine")} \`RBN\`
**Exchange Processed!**

Inbound  : ${_emoji("rubine")} × **${amt}**
Fees         : ${_emoji("rubine")} × **${taxes + coinfee}**
\`\`\`diff
+Inbound Amount   :  ${aN(amt)}
-Transaction Fee  :  ${aN(taxes)}
-Exg. Tax for ${src} :  ${aN(coinfee)}
---------------------------
 Net Income       :  ${aN(newAmt)}
\`\`\`
Received **${newAmt}** **RBN**(*Pollux Rubines*) converted from **${src}**(*${`${coinbase[src].bot} ${coinbase[src].name}`}*)!
---
*Transaction Receipt:*
\`${ts}\`
\`\`\`${inv}\`\`\`

`).catch((e) => console.warn("[DISCOIN] User can't recveive DMs"));
        }).catch((e) => console.log(e, "\n\nERROR ON FETCH"));
      });
    });
  });
}
*/

//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================

exports.run = async function run() {
  console.log("• ".blue, "Loading CRON subroutines...");

  const MIDNIGHT = new CronJob("0 0 * * *", () => {
  //= =====================================================================================
  /* EVERY MIDNIGHT */
  //= =====================================================================================

    userDB.updateMany(
      { "limits.slots": { $gt: 10 } },
      { $set: { "limits.slots": 0 } },
    ).then(() => console.log("Daily Limit Reset for Slots "));
    userDB.updateMany(
      { "limits.blackjack": { $gt: 10 } },
      { $set: { "limits.blackjack": 0 } },
    ).then(() => console.log("Daily Limit Reset for Blackjack "));
    userDB.updateMany(
      { "limits.receive": { $gt: 2 } },
      { $set: { "limits.receive": 0 } },
    ).then(() => console.log("Daily Limit Reset for Receive "));
    userDB.updateMany(
      { "limits.give": { $gt: 2 } },
      { $set: { "limits.give": 0 } },
    ).then(() => console.log("Daily Limit Reset for Give "));
  }, null, true);

  const FIVEminute = new CronJob("*/5  * * * *", async () => {
  //= =====================================================================================
  /* EVERY 5 MINUTES */
  //= =====================================================================================

    PLX.gamechange();
    // let sname = getShardCodename(bot,Number(process.env.SHARD)+1)
    // bot.user.setPresence({shardID:Number(process.env.SHARD),status:'online',activity:{name:sname,type:0}});
  }, null, true);

  const ONEhour = new CronJob("* */1 * * *", async () => {
    PLX.microserver.microtasks.updateServerCache("all");
  });

  const FIFTEENminute = new CronJob("*/1 * * * *", async () => {
    PLX.updateBlacklists(DB);

    delete require.cache[require.resolve('./feeds')];
    const feeds = require('./feeds');

    feeds.check();
   
  });

  const ONEminute = new CronJob("*/1 * * * *", async () => {
    console.log(`
   ${PLX.cluster.name.bgBlue} - Latency: ${PLX.shards.map((x) => x.latency)} - Uptime: ${moment(Date.now() - PLX.uptime).fromNow(true)}
  `);

    //= =====================================================================================
    /* EVERY 1 MINUTE */
    //= =====================================================================================

    DB.temproles.find({ expires: { $lte: Date.now() } }).lean().exec()
      .then((temps) => {
        temps.forEach((tprl) => {
          DB.servers.get(tprl.server.id).then(async (/* svData */) => {
            const logSERVER = PLX.guilds.get(tprl.server);
            const logUSER = await PLX.resolveUser(tprl.user);
            if (!logSERVER || !logUSER) return;
            const logMEMBER = logSERVER.member(logUSER);
            if (!logMEMBER) return;
            await DB.temproles.expire({ U: tprl.user, S: tprl.server });
            await logMEMBER.removeRole(tprl.role, "Temporary Role").catch(() => "Die Silently");

            /*
            if (svData.dDATA || svData.logging) {
              return;
              // delete require.cache[require.resolve('./modules/dev/logs_infra.js')]

              const log = require("./modules/dev/logs_infra.js");
              log.init({
                bot,
                server: logSERVER,
                member: logMEMBER,
                user: logUSER,
                logtype: "usrUnmute",
              });
            }
            */
          });
        });
      });

    /* Manage Reminders */ //= ===============================
    DB.feed.find({ expires: { $lte: Date.now() } }).lean().exec()
      .then((reminders) => {
        reminders.forEach(async (rem) => {
          try {
            // url = userID
            const destChannel = PLX.getChannel(rem.channel) || (await PLX.getDMChannel(rem.url));
            await DB.feed.deleteOne({ _id: rem._id });
            await destChannel.createMessage({
              content: (rem.channel === "dm" ? "" : `<@${rem.url}>`),
              embed:
        {
          title: "<:alarm:446901834305634304> REMINDER:",
          description: rem.name,
          timestamp: new Date(),
          color: 0xcc2233,
          thumbnail: { url: "https://visualpharm.com/assets/601/Stopwatch-595b40b65ba036ed117d167a.svg" },
        },
            });
          } catch (e) {
            await DB.feed.deleteOne({ _id: rem._id });
            console.error("REMOVED FAULTY REMINDER");
            console.error(e);
          }
        });
      });

    /* Manage Mutes */ //= ===============================
    DB.mutes.find({ expires: { $lte: Date.now() } })
      .then((mutes) => {
        [...new Set(mutes.map((m) => m.server))].forEach((muteSv) => {
          DB.servers.get(muteSv).then((svData) => {
            mutes.filter((mut) => mut.server === muteSv).forEach(async (mtu) => {
              // DB.mutes.expire(Date.now());
              const logSERVER = PLX.guilds.get(mtu.server);
              if (svData.modules.MUTEROLE) {
                await logSERVER.removeMemberRole(mtu.user, svData.modules.MUTEROLE, "Mute Expired")
                  .then(() => mtu.delete())
                  .catch(() => mtu.delete());
              } else {
                return mtu.delete();
              }
              // activity logs stuff (LEGACY CODE)
              return undefined;
              /*
              const logUSER = await PLX.resolveUser(mtu.user);
              if (!logSERVER || !logUSER) return;
              const logMEMBER = logSERVER.member(logUSER);
              if (!logMEMBER) return;

              if (svData.dDATA || svData.logging) {
                return;
                // delete require.cache[require.resolve('./modules/dev/logs_infra.js')]
                const log = require("./modules/dev/logs_infra.js");
                log.init({
                  bot,
                  server: logSERVER,
                  member: logMEMBER,
                  user: logUSER,
                  logtype: "usrUnmute",
                });
              }
              */
            });
          });
        });
      });

    /* Exchange Currency */ //= ===============================
  /*
  discoin.fetch().then(async trades => {
    trades = JSON.parse(trades)
    if (!trades.length || trades.length === 0) return;
    await wait(Number(process.env.SHARD) * 2);
    Promise.all(trades.map(td => resolveExchange(td, bot)));
  });
*/
  // ---CRON END----///-----////------/////
  }, null, true);

  MIDNIGHT.start();
  FIVEminute.start();
  ONEminute.start();
  ONEhour.start();
  FIFTEENminute.start();
  console.log("• ".green, "CRONs ready");
};
