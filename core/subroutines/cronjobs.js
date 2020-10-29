


const { CronJob }       = require("cron");

exports.run = async function run() {

  const ONEminute = new CronJob("*/1 * * * *", async () => {
    
    PLX.registerCommands(true);
    translateEngineStart();
 
  }, null, true);

  ONEminute.start();

  console.log("• ".green, "CRONs ready");
};
