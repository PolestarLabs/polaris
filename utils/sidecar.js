// _PLX[epic=Utilities] Sidecar Instance / Cronjobs

const { Client } = require("eris");
const cfg = require("../config.json");
const moment = require("moment");
const { CronJob } = require("cron");
require("colors");

Promise = require("bluebird");

console.log("Sidecar Started".blue);

global.PLX = new Client(`Bot ${cfg.token}`, { restMode: true, intents: 0 });
PLX.cluster = { id: "-1", name: "[SIDECAR]" };


const DBSchema = require("@polestar/database_schema");
const WebhookDigester = require("./WebhookDigester.js");
const hook = new WebhookDigester(PLX);

const dbConnectionData = {
  hook: null,
  url: cfg.dbURL,
  options: {
    useNewUrlParser: true,
    keepAlive: 1,
    connectTimeoutMS: 8000,
    useUnifiedTopology: true,
    poolSize: 100,
  },
};

Gearbox = require("../core/utilities/Gearbox");

Object.assign(global, Gearbox.Global);
Object.assign(PLX, Gearbox.Client);

global._emoji = (E, F) => new (require("../resources/lists/emoji.js")).PolluxEmoji(E, F);

DBSchema(dbConnectionData).then((Connection) => {
  global.DB = Connection;
  PLX.connect().then((_) => hook.info("Sidecar instance running")).catch(console.error);
});

//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================

console.log("• ".blue, "Loading CRON subroutines...");

const MIDNIGHT = new CronJob("0 0 * * *", () => {
  //= =====================================================================================
  /* EVERY MIDNIGHT */
  //= =====================================================================================

}, null, true);

const FIVEminute = new CronJob("*/5  * * * *", async () => {

}, null, true);

const FIFTEENminute = new CronJob("*/1 * * * *", async () => {
  delete require.cache[require.resolve("../core/subroutines/feeds")];
  const feeds = require("../core/subroutines/feeds");
  feeds.check();
});

const ONEminute = new CronJob("*/1 * * * *", async () => {
  console.log(`
   ${"[SIDECAR]".blue} - Uptime: ${moment(Date.now() - PLX.uptime).fromNow(true)}
  `);

  //= =====================================================================================
  /* EVERY 1 MINUTE */
  //= =====================================================================================

  DB.temproles.find({ expires: { $lte: Date.now() } }).lean().exec()
    .then((temps) => {
      temps.forEach((tprl) => {
        DB.servers.get(tprl.server).then(async (/* svData */) => {
          const [logSERVER, logMEMBER] = await Promise.all([PLX.getRESTGuild(tprl.server), PLX.resolveMember(tprl.server, tprl.user)]).catch(async (err) => {
            await DB.temproles.remove({ _id: tprl._id });
          });
          if (!logSERVER || !logMEMBER) return;

          await DB.temproles.expire({ U: tprl.user, S: tprl.server });
          await PLX.removeGuildMemberRole(tprl.server, tprl.user, tprl.role, "Temporary Role").catch(() => "Die Silently");

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
  processReminders();
  setTimeout(()=>processReminders(),30e3);

  /* Manage Mutes */ //= ===============================
  DB.mutes.find({ expires: { $lte: Date.now() } })
    .then((mutes) => {
      [...new Set(mutes.map((m) => m.server))].forEach((muteSv) => {
        DB.servers.get(muteSv).then((svData) => {
          mutes.filter((mut) => mut.server === muteSv).forEach(async (mtu) => {
            // DB.mutes.expire(Date.now());
            const logSERVER = await PLX.getRESTGuild(mtu.server);
            if (svData.modules.MUTEROLE) {
              PLX.removeGuildMemberRole(svData.id, mtu.user, svData.modules.MUTEROLE, "Mute Expired").catch(() => "Die Silently")
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

FIFTEENminute.start();
console.log("• ".green, "CRONs ready");


function processReminders() {
  DB.feed.find({ expires: { $lte: Date.now() } }).lean().exec()
    .then((reminders) => {
      console.log({ reminders });
      reminders.forEach(async (rem) => {
        console.log(rem);
        try {
          // url = userID
          const destChannel = (await PLX.getRESTChannel(rem.channel).catch((e) => null)) || (await PLX.getDMChannel(rem.url));
          await DB.feed.deleteOne({ _id: rem._id });
          await destChannel.createMessage({
            content: (rem.channel === "dm" ? "" : `<@${rem.url}>`),
            embed: {
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
}

