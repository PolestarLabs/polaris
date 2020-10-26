

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

  const ONEminute = new CronJob("*/1 * * * *", async () => {
    
    PLX.registerCommands(true);
    translateEngineStart();
 
  }, null, true);

  ONEminute.start();

  console.log("• ".green, "CRONs ready");
};
