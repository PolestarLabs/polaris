// _PLX[epic=Utilities] Per-Shard Cronjobs

const moment = require("moment");

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
  const FIVE_MINUTES = new CronJob("*/5  * * * *", async () => {

    PLX.gamechange();

  }, null, true);

  //= =====================================================================================
  /* EVERY 1 HOUR */
  //= =====================================================================================
  const ONE_HOUR = new CronJob("0 */1 * * *", async () => {

  });

  //= =====================================================================================
  /* EVERY 15 MINUTES */
  //= =====================================================================================
  const FIFTEEN_MINUTE = new CronJob("*/15 * * * *", async () => {

    PLX.updateBlacklists(DB)
      .then(() => { console.report("•".green + " Blacklist updated") });

    try {
      PLX.microserver.microtasks.updateServerCache("all")
        .then(() => { console.report("•".green + " Server cache updated") });
    } catch (err) {
      console.error("•".red + " Microserver update failed. Restarting...");
      PLX.microserverStart();
    }

  });

  //= =====================================================================================
  /* EVERY 1 MINUTE */
  //= =====================================================================================
  const ONE_MINUTE = new CronJob("*/1 * * * *", async () => {
    console.report(`Latency: ${PLX.shards.map((x) => x.latency)} - Uptime: ${moment(Date.now() - PLX.uptime).fromNow(true)}
    `.gray);

  }, null, true);

  MIDNIGHT.start();
  FIVE_MINUTES.start();
  ONE_MINUTE.start();
  ONE_HOUR.start();
  FIFTEEN_MINUTE.start();
  console.log("• ".green, "CRONs ready");
};
