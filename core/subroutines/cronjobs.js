// _PLX[epic=Utilities] Per-Shard Cronjobs
const formatDistance = require("date-fns/formatDistance");

const { CronJob } = require("cron");

//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================
//= =====================================================================================

exports.run = async function run() {

  console.log("• ".blue, "Loading CRON subroutines...");

  //= =====================================================================================
  /* EVERY MIDNIGHT */
  //= =====================================================================================
  const MIDNIGHT = new CronJob("0 0 * * *", () => {

  }, null, true);

  //= =====================================================================================
  /* EVERY 5 MINUTES */
  //= =====================================================================================
  const updateGuildSettings = require("./updateGuildSettings.js");
  const FIVE_MINUTES = new CronJob("*/5  * * * *", async () => {

    //PLX.gamechange();
    Array.from(PLX.guilds).forEach(async ([id,guild],ind) => {
      setTimeout(()=>
        setImmediate(()=>updateGuildSettings(id)),
        ind * 10
      )
    })

  }, null, true, null /*TZ*/, null/*CONTEXT*/, true /*RUN ON INIT*/);

  //= =====================================================================================
  /* EVERY 1 HOUR */
  //= =====================================================================================
  const ONE_HOUR = new CronJob("0 */1 * * *", async () => {

  });

  //= =====================================================================================
  /* EVERY 15 MINUTES */
  //= =====================================================================================

  const Feeds = require("./feeds");

  const FIFTEEN_MINUTE = new CronJob("*/15 * * * *", async () => {
    
    const blstart = Date.now();
    PLX.updateBlacklists(DB)
      .then(() => { console.report("•".green + ` Blacklist updated (${ Date.now() - blstart }ms)`) });
    
    Feeds.check();
    
    try {
      const start = Date.now();
      //PLX.microserver.microtasks.updateServerCache("all")
        //.then(() => { console.report("•".green + ` Server cache updated (${ Date.now() - start }ms)`) });
    } catch (err) {
      console.error("•".red + " Microserver update failed. Restarting...");
      //PLX.microserverStart();
    }

  });

  //= =====================================================================================
  /* EVERY 1 MINUTE */
  //= =====================================================================================
  const ONE_MINUTE = new CronJob("*/1 * * * *", async () => {

    
    
    PLX.shards.map(shard=>{
      INSTR.gauge(`shards.id`, shard.id ,{shard: shard.id})
      INSTR.gauge(`process.uptime`,process.uptime(),{shard: shard.id})
      INSTR.gauge(`shards.latency`,shard.latency,{shard: shard.id})
      INSTR.gauge(`shards.latency.${shard.id}`,shard.latency,{shard: shard.id})
    })


    console.report(`Latency: ${PLX.shards.map((x) => x.latency)} - Uptime: ${formatDistance(PLX.uptime, 0)}
    `.gray);

  }, null, true);

  MIDNIGHT.start();
  FIVE_MINUTES.start();
  ONE_MINUTE.start();
  ONE_HOUR.start();
  FIFTEEN_MINUTE.start();
  console.log("• ".green, "CRONs ready");
};
