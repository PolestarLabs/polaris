const Canvas = require("canvas");
const DB = require('../../database/db_ops.js')
const Picto = require('../../utilities/Picto')
const gear = require('../../utilities/Gearbox.js')
const deckManager = require("../inventory/decks.js")
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();
const Blackjack = require('../../archetypes/Blackjack.js');
const _ASSETS = paths.BUILD + "games/blackjack/"

const ECO = require("../../archetypes/Economy.js")


const cmd="blackjack"

var enemyStando = false
let handarray = []
let hy = "|"



async function getCard(suit, num,deck) {
    hy += ` **${num}** ${suiticons[suit]} |`
  let minipath = paths.Build + "cards/casino/"+(deck||"default")+"/" + suit  + num + ".png"
  //console.log(minipath)
  let neo = await Picto.getCanvas(minipath)
  return neo
};

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['C', 'D', 'H', 'S'];
let suiticons = {
    S: "♠",
    D: "♦",
    H: "♥",
  C: "♣"
};

function S() {
    return suits[gear.randomize(0, suits.length - 1)]
};
function R() {
    return ranks[gear.randomize(0, ranks.length - 1)]
};

function cardValue(card) {
    const rank = ranks[ranks.indexOf(card.slice(0, -1))]
    let suit;
  if (card.includes('C')) suit = "C";
  if (card.includes('S')) suit = "S";
  if (card.includes('D')) suit = "D";
  if (card.includes('H')) suit = "H";
  
  return {
    r: rank,
    s: suit
}
};
async function compileHand(H,B,deck){
  console.log(deck)
    const IMG = new Canvas.createCanvas(400, 200);
    const ctx = IMG.getContext('2d');


    //console.log(H)
    
    if (H.length === 1) {
        let mono = H[0]
        for (i = 0; i < mono.length; i++) {
            await Dcard(mono[i], i,undefined,deck)
            
            
        }
    }else{
        let a=0
        for(y=0;y<H.length;y++){
            for (i = 0; i < H[y].length; i++) {
                await  Dcard(H[y][i],a,20,deck)
             a++
            }
            a+=1.5
        }
    }

    async function Dcard(card,i,aperture,deck){
        let a=aperture||0
        let imaga;
        console.log(card)
        if(typeof card==='string' && card.startsWith("JOKER")){
          let joker_id = card.split("-")[1];
          imaga = await Picto.getCanvas(paths.Build+"cards/casino/JOKERS/"+(joker_id||deck||'default')+".png")
        }
        else if(card[0]=="X"){
            imaga = await Picto.getCanvas(paths.Build+"cards/casino/"+(deck||'default')+"/backface.png")
        }else{
              //console.log(card)
              let x = cardValue(card);
              
              //console.log(x)
              imaga = await getCard(x.s, x.r,deck)
            }
            
            ctx.rotate(-.15)
        await ctx.drawImage(imaga,  (54-a) * i, 20+(i*1.5*((54-a)/10)) , 143,160);
        //console.log(B)
        ctx.shadowColor = B?'#eeff27':'#3b3b4b';
        ctx.shadowBlur = 10;
        ctx.rotate(.15)
         
    }
  
    return IMG
}
async function drawTable(PL,DL,DATA_A,DATA_B,stuff){
    
    let msg     = stuff.m,
    bet     = stuff.b,
    v       = stuff.v,
        _PLAYER = stuff.p,
        _DEALER = stuff.d
        
    
        
    
    const SCENE = new Canvas.createCanvas(400, 300);
    const c = SCENE.getContext('2d');
    
    
    let SCORE_A = DATA_A.status+DATA_A.val
    let SCORE_B = DATA_B.val
    let RESULT = "Blackjack"
    let OUTCOME = "WIN"
    
    
    let fel = await Picto.getCanvas(paths.Build+"/games/blackjack/feltro.png")
    c.drawImage(fel,0,0)
    switch(true){
        
      case bet <= 25:
      chips = 1
        break;
        case bet <= 50:
        chips = 2
        break;
        case bet <= 100:
        chips = 3
        break;
        case bet <= 300:
        chips = 4
        break;
        case bet <= 999:
        chips = 5
        break;
        default:
        chips = 6
        break;
    }
    

    let chip = await Picto.getCanvas(_ASSETS+"chips-"+chips+".png")
    c.drawImage(chip,140,170)
    
    //=================================
    c.drawImage(DL,-10,180)
    c.translate(200, 150);
    c.rotate(180 * Math.PI / 180);
    c.translate(-200, -150);
    c.drawImage(PL,-10,180)
    c.translate(200, 150);
    c.rotate(180 * Math.PI / 180);
    c.translate(-200, -150);
  //=================================
  
  let you = await Picto.getCanvas(POLLUX.user.displayAvatarURL)
  if(enemyStando==true)you = await Picto.getCanvas(_ASSETS+"dio.png");
  
  c.drawImage(you,8,94,60,60);
  
  
      let propic;
    try{
        propic = (msg.author.user||msg.author).displayAvatarURL
    }catch(e){
      propic=msg.author.displayAvatarURL;
    }
    
    let me = await Picto.getCanvas(propic);
    c.drawImage(me,332,124,60,60);
    
    let wid
    let name_p= await Picto.tag(c,_PLAYER, "400 14px 'Corporate Logo Rounded'","#fff")
    name_p.width > 100 ? wid = 100 : wid = name_p.width;
    c.drawImage(name_p.item,324-wid,132,wid,name_p.height)
  
    let name_d= await Picto.tag(c,_DEALER, "400 14px 'Corporate Logo Rounded'","#fff")
    name_d.width > 100 ? wid = 100 : wid = name_d.width;
    c.drawImage(name_d.item,16+60,102,wid,name_d.height) 
    
    let bet_img= await Picto.tag(c,gear.miliarize(bet), "900 20px 'Whitney HTF'","#e6d084")
    c.drawImage(bet_img.item,110-bet_img.width/2,170)
    let bet_txt= await Picto.tag(c,v.bet.toUpperCase(), "600 18px 'Whitney HTF'","#4a8b45")
    c.drawImage(bet_txt.item,110-bet_txt.width/2,150)
    
    
    
  
    let num_p= await Picto.tag(c,SCORE_A, "900 18px 'Whitney HTF',Sans","#fff")
    c.drawImage(num_p.item,324-num_p.width,129+20)
  
    let num_d= await Picto.tag(c,SCORE_B, "900 18px 'Whitney HTF',Sans","#fff")
    c.drawImage(num_d.item,16+60,99+20)
    
    if(SCORE_A.toString().includes("JOKER")){
      let bjk = await Picto.getCanvas(paths.Build+"games/blackjack/JOKER-win.png")
      c.drawImage(bjk,0,0)
      let mey = await Picto.getCanvas(paths.Build+"cards/casino/JOKERS/"+(SCORE_A.split('-')[1]||'default')+".png");
      c.rotate(-25)
      c.drawImage(mey,270,00,150,178)
      c.rotate(25)
    }
    if(SCORE_A.toString().toLowerCase()=="blackjack"){
        let bjk = await Picto.getCanvas(_ASSETS+"BLACKJACK-win.png")
    c.drawImage(bjk,0,0)
    c.drawImage(me,328,110,60,60)
  }    
  if(SCORE_B.toString().toLowerCase()=="blackjack"){
      let bjk = await Picto.getCanvas(_ASSETS+"BLACKJACK-lost.png")
    c.drawImage(bjk,0,0)
    c.drawImage(you,8,110,60,60)
  }
  
  let BUSTED = await Picto.tag(c,v.BUST.toUpperCase(),"900 20px Arial Black","#ea2e2e")
  
      c.rotate(-.5)
      
  if(Number(SCORE_B)>21){
      c.drawImage(BUSTED.item,40,160)
    }
    if(Number(SCORE_A)>21){
        
        c.drawImage(BUSTED.item,130,250)
  }
  
  
  c.rotate(.5)
  
  if(enemyStando==true){
      let stdo = await Picto.getCanvas(paths.BUILD+"STANDO.png")
      c.drawImage(stdo,0,0)
  }
  
  return SCENE
}

var stuff

const v = {}

module.exports = {
    pub: true,
    cmd: cmd,
    perms: 3,
    cat: 'gambling',
  cool:5000,
  aliases:['bj'],
  
  init: async function run(msg) {
    
    const USERDATA = await DB.users.get(msg.author.id);
    
    
    if(msg.args[0] === "decks" ) return deckManager.init(msg,"casino");    


    if(msg.args[0] === "deck" ){

      if(msg.args[1]=== "list")return deckManager.init(msg,"casino");

      if(["default","vegas","reset"].includes(msg.args[1])){
        await DB.users.set(msg.author.id,{'modules.skins.blackjack': 'default' });
        return msg.channel.send(`Now using the default deck: **Vegas**.`)
      }
      
      const DECKDATA = await DB.cosmetics.find({type:"skin",for: "casino" });
      if(!USERDATA.modules.skinInventory){
        return msg.channel.send("You don't own any skins yet.");
      }

 
      targetDeck = DECKDATA.find(
          dck=> 
            dck.localizer == msg.args[1] ||
            dck.id == USERDATA.modules.skinInventory[msg.args[1]] || 
            dck.name.toLowerCase().includes(msg.args.slice(1).join(' ').toLowerCase()) 
        ) || null;

      if(targetDeck && USERDATA.modules.skinInventory.includes(targetDeck.id)){
        await DB.users.set(msg.author.id,{'modules.skins.blackjack': targetDeck.localizer });
        return msg.channel.send(`Now using the deck **${targetDeck.name}**.`)
      }else{
        return msg.channel.send("You don't own this deck yet.")
      }
    }
    
    
    const powerups = USERDATA.modules.powerups || {};
    const myDeck = (USERDATA.modules.skins||{}).blackjack || "default";
    
      let arg=msg.content.split(/ +/)[1]
      
      const _DEALER=msg.guild.member(POLLUX.user).nick||"Pollux"
    const _PLAYER=msg.member.nick||msg.author.username;
    
    var stop = Date.now();
    var diff = (stop - start);

    for (i = 0; i < handarray.length; i++) {
        
      // ctx.drawImage(handarray[i], 98*i, 0);
    }
    
    const P = {
        lngs: msg.lang
    }

    
      v.ONGOING = $t("games.blackjack.ongoing", P)
      v.NEWGAME = $t("games.blackjack.newgame", P)
      v.RESULT  = $t("games.blackjack.result", P)
      v.BUST  = $t("games.blackjack.bust", P)
      
      v.HAND  = $t("games.blackjack.hand", P)
      v.DIO  = $t("eastereggs.konodioda", P)
      
      
      v.HIT = $t("games.blackjack.hit", P)
      v.STAND = $t("games.blackjack.stand", P)
      v.SPLIT = $t("games.blackjack.split", P)
      v.DOUBLE_DOWN = $t("games.blackjack.doubledown", P).replace('double down','double')
      

      
      v.HIT_TXT = $t("games.blackjack.hit", P)
      v.DOUBLE_TXT  = $t("games.blackjack.double", P).replace('double down','double')
      v.SPLIT_TXT = $t("games.blackjack.split", P)
      v.PASS_TXT  = $t("games.blackjack.pass", P)
      
      v._WIN  = $t("games.blackjack.youwin", P)
      v._LOSE = $t("games.blackjack.youlose", P)
      v._JOKER  = $t("games.blackjack.joker", "Oh no! The Joker! You're so lucky~",P)
      v._EVEN = $t("games.blackjack.even", P)
      v._PRIZE  = $t("$.plus_rubines_generic", P)
      v._ANTIPRIZE  = $t("$.minus_rubines_generic", P)
      
      v.bet = $t("dict.bet", P)
      
    
      

      v.insu = $t("$.insuBet",{lngs:msg.lang,number:10})
      v.nofunds = $t("$.noFundsBet",{lngs:msg.lang,number:USERDATA.modules.rubines})
      v.insuFloor = $t("$.insuFloor",{lngs:msg.lang,number:10})
      v.ceiling = $t("games.ceilingBet",{lngs:msg.lang,number:2500}).replace("%emj%", _emoji("rubine"))
      
      
      //HELP TRIGGER
      
      if(gear.autoHelper([$t("helpkey",P),'noargs',''],{cmd,msg,opt:this.cat}))return;
      if(arg.length<2||arg[1].includes("<"))return gear.autoHelper('force',{cmd,msg,opt:this.cat});
//------------


/*

if (await gear.manageLimits('blackjack',55,USERDATA,msg)) {
    
    let BLlimit = "You've reached the daily limit for Blackjack. Would you like to refresh your limit paying 10K Rubines?"
    let  mm2 = await msg.channel.send(BLlimit);
    mm2.react(":yep:339398829050953728");
        await gear.wait(0.6);
        mm2.react(":nope:339398829088571402");
        
        const final_res = await mm2.awaitReactions(rea => rea.users.has(msg.author.id), {
            time: 15000,
            max: 1
        });
        gear.cleanup([mm2])
        if (final_res.size === 1 && final_res.first().emoji.id == "339398829050953728") {
            
            if(USERDATA.modules.rubines < 10000){
                return msg.reply("Insufficient funds.");
            }
            
            DB.users.set(msg.author.id,{
                $set:{'limits.blackjack':1},
                $inc:{'modules.rubines':-10000}
            });
        }else{
            return msg.channel.send("<:nope:339398829088571402> TIMEOUT");
        }
 
        
  };
  */
    
  //showstoppers
  
    if (Blackjack.gameExists(msg.author.id)) {
      //  return msg.reply(v.ONGOING);
    }
    
    let hasmin = ECO.checkFunds(msg.author,10)
    if (!hasmin){
      P.number = USERDATA.modules.rubines;
      return msg.reply(v.insuFloor);
    }
    if(Number(parseInt(arg))<10 ||isNaN(Number(parseInt(arg)))){
      
        P.number = 10
        return msg.reply(v.insu);
    }
    var bet = parseInt(arg)
    let canbet = ECO.checkFunds(msg.author,bet)
    if(!canbet){
        return msg.reply(v.nofunds);
    }
    if(bet>2500){
        P.number = 2500
        return msg.reply(v.ceiling);
    }
    
    

    stuff = {
        v:v ,
        b:bet ,
     p:_PLAYER ,
     d:_DEALER ,
     m:msg 
     
   }
   
   var start = Date.now();
   //96 147


   
   
   const blackjack = new Blackjack(msg);
   
    return msg.channel.send(
        v.NEWGAME.replace("%usr%", msg.member.displayName).replace("%bt%", bet)
        ).then(async() => {
            
            options={}
            const balance = USERDATA.modules.rubines;
            const playerHand = blackjack.getHand(options);
            let dealerHand = blackjack.getHand();
      let playerHands;
      //playerHand.pop()
      //playerHand.push('JOKER-default')

      let playerHandValueCalc = Blackjack.handValue(playerHand);
      if (playerHandValueCalc !== 'Blackjack' && !playerHandValueCalc.toString().includes("JOKER") ) {
          playerHands = await this.getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack,myDeck,powerups);
          const result = this.gameResult(Blackjack.handValue(playerHands[0]), 0);
          const noHit = playerHands.length === 1 && result === 'bust';

          while ((Blackjack.isSoft(dealerHand) ||
            Blackjack.handValue(dealerHand) < 17) &&
            !noHit) { // eslint-disable-line no-unmodified-loop-condition
                blackjack.hit(dealerHand);
        }
    } else {
        playerHands = [playerHand];
      }

      blackjack.endGame();
      
      const dealerValue = Blackjack.handValue(dealerHand);
      let winnings = 0;
      let hideHoleCard = true;

      
      let playerstats;
      let multiHAND_DATA = []
      let berkelium = 0
      let resultade;
      playerHands.forEach(async(hand, i) => {
          
        let H_DATA = {}

        
        const playerValue = Blackjack.handValue(hand);
        const result = this.gameResult(playerValue, dealerValue);
        
        if (result !== 'bust') hideHoleCard = false;
        
        const lossOrGain = Math.floor((['loss', 'bust'].includes(result) ? -1 : result === 'push' ? 0 : 1) * (hand.doubled ? 2 : 1) * (playerValue === 'Blackjack' ? 1.5 : playerValue.toString().includes('JOKER') ? 2 : 1) * bet); 
        if(result=="push")resultade="push";
        winnings += lossOrGain;
        const soft = Blackjack.isSoft(hand);

        H_DATA.num = i + 1
        H_DATA.val = playerValue
        H_DATA.status = soft ? "SOFT" : "";
        H_DATA.result = playerHands.length === 1 ? `** ${msg.member.displayName}**` : ` ${result.replace(/(^\w|\s\w)/g, ma => ma.toUpperCase())}${result !== 'push' ? `, ${lossOrGain}` : `, ${"Rubines"}"} back`}
        `
        multiHAND_DATA.push(H_DATA)
        berkelium += Number(lossOrGain)
      });
      
      let POL_DATA = {}

      POL_DATA.val = `${hideHoleCard ? Blackjack.handValue([dealerHand[0]]) : dealerValue}`

      
      let PLAY_RES = winnings === 0 ? v._EVEN : winnings > 0 ? v._WIN : v._LOSE

      if (  Blackjack.handValue(playerHands[0]).toString().includes('JOKER') ) PLAY_RES = v._JOKER;

      resultade === 'push' ? PLAY_RES= v._EVEN : PLAY_RES=PLAY_RES
      //console.log(playerHand)
      let POLLUX_HAND_GFX = await compileHand(playerHands,undefined,myDeck)
      let visihand= [dealerHand[0],["X"]]
      //console.log(visihand)
     
      let PLAYER_HAND_GFX = await compileHand([hideHoleCard?visihand:dealerHand],undefined,'default')
      
      // await parseHand(playerHands[0])   
      // await parseHand_p(dealerHand)
      
   
      if (berkelium !== 0) {
       // console.log('BJres',berkelium)
       
       if (berkelium > 0) {
           await ECO.receive(msg.author.id,berkelium,"gambling_blackjack","RBN");
        }
      if (berkelium < 0) {
          await ECO.pay(msg.author.id,Math.abs(berkelium),"gambling_blackjack","RBN");
      }
      
    }


    
    let scenario = await drawTable(PLAYER_HAND_GFX,POLLUX_HAND_GFX,multiHAND_DATA[0],POL_DATA,stuff)
    let resp = berkelium > 0 ? v._PRIZE : berkelium < 0 ? v._ANTIPRIZE : ""
    let rebalance = resp.replace("%R%",_emoji("rubine")+Math.abs(berkelium))
          
    msg.channel.send(PLAY_RES,{file:scenario.toBuffer(),name:"blackjack.png"}).then(m=>m.channel.send(rebalance).catch(e=>{}))

    
    /* msg.reply(`
    POL DATA
${"```js"}
${u.inspect(POL_DATA)}
${"```"}
multiHAND_DATA
${"```js"}
${u.inspect(multiHAND_DATA)}
${"```"}
playerHands
${"```js"}
${u.inspect(playerHands)}
${"```"}
polluxHands
${"```js"}
${u.inspect([dealerHand])}
${"```"}
play-RES
${"```js"}
${u.inspect(PLAY_RES)}
${"```"}
`)*/
     // return sendhand(msg, statpol, description)
    });
    

},

gameResult: function gameResult(playerValue, dealerValue) {
    
    
    
    if (playerValue > 21) return 'bust';
    if (dealerValue > 21) return 'Dealer bust';
    if (playerValue === dealerValue) return 'push';
    if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';
    if (playerValue.toString().includes("JOKER") || playerValue > dealerValue) return 'win';

    return 'loss';
  },
  
  getFinalHand: function getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack,deck,powerups) {
    return new Promise(async resolve => {
        const hands = [playerHand];
        let currentHand = hands[0];
        let totalBet = bet;

        const nextHand = () => currentHand = hands[hands.indexOf(currentHand) + 1]; // eslint-disable-line no-return-assign, max-len
        while (currentHand) { // eslint-disable-line no-unmodified-loop-condition
            if (currentHand.length === 1) blackjack.hit(currentHand,powerups);
        if (Blackjack.handValue(currentHand) === 'Blackjack') {
          nextHand();
          continue;
        }
        if (Blackjack.handValue(currentHand) >= 21) {
            nextHand();
            continue;
        }
        if (currentHand.doubled) {
          blackjack.hit(currentHand);
          nextHand();
          continue;
        }

        const canDoubleDown = balance >= totalBet + bet && currentHand.length === 2;
        const canSplit = balance >= totalBet + bet &&
        Blackjack.handValue([currentHand[0]]) === Blackjack.handValue([currentHand[1]]) &&
          currentHand.length === 2;
          
          
        
          
        // POLLUX_HAND_GFX = await compileHand(currentHand)
        // PLAYER_HAND_GFX = await compileHand([dealerHand])

        

        //await parseHand(hands[0])
        //await parseHand_p(dealerHand, true)
        
        let hitstand = !canDoubleDown && !canSplit ?
        v.HIT_TXT + v.PASS_TXT :
          `${v.HIT_TXT} ${canDoubleDown
							? v.DOUBLE_TXT
							: ''}${canSplit
							? v.SPLIT_TXT : ''}${v.PASS_TXT}`
                            

                            
        let H_DATA ={}
        let POL_DATA ={}
        
        H_DATA.val = Blackjack.handValue(currentHand)
        H_DATA.status = Blackjack.isSoft(currentHand) ? "SOFT" : "";
        
        POL_DATA.status  = Blackjack.isSoft([dealerHand[0]]) ? "SOFT" : "";
        POL_DATA.val = Blackjack.handValue([dealerHand[0]])
        
        // scenario = await drawTable(PLAYER,DEALER,multiHAND_DATA,POL_DATA)

        //sendhand(msg, hitstand, player + croupier)
        
        
        
        
        let visihand= [dealerHand[0],["X"]]
        let bjkP = H_DATA.val.toString().toLowerCase()=="blackjack" 
        let bjkD = POL_DATA.val.toString().toLowerCase()=="blackjack" 
 
        let POLLUX_HAND_GFX = await compileHand([currentHand],bjkD,deck)
        let PLAYER_HAND_GFX = await compileHand([visihand],bjkP,'default')
      
        
        
        let scenario = await drawTable(PLAYER_HAND_GFX,POLLUX_HAND_GFX,H_DATA,POL_DATA,stuff)
        
      msg.channel.send('',{file:scenario.toBuffer(),name:"blackjack.png"}).then(m=>m.channel.send(hitstand))
      
      /*

      msg.reply(`
POL DATA
${"```js"}
${u.inspect(POL_DATA)}
${"```"}
H_DATA
${"```js"}
${u.inspect(H_DATA)}
${"```"}
playerHands
${"```js"}
${u.inspect(currentHand)}
${"```"}
polluxHands
${"```js"}
${u.inspect([dealerHand])}
${"```"}

`)

*/

const responses = await msg.channel.awaitMessages(msg2 => // eslint-disable-line no-await-in-loop
          msg2.author.id === msg.author.id && (
              msg2.content === 'hit' ||
              msg2.content === 'stand' ||
              msg2.content === 'STANDO' ||
              msg2.content === 'stando' ||
            (msg2.content === 'split' && canSplit) ||
            (msg2.content === 'double down' && canDoubleDown)||
            (msg2.content === 'double' && canDoubleDown)
            ), {
            maxMatches: 1,
            time: 30e3
        });
        
        if (responses.length === 0) break;
        const action = responses[0].content.toLowerCase();
        if (action == "stando"){
            enemyStando = true;
            msg.channel.send(v.DIO)
        }
        if (action === 'stando' ||action === 'stand' || Blackjack.handValue(currentHand) >= 21) {
          if (currentHand === hands[hands.length - 1]) break;
          nextHand();
        }
        if (action === 'hit') blackjack.hit(currentHand);
        if (action === 'split' && canSplit) {
          totalBet += bet;
          hands.push([currentHand.pop()]);
          blackjack.hit(currentHand);
        }
        if ((action === 'double down'||action === 'double') && canDoubleDown) {
          totalBet += bet;
          currentHand.doubled = true;
        }
      }
      
      return resolve(hands);
    });
  }


};