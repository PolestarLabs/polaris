const gear = require("../utilities/Gearbox");
const DB = require("../database/db_ops");
const fs = require('fs')
const locale = require(appRoot+'/utils/i18node');
const _EVT = require("../archetypes/Events"); 

function eventChecks(svDATA){
  if (!svDATA.event) return 1;
  if (!svDATA.event.enabled) return 1;
  if (!svDATA.event.channel) return 1;
  if (!svDATA.event.iterations) return 1;
  let I = Math.round(svDATA.event.iterations)
  return I||1;
};

const EVENT = _EVT.ongoing || false
const EVENTBOX = _EVT.box_identification || "O"
const EVENTICON = _EVT.box_picture || "chest"

function convertToEvent(i,box) {
    box.id   = box.id.replace("O", EVENTBOX)
    box.text = box.text += "\n" + i.eventDrop
    box.pic  = EVENTICON+".png"
    //box.pic  = "chest.png"
    return box;
};

module.exports = {
  lootbox: async function loot(trigger) {
const $t = locale.getT(); 
if(POLLUX.beta || POLLUX.restarting){
  if(trigger.channel.id !== "488142034776096772" && trigger.channel.id !== "488142183216709653")  return;
}

if(trigger.content=="pick" &&  !trigger.channel.natural){
 return    DB.users.set(trigger.author.id,{$inc:{'modules.exp':-10}});
}

  const checkRegex = /^_.*|^p!catch|^pick|\$w|\$m\b|^.!.*\s+|^.\/.*\s+|^\+.*\s+|^<.*[0-9]>$|^(.[A-Za-z]{10,})+$|(.)\2{4,}|(. ){4,}|(.{1,5})\4{3,}/g
  const msg = trigger.content.toLowerCase();

    if(msg.match(checkRegex)) return;


    const SVR = trigger.guild;
    const CHN = trigger.channel;
    const serverDATA = await DB.servers.findOne({id:SVR.id},{"modules.LOCALRANK":0});
    let prerf = serverDATA.modules.PREFIX || "+";
    const _DROPMIN   = 1
    const _DROPMAX   = 1000;
    const _RAREMAX   = 250
    const P = {
      lngs: trigger.lang,
      prefix:prerf
    }

    
    const v = {
      dropLoot: $t("loot.lootDrop." + (gear.randomize(1, 5)), P) + $t("loot.lootPick", P).replace(prerf, ""),
      disputing: $t("loot.contesting", P),
      oscarGoesTo: $t("loot.goesTo", P),
      gratz: $t("loot.congrats", P),
      morons: $t("loot.morons", P),
      eventDrop: $t("loot.eventDrop", P),
      suprareDrop: $t("loot.suprareDrop", P)+ $t("loot.lootPick", P),
      rareDrop: $t("loot.rareDrop", P)+ $t("loot.lootPick", P),
      ultraRareDrop: $t("loot.ultraRareDrop", P)+ $t("loot.lootPick", P)
    }

    let droprate = 777;
    droprate = gear.randomize(_DROPMIN,_DROPMAX);

    let BOX = { id:'lootbox_C_O', text:v.dropLoot, pic:"chest.png"}
    //console.log(droprate)


    let iterations = eventChecks(serverDATA);
    for (i=0;i<iterations/5;i++){
      droprate = gear.randomize(_DROPMIN , _DROPMAX);
      if(droprate == 777) break;
    };
    if(droprate !== 777 && !trigger.guild.large ){
      droprate = gear.randomize(_DROPMIN , _DROPMAX);
    }

    if (EVENT){
      let dropevent = gear.randomize(1, 5);
      if (dropevent >= 2) BOX = convertToEvent(false,BOX);
    }

    let rarity = gear.randomize(0,_RAREMAX);
    switch (true){
      case rarity <=8:
        BOX.id  = "lootbox_UR_O";
        BOX.text= v.ultraRareDrop;
        break;
      case rarity <= 16:
        BOX.id  = "lootbox_SR_O";
        BOX.text= v.suprareDrop;
        break;
      case rarity <= 32:
        BOX.id  = "lootbox_R_O";
        BOX.text= v.rareDrop;
        break;
      case rarity <= 64:
        BOX.id  = "lootbox_U_O";
        BOX.text= v.dropLoot;
        break;
      case rarity <= 128:
        BOX.id  = "lootbox_C_O";
        BOX.text= v.dropLoot;
        break;
      default:
        BOX.id  = "lootbox_C_O";
        BOX.text= v.dropLoot;
    };

   // if(trigger.channel.id=="426308107992563713") droprate= 777;
    let dropcondition = droprate===777 || (trigger.content=="fdrop" && trigger.author.id==='88120564400553984');

    dropcondition ? console.log((`>> DROPRATE [${droprate}] >> ${trigger.guild.name} :: #${trigger.channel.name} `+"").red.bgYellow) : false;
    if(dropcondition){

    console.log(("DROPPE!!!").green)

      if (!BOX) return;
      trigger.channel.natural = true

      let lootMessage = await CHN.send(BOX.text,{
        file:fs.readFileSync(paths.BUILD + (BOX.pic || "chest.png")),name:"LOOTBOX.png"
      }).catch(e=>false);
      if(!lootMessage) return;

      let ballotMessage = await CHN.send(v.disputing).catch(e=>false);
      if(!ballotMessage) return CHN.send("An error has occurred at `LOOT_BALLOT.get`");

      //COLLECT PICKERS
      let pickers = [];
      let bal_content = ballotMessage.content;
      const responses = await CHN.awaitMessages(pickMsg=>{

        if( !pickMsg.author.bot
            && !pickers.find(u=>u.id==pickMsg.author.id)
            && pickMsg.content.toLowerCase().includes('pick') ){
              if(ballotMessage){
                ballotMessage.edit(bal_content + "\n" + pickMsg.author.username).then(newmsg=>{
                  bal_content=newmsg.content;
                });
              };
              pickMsg.addReaction(':loot:339957191027195905').catch(e=>{});

              pickers.push({id:pickMsg.author.id, name:pickMsg.author.username, mention:`<@${pickMsg.author.id}>`});
              return true;
            }else{
              //pickMsg.delete().catch();
            };
        }, {time: 15000});

      console.log(pickers)

      if (pickers.length === 0) {
        CHN.send(v.morons);
        return;
      };

      try{
        CHN.deleteMessages(responses).catch(e=>false);
      }catch(e){
        //if(responses.first()) responses.first().delete().catch(e=>false);
      }

      lootMessage.delete().catch(e=>{});
      ballotMessage.delete().catch(e=>{});

      let p_sz = pickers.length-1;
      let rand =  gear.randomize(0,p_sz);
          rand = gear.randomize(0,p_sz);
          rand = gear.randomize(0,p_sz);
      pickers=gear.shuffle(pickers)

      let luckyOne = pickers[rand];

      let drama = pickers.map(user=>user.name);
      let ids = pickers.map(user=>user.id);
      let drama_message = "\u200b\n• "+drama.join('\n• ');
      let mention = pickers.map(user=>user.mention);
      //drama[rand] = mention[rand];
      let mention_message = "• "+drama.join('\n• ');

      let goesto = await CHN.send(v.oscarGoesTo);
      let dramaMsg = await CHN.send(drama_message);
                    console.log(("WINNER PICKED!!!").green)
      await gear.wait(4);

      //dramaMsg.edit("||"+drama[rand]+"||");
      //await gear.wait(1);

     /*
      gear.dropHook.send("---\nLootbox Drop at **"+trigger.guild.name+"** ("+trigger.guild.id+") - `#"+trigger.channel.name+"` ("+trigger.channel.id+") \n Message to trigger: ```"+trigger.content+"```" +`
Participants:
\`\`\`
${pickers.map(x=>x.name+" - "+x.id).join("\n")}
 \`\`\`
Winner:\`${JSON.stringify(luckyOne)}\
---

`)
      */
      trigger.channel.deleteMessages(responses.map(x=>x.id));
      await DB.users.set(luckyOne.id,{$push:{'modules.inventory':BOX.id}});
                      console.log(("BOX ADDED!!!").green)
      goesto.delete().catch(e=>false);
      dramaMsg.delete().catch(e=>false);
      CHN.send("||"+drama[rand]+"||, "+v.gratz);
      await Promise.all([
        DB.users.set({id:{$in:ids}},{$inc:{'modules.exp':100}})
       ,DB.users.set(luckyOne.id,{$inc:{'modules.exp':500}})
       ,DB.control.set(
         trigger.author.id,
         {$inc:
          {'data.boxesLost':-1,'data.boxesTriggered':1,'data.boxesEarned':1},
          $push:{'data.boxTriggerMessages' : `[${pickers.length} Pickers] | `+(trigger.content || "[Embeded Image]")}})
       ,DB.control.set({id:{$in:ids}},{$inc:{'data.boxesLost':1}})
      ]);
      trigger.channel.natural = false
    }
  }
}
