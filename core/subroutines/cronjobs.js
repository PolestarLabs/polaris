
const moment            = require("moment");

const { CronJob }       = require("cron");


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

  const FIFTEENminute = new CronJob("*/15 * * * *", async () => {
    PLX.updateBlacklists(DB);
  });

  const ONEminute = new CronJob("*/1 * * * *", async () => {
    console.log(`
   ${PLX.cluster.name.bgBlue} - Latency: ${PLX.shards.map((x) => x.latency)} - Uptime: ${moment(Date.now() - PLX.uptime).fromNow(true)}
  `);

    //= =====================================================================================
    /* EVERY 1 MINUTE */
    //= =====================================================================================

  }, null, true);

  MIDNIGHT.start();
  FIVEminute.start();
  ONEminute.start();
  ONEhour.start();
  FIFTEENminute.start();
  console.log("• ".green, "CRONs ready");
};
