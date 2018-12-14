//const gear = require("../../gearbox.js");
const cmd = 'roll';
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (message) {

const v={}


const P = {user:message.member.username,lngs:message.lang}
  //if(gear.autoHelper([$t("helpkey",P),"noargs"],{cmd,message,opt:this.cat}))return;

let DICE_REGEX = /([0-9]* *d[0-9]+)/g
let DICE_EMOTES={
  "2": "<:exchange:446901834246782976>",
  "4":      "[DICE]",//gear.emoji("d4"),
  "6":      "[DICE]",//gear.emoji("d6"),
  "8":      "[DICE]",//gear.emoji("d8"),
  "10":     "[DICE]",//gear.emoji("d10"),
  "12":     "[DICE]",//gear.emoji("d12"),
  "20":     "[DICE]",//gear.emoji("d20"),
  "any":    "[DICE]",//gear.emoji("d20")
}

gear={randomize: function(max,min){
  return Math.floor(Math.random() * (max - min + 1) + min);
}}

const MTH = /[\+\-\*\/\(\)]/g
let rollEq = message.content.split(/\s+/).slice(1).join(" ");
let primaEx = message.content.split(/\s+/).slice(1).join(" ");

  
  //const userDATA = await gear.userDB.findOne({id:message.author.id});
  let variables = []//(userDATA.switches||{}).variables //.filter(va=> !isNaN(Number(va.value)));
  
  
    let counter = 0
  while(rollEq.includes("m!")){
    counter++
    if(counter>25)break;
    variables.forEach(vari=>{
    let regex = new RegExp("\\b"+vari.tag+"\\b","g");
    rollEq = rollEq.replace(regex,"("+vari.value+")")
    //message.reply("`"+rollEq+"`")
  })
  }
  
  variables.forEach(vari=>{
    console.log({vari,rollEq})
    let regex = new RegExp("\\b"+vari.tag+"\\b","g");
    rollEq = rollEq.replace(regex,(vari.value+" "))
   // message.reply("`"+rollEq+"`")
  })
  
  
let   NOSTREAK = false
if(rollEq.includes("-nostreak")){
  rollEq=rollEq.replace(/-nostreak/g,"");
  NOSTREAK = true 
}
  
let dicesRolled = rollEq.match(DICE_REGEX)  
const SINGLEROLL = (dicesRolled.length==1&&!rollEq.match(MTH));
const SIMPLEROLL = (dicesRolled.length==1&&rollEq.match(MTH)!=null)
      
      
if (dicesRolled.length>5) return message.reply("You can only roll 5 different dices at a once!");
const  MAX_DISP = Math.floor(dicesRolled.length  / 25)||25;
  
let diceArray = []

 
   const streakLimit = "Dice streak can be shown for up to 25 rolls.",
    s_total =  $t('terms.total',P),
    s_overview = $t('terms.overview',P),
    s_result =  $t('terms.res',P),
    theyRollsomedice = $t("games.dice.userRolledSome",P)

let notThisPls = $t("games.dice.exceedLim",P);

  for (i in dicesRolled){
    let diceAmount = Number(dicesRolled[i].split("d")[0]||1);
    let diceFaces  = Number(dicesRolled[i].split("d")[1]||1);
    
    P.numDice = dicesRolled[i];    
    let theyRolled =  $t("games.dice.userRolled",P),
        neutralRolled =  $t("games.dice.neutralRolled",P) 
    
    let dicetex = `${DICE_EMOTES[diceFaces]||DICE_EMOTES.any}  ${(SINGLEROLL||SIMPLEROLL)?theyRolled:neutralRolled}`
    let diceStreak = []
    let rollTotal = 0
    
    for (j=0;j<diceAmount;j++){
      let rand = gear.randomize(1,diceFaces);
      rollTotal+= rand
      if(!NOSTREAK){
        
      if(diceAmount<=MAX_DISP&&diceAmount>1){
        diceStreak.push(rand)
      }else if(diceAmount>MAX_DISP){
        diceStreak = streakLimit
      }
      }

    }
    
      P.val = rollTotal;
      let andGot =  $t("games.dice.andGot",P) ;
 
   
    
      
     let commentary= rollTotal==diceFaces*diceAmount?"⭐":(rollTotal==1||rollTotal==diceAmount)?"💀":"";
     let dicepost = andGot + commentary
     
     diceArray.push({dicetex,dicepost,diceStreak,rollTotal});
    
  }

  
  let rollEq2 = rollEq.toLowerCase();
  let loop = 0

  while(rollEq2.match(/[0-9]*d[0-9]+/g)){
    rollEq2 = rollEq2.replace(/[0-9]*d[0-9]+/,diceArray[loop].rollTotal)
    loop++
  }
  rollEq2=rollEq2.replace(/\s/g,"")
  rollEq2=rollEq2.replace(/(?=[^\+\-\*\/\(\)])(?=[^0-9])[^DICE]/g,"")
  
  
  
 //message.reply("```js\n"+JSON.stringify({diceArray,rollEquation_RAW:rollEq,rollEquation:rollEq2,RESULT,SIMPLEROLL,SINGLEROLL},null,3)+"```")
  
  
  var RESULT = 0
      
      try{
     RESULT= eval(rollEq2);        
      }catch(e){
        try{
          
     RESULT= eval(rollEq2+"0");        
        }catch(err){
          message.reply("Invalid Roll Equation -- Only the dice will be rolled!")
        }
      }
  
  RESULT = Math.floor(RESULT);
  if(primaEx.includes("-up")) RESULT = Math.ceil(RESULT);
  
  let totalTex = "**"+s_total+": "+RESULT+"**";
  
  
  let final_pre = (SIMPLEROLL||SINGLEROLL?"":theyRollsomedice+"\n")+diceArray.map(x=>x.dicetex).join("\n").replace(/ +/g," ")
  
  let final = (SIMPLEROLL||SINGLEROLL?"":theyRollsomedice+"\n")+diceArray.map(x=>x.dicetex + x.dicepost + (x.diceStreak.length>0?"`"+x.diceStreak+"`":"")).join(" \n").replace(/ +/g," ")
  
  
  if (isNaN(Number(rollEq2[rollEq2.length-1]))&&!"()".includes(rollEq2[rollEq2.length-1])) rollEq2 = rollEq2.slice(0,-1);
let overviewPre =  `

${ SINGLEROLL ?"":  `${s_overview}: \`${"---"}\``}
${ SINGLEROLL ?"":  `**${s_result}:** ${"---"}` }

`
let overview = `

${ SINGLEROLL ?"":  `${s_overview}: \`${rollEq2}\``}
${ SINGLEROLL ?"":  `**${s_result}:** ${RESULT}`  }

`

if((final+overview+5).length>2000){
  return message.reply(notThisPls);
}

  message.channel.send(final_pre+overviewPre)
    .then(async mes=>{
         // await gear.wait(2);
          mes.edit(""+final+overviewPre)
            .then(async me2=>{
                  // await gear.wait(1);
                   me2.edit(final+ overview)
          })
  }).catch(e=>message.reply(notThisPls))

  
  

  
  
  }
 module.exports = {
    pub:false,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'roleplay'
};
  
