// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();
const cmd = 'roll';

const init = async function (message) {

const v={}


const P = {user:message.member.username,lngs:message.lang,prefix:message.prefix}
  if(PLX.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,message,opt:this.cat}))return;


let DICE_REGEX = /([0-9]* *d[0-9]+)/g
let DICE_EMOTES={
  "2": "<:exchange:446901834246782976>",
  "4":     _emoji("d4"),
  "6":     _emoji("d6"),
  "8":     _emoji("d8"),
  "10":    _emoji("d10"),
  "12":    _emoji("d12"),
  "20":    _emoji("d20"),
  "any":   _emoji("d20")
}


const MTH = /[\+\-\*\/\(\)]/g
let rollEq = message.content.split(/\s+/).slice(1).join(" ");
let primaEx = message.content.split(/\s+/).slice(1).join(" ");

  
  const userDATA = await DB.users.get({id:message.author.id});
  let variables = (userDATA.switches||{}).variables//||[]).filter(va=> !isNaN(Number(va.value)));
 
  let counter = 0
  while(rollEq.includes("!")){
    counter++
    if(counter>25)break;
    variables.forEach(vari=>{      
    let regex = new RegExp("!\\b"+vari.tag.replace("!","")+"\\b","g");
    //console.log( rollEq) 
    rollEq = rollEq.replace(regex,"("+vari.value+")")
  })
  }
  
  variables.forEach(vari=>{
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


if(!dicesRolled) return  message.channel.send ($t("games.dice.noDiceRolled",P));
const SINGLEROLL = (dicesRolled.length==1&&!rollEq.match(MTH));
const SIMPLEROLL = (dicesRolled.length==1&&rollEq.match(MTH)!=null)
      
      
if (dicesRolled.length>5) return message.reply($t("games.dice.onlyRoll5",P));
const  MAX_DISP = Math.floor(dicesRolled.length  / 25)||25;
  
let diceArray = []

 
   const streakLimit = $t("games.dice.limit25",P),
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
      let rand = randomize(1,diceFaces);
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
          message.reply( $t("games.dice.invalidRoll",P) )
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
          await wait(2);
          mes.edit(""+final+overviewPre)
            .then(async me2=>{
                   await wait(1);
                   me2.edit(final+ overview)
          })
  }).catch(e=>message.reply(notThisPls))

  
  

  
  
  }
 module.exports = {
    pub:true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'roleplay'
};
  
