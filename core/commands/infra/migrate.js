
const YesNo = require("../../structures/YesNo.js");
// TRANSLATE[epic=translations] ?? migrate

function SAPPHIREFACTOR(don, pastDon) {
  const tiers = {
    antimatter: 10,
    astatine: 8,
    uranium: 7,
    zircon: 6,
    palladium: 5,
    lithium: 4,
    carbon: 4,
    iridium: 3,
    iron: 3,
    aluminium: 2,
    plastic: 1,
  };

  return (1 + (tiers[don] || 0)) + ((1 + (tiers[pastDon] || 0)) / 10);
}

const init = async function (msg, args) {
  const embed = {};
  const yesNoOptions = { embed, clearReacts: true, time: 120e3 };

  const mansionMember = await PLX.resolveMember("277391723322408960",msg.author.id,{softMatch:false});
  if ( !mansionMember.roles.includes('278985430844833792') && !mansionMember.roles.includes('278985430844833792') ){
    return msg.reply(`${_emoji('nope')} • Migration is in testing phase for supporters & staff only`); 
  }


  const userData_OLD = await vDB.users.findOne({id:msg.author.id}).noCache().lean();
  const userData_NEW = await DB.users.findOne({id:msg.author.id}).noCache().lean();
  

  if (userData_NEW.migrated) return msg.reply(`${_emoji('nope')} • Your account has already been migrated!`);

  // SECTION SLIDE 1 ----------------------------------------------------------

  embed.color = 0x2b2b3F;
  embed.title = "Transfer in progress...";
  embed.description = `
Be sure to read and agree with our new [**Privacy Policy**](${paths.DASH}/privacy) and [**Terms of Service**](${paths.DASH}/terms) before continuing.
Pollux collects usage data for analytics and telemetry purposes and does not store messages. Violation of terms might lead to permanent blacklisting.

**Do you agree with those?**
    `;
  embed.footer = { icon_url: msg.author.avatarURL, text: "Progress: 🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛" };

  const prompt = await msg.channel.send({ embed });

  let step = await YesNo(prompt, msg, false, false, false, yesNoOptions);
  if (!step) return;

  embed.description = `
 • Your Lootboxes will be capped to **10 of each type**, any exceeding boxes will be **destroyed**.
 • Your **Rubines** will be reset. You'll get to keep 5% of what you have now, + your current Daily Streak × 15.
 • Your **Jades** will be halved.
 • Your **Sapphires** will be increased by **20%** *(if you have an active supporter tier you get +10% per tier level. Max +80%)*.
 • Your **Marriages** will be transferred unless they're with yourself or with a repeated person, if someone you're married to already did the transfer, they will be skipped.
 
 • Your **Inventory** will be kept, but we'll convert it to the new system, this might take a while. Stuff like event boxes might be lost in this step.
 • You will receive a special "Touhou Classic" deck skin for being a pre-Polaris player, thank you~.
 • You will receive 1 Sapphire for every month of daily streak (applied *after* the 20%+ multi).
 

**Are you ready?**
    `;
  embed.color = 0x2b2b3F;
  embed.footer = { icon_url: msg.author.avatarURL, text: "Progress: 🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛" };

  await prompt.edit({ embed });
  await wait(3);

  step = await YesNo(prompt, msg, false, false, false, yesNoOptions);
  if (!step) return;
  // !SECTION SLIDE 1


  // SECTION SLIDE 2 ----------------------------------------------------------

  embed.color = 0x2b2b3F;
  let exceedingBoxBonus = 0;
  let marriage_message = null;

  const TASKLIST = {
    
    complete: function complete(id){
      this.items[id].status = 'complete';
    },
    notcomplete: function complete(id){
      this.items[id].status = 'nope';
    },
    printProgress(){
      return this.items.map(x=>x.status==='complete'?'🟦':x.status=='nope'?'🟦':'⬛').sort().reverse().join('');
    },
    printList(){
      return this.items.map(it=>{
        if (it.status == 'complete') return `${_emoji("yep")} • ${it.name}`;
        if (it.status == 'pending') return `${_emoji("loading")} • ${it.name}`;
        else return `${_emoji("nope")} • ${it.name}`;        
      }).join('\n');
    },
    items: [
      {
        name: "Transferring Marriages",
        wait: true,
        status: "pending",
        action: async function(){
          const marr_mig = require("../misc/mrgt.js");
          const marriage_transfer_res = await new Promise(async (res, rej) => {
            await marr_mig.init(msg, args, res)
            .catch((err) => {
              console.error(err);
              rej(err);
            });
          }).timeout(15e4).catch((err) => {
            embed.color = 0xFF5500;
            embed.title = "Migration Aborted!";
            embed.footer.text = "TIMEOUT";
            prompt.edit({ embed });
            return null;
          });
      
          if (!marriage_transfer_res) {
            msg.channel.send("Something went wrong with your migration process. Please try again.");
            return false;      
          }
          
          const {size,imported,cost} = marriage_transfer_res;
          await DB.users.set(msg.author.id, { $inc: { "modules.SPH": -1 * cost || 0 } });
          this.name += ` (${imported}/${size} - ${_emoji('SPH')}**-${cost}**)`;
          marriage_message = marriage_transfer_res.res;

          return true;
        } 
      },
      {
        name: "Converting Inventory",
        wait: true,
        status: "pending",
        action: async function(){

          const oldInventory = userData_OLD.modules.inventory;
          const newInventory = [];
          
          oldInventory.forEach((item) => {
            if (item.id) return;
            const currItem = newInventory.find((sub) => sub.id === item);
            
            if (currItem) {
              if (currItem.id.includes("lootbox") && currItem.count < 10) currItem.count++;
              else if (currItem.id.includes("lootbox") && currItem.count >= 10) exceedingBoxBonus++ ;
            } else newInventory.push({ id: item, count: 1 });
          });
          
          await DB.users.set(msg.author.id, { $set: { "modules.inventory": newInventory } }).catch(console.error);
          userData_OLD.modules.inventory = newInventory;
          
          return true;
        }
      },
      {
        name: "Capping Lootboxes",
        wait: true,
        status: "pending",
        action: async function(){
          /*
          const updatedUserDB = DB.users.findOne({id:msg.author.id}).noCache().lean();
          let boxes = updatedUserDB.modules.inventory.filter(item=>item.id.includes('lootbox'));

          let bulk = await DB.users.bulkWrite(boxes.map(q=> ({
            updateOne: { 
              filter: { id: msg.author.id, "modules.inventory.id": q.id },
              update: { $set: { "modules.inventory.$.count": Math.min(q.count,10) } }
            }
          }))).catch(err=>null);
          console.log(bulk);
          return !!bulk;
          */
          this.name += ` (+${_emoji('PSM') + exceedingBoxBonus})`;
          await DB.users.set(msg.author.id, {$set: {"modules.PSM": exceedingBoxBonus} });
          return true;
        }
      },
      {
        name: "Recalculating Gemstones",
        wait: true,
        status: "pending",
        action: async function(){
                  
          const newRubines = Math.min(~~((userData_OLD.modules.rubines || 0) * 0.05) + (userData_OLD.modules.dyStreakHard || 1) * 10, 50000);
          const oldRubines = userData_OLD.modules.rubines || 0;
          const jades      = ~~(userData_OLD.modules.jades / 2);
          const saph       = ~~(userData_OLD.modules.sapphires * (SAPPHIREFACTOR(userData_OLD.donator, userData_OLD.formerDonator)) / 10 + 1);

          await DB.users.set(msg.author.id, {
            $set:
                {
                  "counters.daily.streak": userData_OLD.modules.dyStreakHard || 0,
                  "counters.daily.last": userData_OLD.modules.daily || 0,
                  "modules.RBN": newRubines,
                  "modules.rubinesOld": oldRubines,
                  "modules.JDE": jades,
                  "modules.SPH": saph,
                },
          });
          this.name += ` (${_emoji('RBN')}×**${newRubines}** ${_emoji('SPH')}×**${saph}** ${_emoji('JDE')}×**${jades}**)`;
          
          return true;
        }
      },
      {
        name: `Transferring Daily Streak (--)`,
        wait: true,
        status: "pending",
        action: async function(){
          this.name = `Transferring Daily Streak (${userData_OLD.modules.dyStreakHard})`;
          return true;
        }
      },
      {
        name: "Baking a Cake",
        wait: false,
        status: "pending",
        action: async function(){
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          await wait (1);
          this.name += ".";
          return true;
        }
      },
      {
        name: "Awarding **Touhou Classic** Deck Skin",
        wait: false,
        status: "pending",
        action: async function(){
          await wait (2);
          let result = await DB.users.set(msg.author.id,{$addToSet: {'modules.skinInventory':'casino_touhou-classic' } }).catch(err=>null);
          return !!result;
        }
      },
      {
        name: "Declaring Rubines Income Tax ",
        wait: true,
        status: "pending",
        action: async function(){
          return true;
        }
      },
      {
        name: "Converting Cosmetics IDs (Waiting for BGs sheet) ",
        wait: true,
        status: "pending",
        action: async function(){
          
          const myBGs = userData_OLD.modules.bgInventory;
          const myBGsFULL = await DB.cosmetics.find({ code: { $in: myBGs } }).lean();
          this.name += ` (${myBGsFULL.length}/${myBGs.length} found)`
          return false;
          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
        }
      },
      {
        name: `Freezing Global Ranks`,
        wait: true,
        status: "pending",
        action: async function(){
          //await vDB.users.set(msg.author.id,{$set: {"switches.rankFrozen": true} });
          await DB.users.set(msg.author.id,{$set: {"counters.legacy.globalLV": userData_OLD.modules.level , "counters.legacy.globalXP": userData_OLD.modules.exp} });
          return true;
        }
      },
      {
        name: "Migrating Donation Streaks (if any)",
        wait: true,
        status: "pending",
        action: async function(){
          const oldDonoTier = userData_OLD.donator;
          const oldDonoStreak = userData_OLD.switches.donateStreak;

          await DB.users.set(msg.author.id,{$set: { "prime.tier":oldDonoTier, "counters.prime_streak":oldDonoStreak  } });
          
          this.name = this.name.replace( "(if any)", `(**${oldDonoTier}** and ${Object.keys(oldDonoStreak).length} more tier(s) found)` );
          return true;
          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
        }
      },
    ],
  };

   let actionsDone = 0;
  let totalActions = TASKLIST.items.length;
console.log({totalActions})
  for (let i = 0; i < totalActions; i++) {

    embed.description = TASKLIST.printList();
    embed.footer = { icon_url: msg.author.avatarURL, text: "Progress: 🟦🟦" + TASKLIST.printProgress() };
    await prompt.edit({embed});


    let result;
    if (TASKLIST.items[i].wait){
      result = await TASKLIST.items[i].action();
      postTask(result,i);
    }else{
      TASKLIST.items[i].action().then(r=>postTask(r,i));
    }

    embed.description = TASKLIST.printList();
    await prompt.edit({embed});
    await wait(2);
  };

  async function postTask(result,i){

    if (result) TASKLIST.complete(i);
    else TASKLIST.notcomplete(i);
    
    await wait(1);
    actionsDone++;
    console.log({actionsDone,totalActions,name: TASKLIST.items[i].name})

    if (actionsDone >= totalActions){
      if (marriage_message) marriage_message.delete().catchReturn();
      //await vDB.users.set(msg.author.id,{$set: {"migrated": true} });
      //await DB.users.set(msg.author.id,{$set: {"migrated": true} });

      embed.title = "Transfer complete!";
      embed.color = 0x22AA66;
      embed.footer = { icon_url: msg.author.avatarURL, text: "Progress: 🟦🟦" + TASKLIST.printProgress() };
      embed.description = TASKLIST.printList();
      await prompt.edit({embed});
      await wait(1);

      msg.channel.send("All set! Your account has been migrated to the New Super Fancy Pollux Database™ successfully! Enjoy the new features~");
      await wait(1);
      msg.channel.send("*Ah, also. Have this cake!*");
      await wait(1);
      msg.channel.send({
        embed: {
          title: "You received **1 Polaris Cake**",
          thumbnail: { url: "https://cdn.discordapp.com/emojis/446901835865784321.png" },
          description: `
          ***Food Items** are used to recover **Stamina**, which is consumed to perform certain actions.
          ~~Try using \`${msg.prefix}food info\` to learn more!~~ **SOON**™️`,
        },
      });
    };
  }

};



module.exports = {
  init,
  pub: true,
  cmd: "migrate",
  cat: "infra",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
