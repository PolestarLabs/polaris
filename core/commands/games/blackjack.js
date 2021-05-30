const BUTTONS = {
  hit: {type:2, custom_id: 'hit', label: "Hit", style: 1, emoji: {id: "598784000353370113"}},
  stand: {type:2, custom_id: 'stand', label: "Stand", style: 1, emoji: {id: "598784000353370113"}},
  double: {type:2, custom_id: 'double', label: "Double", style: 2, emoji: {id: "598795449117310988"}},
  split: {type:2, custom_id: 'split', label: "Split", style: 2, emoji: {id: "598784000353370113"}},
  surrender: {type:2, custom_id: 'surrender', label: "Surrender", style: 4, emoji: {name: "🏳"}},
  insurance: {type:2, custom_id: 'insurance', label: "Insurance", style: 4, emoji: {id: "800122920268726282"}},
}




// TRANSLATE[epic=translations] blackjack
const Picto = require("../../utilities/Picto");
const deckManager = require("../inventory/decks.js");
const Blackjack = require("../../archetypes/Blackjack.js");

const _ASSETS = `${paths.BUILD}games/blackjack/`;
const ECO = require("../../archetypes/Economy.js");

const constantAssets = Promise.all([
Picto.getCanvas(`${paths.Build}/games/blackjack/feltro.png`),
Picto.getCanvas(`${paths.Build}/games/blackjack/ins_avail.png`),
Picto.getCanvas(`${paths.Build}/games/blackjack/ins_using.png`),
Picto.getCanvas(`${_ASSETS}dio.png`),
Picto.getCanvas(`${_ASSETS}BLACKJACK-win.png`),
Picto.getCanvas(`${_ASSETS}BLACKJACK-lost.png`),
Picto.getCanvas(`${paths.Build}games/blackjack/JOKER-win.png`),
Picto.getCanvas(`${paths.BUILD}STANDO.png`),
Picto.getCanvas(`${_ASSETS}alphamask.png`),
]);

/**
* @type {import('canvas').PngConfig}
*/
const imageOptions = { compressionLevel: 1, filters: 8 };

const cardValue = (card) => ({ rank: card.slice(0, -1), suit: card[card.length - 1] });
const fetchCard = (card, deck) => {
if (typeof card === "string" && card.startsWith("JOKER")) {
  return Picto.getCanvas(`${paths.CDN}/build/cards/casino/JOKERS/${card.split("-")[1] || deck || "default"}.png`);
}
if (card[0] === "X") return Picto.getCanvas(`${paths.CDN}/build/cards/casino/${deck || "default"}/backface.png`);

const { rank, suit } = cardValue(card);
return Picto.getCanvas(`${paths.CDN}/build/cards/casino/${deck || "default"}/${suit}${rank}.png`);
};

const renderCard = (ctx, _cImg, _i, disp = 0, glow = false) => {
ctx.rotate(-0.15);
const equation = (100 - (disp > 80 ? 80 : disp));
ctx.drawImage(_cImg, equation * _i, 40 + (_i * 1.5 * (equation / 10)), 143 * 2, 160 * 2);
// ctx.drawImage(_cImg,(54*2 - disp) * i,20*2 + (i * 1.5 * ((54*2 - disp) / 10)),143*2,160*2);
ctx.shadowColor = glow ? "#eeff27" : "#3b3b4b";
ctx.shadowBlur = 10;
ctx.rotate(0.15);
};

const renderHand = async (HANDS, deck, bjd, current) => {
const IMG = Picto.new(800, 400);
const ctx = IMG.getContext("2d");
if (HANDS.length === 1) {
  const handImages = await Promise.all(HANDS[0].map((card) => fetchCard(card, deck)));
  handImages.forEach((cardImg, i) => renderCard(ctx, cardImg, i, bjd));
} else {
  let displacement = 0;
  HANDS.forEach(async (hand, i) => {
    const handImages = await Promise.all(hand.map((card) => fetchCard(card, deck)));
    handImages.forEach((cardImg) => {
      if (current && current !== hand) ctx.translate(0, 100);
      renderCard(ctx, cardImg, displacement, (HANDS.length + 1) * 8 + i * 3, bjd);
      if (current && current !== hand) ctx.translate(0, -100);
      displacement++;
    });
    displacement += 1.5;
  });
  /*
  if(current){
    Promise.all( current.map( card => fetchCard(card,deck) ) ).then(res=>{
      ctx.globalCompositeOperation = "source-over"
      res.forEach((cardImg,i) => renderCard(ctx,cardImg,i) )
    });
  }
  */
  if (HANDS.indexOf(current) >= 0) {
    // ctx.drawImage(Picto.tag(ctx,"Hand #"+HANDS.indexOf(current)+1,'14px "Corporate Logo Rounded"','#FFFFFF',{line:6}).item,30,0)
  }
}
return IMG;
};

const drawTable  = async (PL, DL, DATA_A, DATA_B, drawOpts) => {
const msg   = drawOpts.m;
const bet     = drawOpts.b;
const basebet = drawOpts.bbt;
const _PLAYER = drawOpts.p;
const _DEALER = drawOpts.d;
const _v       = drawOpts.v;
const insurance = drawOpts.ins;
const { canInsurance } = drawOpts;

const SCENE = Picto.new(800, 600);
const c = SCENE.getContext("2d");

const SCORE_A = DATA_A.status + DATA_A.val;
const SCORE_B = DATA_B.val;
const bjkWIN  = SCORE_A.toString().toLowerCase() === "blackjack";
const bjkLOSE = SCORE_B.toString().toLowerCase() === "blackjack";
const jkrWIN = SCORE_A.toString().includes("JOKER");
const jrkLOSE = SCORE_B.toString().includes("JOKER");

const RESULT = "Blackjack";
const OUTCOME = "WIN";

let chips;

switch (true) {
  case bet <= 100:
    chips = 1;
    break;
  case bet <= 500:
    chips = 2;
    break;
  case bet <= 1000:
    chips = 3;
    break;
  case bet <= 1500:
    chips = 4;
    break;
  case bet <= 2000:
    chips = 5;
    break;
  default:
    chips = 6;
    break;
}

const [fel, insurGlow, insurEnabled, dio, bWin, bLose, bJoker, stando, alphamask] = await constantAssets;
const [chip, chipI, you, me, bjk, joker] = await Promise.all([
  Picto.getCanvas(`${_ASSETS}chips-${chips}.png`),
  insurance ? Picto.getCanvas(`${_ASSETS}chips-${Math.ceil(chips / 2)}.png`) : null,
  drawOpts.enemyStando ? dio : Picto.getCanvas(PLX.user.displayAvatarURL),
  Picto.getCanvas(msg.author.displayAvatarURL),
  bjkWIN ? bWin
    : bjkLOSE
      ? bLose
      : jkrWIN
        ? bJoker : null,
  jkrWIN ? Picto.getCanvas(`${paths.Build}cards/casino/JOKERS/${SCORE_A.split("-")[1] || "default"}.png`) : null,
]);

const betImg = Picto.tag(c, miliarize(bet), "900 italic 40px 'Panton Black'", "#e6d084");
const betTxt = Picto.tag(c, _v.bet.toUpperCase(), "600 30px 'Panton'", "#4a8b45");
const insTxt = Picto.tag(c, "INSURANCE", "600 24px 'Panton'", "#448674");
const insImg = Picto.tag(c, miliarize(insurance * Math.ceil(basebet / 2)), "600 italic 36px 'Panton Black'", "#2ab099");

c.drawImage(fel, 0, 0, 800, 600);
c.drawImage(chip, 560 - (chip.width / 2), 377 - (chip.height / 2));
if (canInsurance) c.drawImage(insurGlow, 0, 0);
if (insurance) {
  Picto.roundRect(c, 630, 395, 160, 170, 15, "#20203BAF");
  c.drawImage(insurEnabled, 0, 0);
  c.drawImage(chipI, 400 - (chipI.width / 2), 436 - (chipI.height / 2));
  c.drawImage(insTxt.item, 630 + 80 - insTxt.width / 2, 400 + 95);
  c.drawImage(insImg.item, 630 + 80 - insImg.width / 2, 440 + 80);
} else {
  Picto.roundRect(c, 630, 395, 160, 100, 15, "#20203BAF");
}
c.drawImage(betImg.item, 630 + 80 - betImg.width / 2, 440);
c.drawImage(betTxt.item, 630 + 80 - betTxt.width / 2, 408);

//= ================================
c.drawImage(DL, -10 * 2, 180 * 2);
c.translate(200 * 2, 150 * 2);
c.rotate(180 * (Math.PI / 180));
c.translate(-200 * 2, -150 * 2);
c.drawImage(PL, -10 * 2, 180 * 2);
c.translate(200 * 2, 150 * 2);
c.rotate(180 * (Math.PI / 180));
c.translate(-200 * 2, -150 * 2);
//= ================================

c.drawImage(you, 8 * 2, 94 * 2, 60 * 2, 60 * 2);
c.drawImage(me, 332 * 2, 124 * 2, 60 * 2, 60 * 2);

let wid;
const nameP = Picto.tag(c, _PLAYER, "400 28px 'Corporate Logo Rounded'", "#fffA");
nameP.width > 100 * 2 ? wid = 100 * 2 : wid = nameP.width;
c.drawImage(nameP.item, 324 * 2 - wid, 132 * 2, wid, nameP.height);

const nameD = Picto.tag(c, _DEALER, "400 28px 'Corporate Logo Rounded'", "#fffA");
nameD.width > 100 * 2 ? wid = 100 * 2 : wid = nameD.width;
c.drawImage(nameD.item, 16 * 2 + 60 * 2, 102 * 2, wid, nameD.height);

const numP = Picto.tag(c, SCORE_A, "900 italic 36px 'Panton Black',Sans", "#fff");
c.drawImage(numP.item, 648 - numP.width, 305);

const numD = Picto.tag(c, SCORE_B, "900 italic 36px 'Panton Black',Sans", "#fff");
c.drawImage(numD.item, 150, 244);

const BUSTED = Picto.tag(c, `${_v.BUST.toUpperCase()}!`, "900 italic 40px 'Panton Black'", "#ea2e2e", { style: "#2b2b3b", line: 10 });

c.rotate(-0.5);
if (Number(SCORE_B) > 21) c.drawImage(BUSTED.item, 40 * 2, 160 * 2);
if (Number(SCORE_A) > 21) c.drawImage(BUSTED.item, 130 * 2, 250 * 2);
c.rotate(0.5);

if (jkrWIN) {
  c.drawImage(bjk, 0, 0, 800, 600);
  c.rotate(-25);
  c.drawImage(joker, 270 * 2, 0, 150 * 2, 178 * 2);
  c.rotate(25);
}
if (bjkWIN) {
  c.drawImage(bjk, 0, 0, 800, 600);
  c.drawImage(me, 328 * 2, 110 * 2, 60 * 2, 60 * 2);
}
if (bjkLOSE) {
  c.drawImage(bjk, 0, 0, 800, 600);
  c.drawImage(you, 8 * 2, 110 * 2, 60 * 2, 60 * 2);
}

c.globalCompositeOperation = "destination-out";
c.drawImage(alphamask, 0, 0);
c.globalCompositeOperation = "source-over";

if (drawOpts?.actions && !(jkrWIN || bjkLOSE || bjkWIN || Number(SCORE_B) > 21 || Number(SCORE_A) > 21)) {
  drawOpts.actions.forEach((action, i) => {
    const actionColor = action === "SURRENDER"
      ? "#F35"
      : action === "DOUBLE"
        ? "#F85"
        : action === "SPLIT"
          ? "#85F"
          : action === "INSURANCE"
            ? "#FA5"
            : "#AAB";

    const button = Picto.tag(c, action, "900 italic 16pt 'Panton Black'", actionColor).item;
    const xpos = (i % 3) * 155;
    const ypos = ~~(i / 3) * 40;
    c.shadowColor = "#3b3b4b";
    c.shadowBlur = 10;
    Picto.roundRect(c, xpos + 25, ypos + 23, 150, 35, 5, "#2b2b3b");
    c.shadowColor = "none";
    c.drawImage(button, 100 + xpos - button.width / 2, 30 + ypos);
  });
}

drawOpts.enemyStando ? c.drawImage(stando, 0, 0, 800, 600) : (() => null)();

return SCENE;
};

const DECK      = async (msg, args) => {
const USERDATA = await DB.users.get(msg.author.id);
const P = { lngs: msg.lang };
if (args[0] === "list") return deckManager.init(msg, args, "casino");

if (["default", "vegas", "reset"].includes(msg.args[1])) {
  await DB.users.set(msg.author.id, { "modules.skins.blackjack": "default" });
  P.deckname = `${_emoji("plxcards").no_space}\`Vegas (default)\``;
  return msg.channel.send(`${rand$t("responses.verbose.interjections.acknowledged")} `
    + `${$t("games:blackjack.switchdeck", P)} ${rand$t("responses.verbose.opinion_decks", P)}`);
}

const DECKDATA = await DB.cosmetics.find({ type: "skin", for: "casino" });
if (!USERDATA.modules.skinInventory) {
  return msg.channel.send("You don't own any skins yet.");
}

const targetDeck = DECKDATA.find(
  (dck) => dck.localizer === args[0]
    || dck.id === USERDATA.modules.skinInventory[args[0]]
    || dck.name.toLowerCase().includes(args.join(" ").toLowerCase()),
) || null;

if (targetDeck && USERDATA.modules.skinInventory.includes(targetDeck.id)) {
  await DB.users.set(msg.author.id, { "modules.skins.blackjack": targetDeck.localizer });
  P.deckname = `${_emoji("plxcards").no_space}\`${targetDeck.name}\``;
  let deckSwitchMessage = `${rand$t("responses.verbose.interjections.acknowledged")} ${$t("games:blackjack.switchdeck", P)}`
    + `${rand$t("responses.verbose.opinion_decks", P)}`;
  if (randomize(1, 6) === 3 && $t("games:blackjack.switchdeckEgg", P).length > 1) {
    deckSwitchMessage = `${rand$t("responses.verbose.interjections.acknowledged")} ${$t("games:blackjack.switchdeckEgg", P)} ${_emoji("plxOof")}`;
  }
  return msg.channel.send(deckSwitchMessage);
}
return msg.channel.send("You don't own this deck yet.");
};

function testInsurance(balance, bet, currentHand, dealerHand) {
return balance >= bet + Math.ceil(bet / 2)
        && dealerHand[0].includes("A")
        && currentHand.length === 2
        && !currentHand.insurance;
}

function testDoubleDown(balance, bet, currentHand) {
return balance >= bet * 2
        && currentHand.length === 2;
}

function testSplit(balance, bet, currentHand) {
return balance >= bet * 2
        && Blackjack.handValue([currentHand[0]]) === Blackjack.handValue([currentHand[1]])
        && currentHand.length === 2;
}

function hitStandMessage(P, canDoubleDown, canSplit, canInsurance) {
const HIT_TXT     = $t("games:blackjack.hit", P);
const DOUBLE_TXT = $t("games:blackjack.double", P);
const SPLIT_TXT  = $t("games:blackjack.split", P);
const PASS_TXT    = $t("games:blackjack.pass", P);

const hitstand = `${!canDoubleDown && !canSplit
  ? HIT_TXT + PASS_TXT
  : `${HIT_TXT} ${canDoubleDown
    ? DOUBLE_TXT
    : ""}${canSplit
    ? SPLIT_TXT : ""}${PASS_TXT}`}
${$t("games:blackjack.surrender_helper", P)}
${canInsurance ? $t("games:blackjack.insurance_helper", P) : ""}
`;
return hitstand;
}

async function getFinalHand(blackjack, playerHand, dealerHand, deck, powerups, options) {
const msg   = options.m;
let introMessage = options.intro;
const balance = options.B;
const bet   = options.b;
const P = { lngs: msg.lang };
const log = options.log.usr;

const hands = [playerHand];
const firstHand = hands[0];
let currentHandIndex = 0;
let totalBet = bet;
/**
 * @type {import('eris').Message}
 */
let tableMessageRound;

async function ProcessHand(currentHand) {
  if (log.length === 0) {
    options.log.embed.description = "Game Started!";
  }
  if (!currentHand) return Promise.resolve(true);
  const nextHand = () => (currentHand = hands[++currentHandIndex]);

  if (currentHand.length === 1) {
    blackjack.hit(currentHand, powerups);
  }
  if (Blackjack.handValue(currentHand) === "Blackjack") {
    nextHand();
    return ProcessHand(currentHand);
    // continue;
  }
  const currentHandValue = Blackjack.handValue(currentHand);

  if (typeof currentHandValue === "string" && currentHandValue.startsWith("JOKER")) {
    nextHand();
    return ProcessHand(currentHand);
    // continue;
  }
  if (currentHandValue >= 21) {
    nextHand();
    return ProcessHand(currentHand);
    // continue;
  }
  if (currentHand.doubled) {
    blackjack.hit(currentHand);
    nextHand();
    return ProcessHand(currentHand);
    // continue;
  }

  const canInsurance = testInsurance(balance, totalBet, currentHand, dealerHand);
  const canDoubleDown = testDoubleDown(balance, totalBet, currentHand);
  const canSplit = testSplit(balance, totalBet, currentHand);

  const hitstand = hitStandMessage(P, canDoubleDown, canSplit, canInsurance);

  const USR_HAND = {}; const
    POL_HAND = {};

  USR_HAND.val = Blackjack.handValue(currentHand);
  POL_HAND.val = Blackjack.handValue([dealerHand[0]]);

  USR_HAND.status = Blackjack.isSoft(currentHand) ? "SOFT" : "";
  POL_HAND.status = Blackjack.isSoft([dealerHand[0]]) ? "SOFT" : "";

  const visibleHand = [dealerHand[0], ["X"]];
  const bjkP = USR_HAND.val.toString().toLowerCase() === "blackjack";
  const bjkD = POL_HAND.val.toString().toLowerCase() === "blackjack";
  let errored;
  const [POLLUX_HAND_GFX, PLAYER_HAND_GFX] = await Promise.all([
    renderHand(hands, deck, bjkD, currentHand),
    renderHand([visibleHand], deck, bjkP),
  ]).timeout(2000).catch((e) => { errored = true; return [e, 0]; });
  if (errored) Promise.reject(new Error(`Error during checks => \n${POLLUX_HAND_GFX}`));

  options.b = totalBet;
  options.canInsurance = canInsurance;
  options.ins = currentHand.insurance;
  options.actions = ["HIT", "STAND"];
  if (canDoubleDown) options.actions.push("DOUBLE");
  if (canSplit) options.actions.push("SPLIT");
  if (canInsurance) options.actions.push("INSURANCE");
  options.actions.push("SURRENDER");

  const scenario = await drawTable(PLAYER_HAND_GFX, POLLUX_HAND_GFX, USR_HAND, POL_HAND, options).catch(() => Picto.new(1, 1));
  let scene_msg;

  if (currentHand.insuredLastTurn) {
    await msg.channel.send(`${_emoji("plxbjkinsu")} **Insurance has been placed for this match!**`, {
      file: scenario.toBuffer("image/png", imageOptions), name: "blackjack.png",
    }).then((mm) => {
    // msg.channel.send(`Insurance has been placed for this match!`).then(mm=>{
      scene_msg = mm;
      if (tableMessageRound) tableMessageRound.delete();
      tableMessageRound = mm;
      // mm.delete()
    });
    firstHand.insuredLastTurn = false;
  } else {
    let finalImage;
    try {
      finalImage = scenario.toBuffer("image/png", imageOptions);
    } catch (err) {
      finalImage = scenario.toBuffer();
    }

    await msg.channel.send("", { file: finalImage, name: "blackjack.png" }).then((mm) => {
      scene_msg = mm;
      if (tableMessageRound) tableMessageRound.delete();
      tableMessageRound = mm;
    });
  }

  const buttonsToAdd = {
      row1:[
          BUTTONS.hit,
          BUTTONS.stand,
          Object.assign({disabled: !canDoubleDown}, BUTTONS.double),
          Object.assign({disabled: !canSplit}, BUTTONS.split)
      ],
      row2:[
          canInsurance ? BUTTONS.insurance : undefined,
          BUTTONS.surrender
      ]
  }

  scene_msg.edit({
      content:"  hitstand_message ", 
      components: [
          {type:1,components: buttonsToAdd.row1.filter(x=>!!x)},
          {type:1,components: buttonsToAdd.row2.filter(x=>!!x)},
      ]
    });

  if (introMessage) {
     
  } else {
    msg.channel.send({
        content:" intro_message ", 
        components: [
           // {type:1,components: buttonsToAdd.row1.filter(x=>!!x)},
           // {type:1,components: buttonsToAdd.row2.filter(x=>!!x)},
        ]
      }).then((mm) => (introMessage = mm));
  }
  
  

  const responses = await Promise.race([
      msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id && (msg2.content = msg2.content.toLowerCase()) && (
          msg2.content === "hit"
          || msg2.content === "stand"
          || msg2.content === "STANDO"
          || msg2.content === "stando"
          || msg2.content === "surrender"
          || (msg2.content === "insurance" && canInsurance)
          || (msg2.content === "split" && canSplit)
          || (msg2.content === "double down" && canDoubleDown)
          || (msg2.content === "double" && canDoubleDown)
          ), {
          maxMatches: 1,
          time: 30e3,
          }),
      //scene_msg.awaitButtonClick((int)=>int.userID === msg.author.id)
      scene_msg.awaitButtonClick((int)=>int.userID === msg.author.id,{
          maxMatches: 1,
          time: 30e3,
      })
  ]);

  // tableMessage.delete()

  if (responses.length === 0) return log.push(`> ${_emoji("TIME2")} Player stand **${USR_HAND.val}**`);
  const action = responses[0]?.content?.toLowerCase() || responses[0]?.id;

  if (responses[0].delete) responses[0].delete().catch(() => null);

  if (action === "insurance") {
    firstHand.insurance = true;
    firstHand.insuredLastTurn = true;
    log.push(`> ${_emoji("plxbjkinsu")} \`INSURANCE\` (${Math.ceil(bet / 2)})`);
  }
  if (action === "surrender") {
    firstHand.surrendered = true;
    totalBet = Math.ceil(totalBet / 2);
    log.push(`> ${_emoji("plxbjksurr")} Player \`SURRENDER\` @ **${USR_HAND.val}**`);
    if (currentHand === hands[hands.length - 1]) return Promise.resolve("EndGame");
    nextHand();
  }

  if (action === "stando") {

    Progression.emit("play.blackjack.stando",{msg,userID:msg.author.id});
    Progression.emit("misc.easteregg",{msg,userID:msg.author.id});

    options.enemyStando = true;
    msg.channel.send($t("eastereggs.konodioda", { lngs: msg.lang }));
  }
  if (action === "stando" || action === "stand" || Blackjack.handValue(currentHand) >= 21) {
    log.push(`> ${_emoji("plxcards")} Player \`STAND\` **${USR_HAND.val}**`);
    if (currentHand === hands[hands.length - 1]) return Promise.resolve("EndGame");
    nextHand();
  }
  if (action === "hit") {
    const newVal = Blackjack.handValue(blackjack.hit(currentHand));
    log.push(`> ${newVal > 21 ? _emoji("plxbjkbust") : _emoji("plxcards")} Player \`HIT\` **${USR_HAND.val}** > **${newVal}**`);
  }
  if (action === "split" && canSplit) {
    // totalBet;

    Progression.emit("play.blackjack.split",{msg,userID:msg.author.id});

    log.push(`> ${_emoji("plxcards")} Player \`SPLIT\` **${USR_HAND.val / 2}s**`);
    const newCurrent = [currentHand.shift()];
    hands.unshift(newCurrent);
    blackjack.hit(newCurrent);
    return ProcessHand(newCurrent);
  }
  if ((action === "double down" || action === "double") && canDoubleDown) {
    log.push(`> ${_emoji("plxbjk2x")} Player \`DOUBLE\``);
    totalBet += bet;
    firstHand.doubled = true;
  }

  return ProcessHand(currentHand);
}

await ProcessHand(hands[currentHandIndex]);

// introMessage.delete().catch(e=>null);
if (tableMessageRound) tableMessageRound.delete().catch(() => null);
return hands;
}

function gameResult(playerValue, dealerValue) {
if (playerValue > 21) return "bust";
if (dealerValue > 21) return "Dealer bust";
if (playerValue === dealerValue) return "push";
if (playerValue === "Blackjack" || playerValue > dealerValue) return "win";
if (playerValue.toString().includes("JOKER") || playerValue > dealerValue) return "win";

return "loss";
}

const init       = async (msg, args) => {
const USERDATA = await DB.users.get(msg.author.id);

if (args[0] === "decks") return deckManager.init(msg, "casino");

const powerups = USERDATA.modules.powerups || {};
const myDeck = USERDATA.modules.skins?.blackjack || "default";

const arg = args[0];

const polluxNick = msg.guild.member(PLX.user).nick || "Pollux";
const playerName = msg.member.nick || msg.author.username;

const P = { lngs: msg.lang };
const v = {};
v.ONGOING = $t("games:blackjack.ongoing", P);
v.NEWGAME = $t("games:blackjack.newgame", P);
v.RESULT = $t("games:blackjack.result", P);
v.BUST = $t("games:blackjack.bust", P);

v.HAND = $t("games:blackjack.hand", P);

v.HIT = $t("games:blackjack.hit", P);
v.STAND = $t("games:blackjack.stand", P);
v.SPLIT = $t("games:blackjack.split", P);
v.DOUBLE_DOWN = $t("games:blackjack.doubledown", P).replace("double down", "double");

v._WIN = $t("games:blackjack.youwin", P);
v._LOSE = $t("games:blackjack.youlose", P);
v._JOKER = $t("games:blackjack.joker", P);
v._EVEN = $t("games:blackjack.even", P);
v._PRIZE = $t("$.plus_rubines_generic", P);
v._ANTIPRIZE = $t("$.minus_rubines_generic", P);

v.bet = $t("dict.bet", P);

v.insu = $t("$.insuBet", { lngs: msg.lang, number: 25 });
v.nofunds = $t("$.noFundsBet", { lngs: msg.lang, number: USERDATA.modules.RBN });
v.insuFloor = $t("$.insuFloor", { lngs: msg.lang, number: 25 });
v.ceiling = $t("games:ceilingBet", { lngs: msg.lang, number: 2500 }).replace("%emj%", _emoji("rubine"));

console.log(Blackjack.gameExists(msg.author.id));

if (Blackjack.gameExists(msg.author.id)) {
  return msg.reply(v.ONGOING);
}

if (USERDATA.modules.RBN < 25) {
  P.number = USERDATA.modules.RBN;
  return msg.reply(v.insuFloor);
}
const bet = Math.abs(parseInt(arg));

if (Number.isNaN(bet)) return msg.command.invalidUsageMessage(msg);

if (bet && bet < 25) {
  P.number = 25;
  return msg.reply(v.insu);
}

if (USERDATA.modules.RBN < bet) return msg.reply(v.nofunds);
if (bet > 2500) {
  P.number = 2500;
  return msg.reply(v.ceiling);
}

const blackjack  = new Blackjack(msg);

Progression.emit("play.blackjack",{msg,userID:msg.author.id});

try {
  const playerHand = blackjack.getHand(powerups);
  const dealerHand = blackjack.getHand().map((card) => (card.startsWith("JOKER") ? `${randomize(1, 10)}H` : card));
  const balance    = USERDATA.modules.RBN;

  const canInsurance  = testInsurance(balance, bet, playerHand, dealerHand);
  const canDoubleDown = testDoubleDown(balance, bet, playerHand);
  const canSplit      = testSplit(balance, bet, playerHand);

  const hitstandPre = hitStandMessage(P, canDoubleDown, canSplit, canInsurance);

  msg.channel.send(v.NEWGAME);
  //${hitstandPre}
  return msg.channel.send(`.
    `).then(async (introMessage) => {
    // powerups.nojoker = false; // testing
    let playerHands;

    const log = {
      embed: {
        description: "Game Started",
        fields: [
          { name: "Player", value: "\u200b", inline: true },
          { name: "Pollux", value: "\u200b", inline: true },
        ],
        color: 0xF03350,
        footer: {
          icon_url: msg.author.avatarURL,
          text: msg.author.tag,
        },
        timestamp: new Date(),
      },
      usr: [],
      plx: [`> ${_emoji("plxcards")} Pollux \`OPEN\` **${Blackjack.handValue(dealerHand)}**`],
    };

    const drawOptions = {
      v,
      b: bet,
      bbt: bet,
      B: balance,
      p: playerName,
      d: polluxNick,
      m: msg,
      intro: introMessage,
      log,
    };
    const playerHandValueCalc = Blackjack.handValue(playerHand);

    if (playerHandValueCalc !== "Blackjack" && !playerHandValueCalc.toString().includes("JOKER")) {
      playerHands = await getFinalHand(blackjack, playerHand, dealerHand, myDeck, powerups, drawOptions);
      const result = gameResult(Blackjack.handValue(playerHands[0]), 0);
      const noHit = playerHands.length === 1 && result === "bust";

      // loli

      while ((Blackjack.isSoft(dealerHand) || Blackjack.handValue(dealerHand) < 17) && !noHit) {
        log.plx.push(`> ${Blackjack.handValue(dealerHand) > 21
          ? _emoji("plxbjkbust")
          : _emoji("plxcards")} Pollux \`HIT\` **${Blackjack.handValue(dealerHand)}** `
            + `> **${Blackjack.handValue(blackjack.hit(dealerHand, { nojoker: true }))}**`);
      }
      if (noHit) {
        log.plx.push(`> ${_emoji("plxbjkwin")} **Pollux wins**`);
      }

      log.embed.description = (`Game finished in ${log.plx.length + log.usr.length} turns.`);
      introMessage.delete();
    } else {
      playerHands = [playerHand];
    }

    const dealerValue = Blackjack.handValue(dealerHand);
    let winnings = 0;
    let hideHoleCard = true;
    const multiHandData = [];
    let finalResult;

    const H_DATA = {};
    let doubles = 0;
    let surrenders = 0;
    let insurances = 0;
    let insuranceAmount = 0;
    /** @type {Boolean} */
    let hasJoker = false;
    const gameJokers = [];
    const splitExplain = [];
    let splitWins = 0;

    playerHands.forEach((hand, i) => {
      let calcBet = bet;

      const playerValue = Blackjack.handValue(hand);
      let result = gameResult(playerValue, dealerValue);

      if (result !== "bust") hideHoleCard = false;
      doubles += hand.doubled ? 1 : 0;
      if (hand.surrendered) {
        surrenders++;
        calcBet = Math.ceil(calcBet / 2);
        result = "surrender";
      }
      if (hand.insurance) {
        insurances++;
        insuranceAmount = Math.ceil(bet / 2);
      }

      let lossOrGain = Math.floor(
        (
          (["loss", "bust", "surrender"].includes(result) ? -1 : result === "push" ? 0 : 1)
            * (hand.doubled ? 2 : 1)
            * (playerValue === "Blackjack"
              ? 1.5
              : playerValue.toString().includes("JOKER")
                ? 2
                : 1
            )
            * calcBet
        ),
      );

      lossOrGain += (dealerValue === "Blackjack" ? insuranceAmount : -insuranceAmount);
      if (dealerValue === "Blackjack") log.plx.push(`> ${_emoji("plxbjkbjk")} **Pollux has a Blackjack**`);
      if (playerValue === "Blackjack") log.usr.push(`> ${_emoji("plxbjkbjk")} **Player has a Blackjack**`);
      if (playerValue.toString().includes("JOKER")) log.usr.push(`> ${_emoji("plxbjkjkr")} **Player has a Joker**`);

      // winnings += lossOrGain;
      const soft = Blackjack.isSoft(hand);
      H_DATA.num = i + 1;
      H_DATA.val = playerValue;
      H_DATA.status = soft ? "SOFT" : "";
      H_DATA.result = playerHands.length === 1
        ? `** ${msg.member.displayName}**`
        : ` ${result.replace(/(^\w|\s\w)/g, (ma) => ma.toUpperCase())}${result !== "push"
          ? `, ${lossOrGain}`
          : `, ${"Rubines"}"} back`}\n`;
      multiHandData.push(H_DATA);
      winnings += Number(lossOrGain);
      if (playerValue.toString().includes("JOKER")) {
        hasJoker = true;
        gameJokers.push(playerValue.toString());
      }

      const RESULT_EMOJI = (res) => (playerValue.toString().includes("JOKER")
        ? _emoji("plxbjkjkr")
        : playerValue === "Blackjack"
          ? _emoji("plxbjkbjk")
          : res === "push"
            ? _emoji("plxbjkpush")
            : res === "loss"
              ? _emoji("plxbjkloss")
              : res === "bust"
                ? _emoji("plxbjkbust")
                : res === "Dealer bust"
                  ? _emoji("plxbjkwin")
                  : res.toLowerCase() === "blackjack"
                    ? _emoji("plxbjkbjk")
                    : res.toLowerCase() === "surrender"
                      ? _emoji("plxbjksurr")
                      : _emoji("plxbjkwin"));

      splitExplain.push(
        `${_emoji("plxcards").no_space}\`\u200b${(`${i + 1}`).padStart(2, " ")}\` : **\`\u200b${(`${lossOrGain}`).padStart(6, " ")}\`** `
          + `${_emoji("RBN")} ${RESULT_EMOJI(result)}${hand.doubled
            ? _emoji("plxbjk2x")
            : ""}${hand.insurance ? `${_emoji("plxbjkinsu")}\`${dealerValue === "Blackjack" ? "+" : "-"}${insuranceAmount}\`` : ""}`,
      );
      if(splitExplain.length > 1 && lossOrGain > 0) splitWins++;
      finalResult = result;
    });

    const POL_DATA = {};
    POL_DATA.val = `${hideHoleCard ? Blackjack.handValue([dealerHand[0]]) : dealerValue}`;
    const visihand = [dealerHand[0], ["X"]];

    let PLAY_RES = winnings === 0 ? v._EVEN : winnings > 0 ? v._WIN : v._LOSE;
    if (Blackjack.handValue(playerHands[0]).toString().includes("JOKER")) PLAY_RES = v._JOKER;

    P.insurance = insuranceAmount;

    // TOP -> Result

    if (finalResult === "push") PLAY_RES = v._EVEN;

    if (finalResult === "surrender") PLAY_RES = $t("games:blackjack.surrender_res", P);

    if (dealerValue === "Blackjack") PLAY_RES = $t("games:blackjack.blackjack_lose", P);

    if (playerHands.length === 1 && Blackjack.handValue(playerHand) === "Blackjack") PLAY_RES = $t("games:blackjack.blackjack_win", P);

    // TOP -> Commentary

    if (playerHand.doubled && ["loss", "bust", "surrender"].includes(finalResult)) PLAY_RES += `\n${$t("games:blackjack.double_lose", P)}`;
    else if (playerHand.doubled) PLAY_RES += `\n${$t("games:blackjack.double_win", P)}`;

    if (playerHand.insurance && dealerValue === "Blackjack") PLAY_RES += `\n${$t("games:blackjack.insurance_win", P)}`;
    else if (playerHand.insurance) PLAY_RES += `\n${$t("games:blackjack.insurance_lost", P)}`;

    const [POLLUX_HAND_GFX, PLAYER_HAND_GFX] = await Promise.all([
      renderHand(playerHands, myDeck),
      renderHand([hideHoleCard ? visihand : dealerHand], myDeck),
    ]);

    if (winnings !== 0) {
      if (winnings > 0) {
        Progression.emit("play.blackjack.win",{msg, userID:msg.author.id});
        Progression.emit("streak.blackjack.win",{value: 1, msg, userID:msg.author.id});
        await ECO.receive(msg.author.id, winnings, "blackjack", "RBN", {progressionOptions:{msg}});
      }
      else {
        Progression.emit("play.blackjack.lose",{msg, userID:msg.author.id});
        Progression.emit("streak.blackjack.win",{valueSet: 0, msg, userID:msg.author.id});
        await ECO.pay(msg.author.id, Math.abs(winnings), "blackjack", "RBN", {progressionOptions:{msg}, disableFundsCheck:true });
      }
    }else{
      Progression.emit("streak.blackjack.win",{valueSet: 0, msg, userID:msg.author.id});
      Progression.emit("play.blackjack.push",{msg, userID:msg.author.id});
    }

    drawOptions.b = bet * playerHands.length + doubles * bet;
    drawOptions.bbt = bet;
    drawOptions.ins = playerHands.filter((x) => x.insurance).length;
    drawOptions.actions = null;

    const scenario = await drawTable(PLAYER_HAND_GFX, POLLUX_HAND_GFX, multiHandData[0], POL_DATA, drawOptions);
    const resp = winnings > 0 ? v._PRIZE : winnings < 0 ? v._ANTIPRIZE : "";
    const rebalance = resp.replace("%R%", _emoji("rubine") + Math.abs(winnings));

    blackjack.endGame();

    if(splitWins){
      Progression.emit("play.blackjack.winsplit",{value: splitWins, msg, userID:msg.author.id})
    }

    msg.channel.send(PLAY_RES, { file: scenario.toBuffer("image/png", imageOptions), name: "blackjack.png" })
      .then((m) => {
        if (splitExplain.length) {
          log.embed.fields.push({
            name: `**${splitExplain.length > 1 ? $t("games:blackjack.splitbreak", P) : $t("games:blackjack.result", P)}**`,
            value: splitExplain.join("\n"),
            inline: false,
          });
          log.embed.fields[1] = { name: "Pollux Turn", value: log.plx.join("\n"), inline: true };
          log.embed.fields[0] = { name: "Player Turn", value: log.usr.join("\n"), inline: true };
        }
        m.channel.send({ content: rebalance, embed: splitExplain.length ? log.embed : {} }).catch(() => null);
      });

    // JOKER EFFECTS GO HERE
    if (hasJoker) {
      gameJokers.forEach((JKR, i) => {
        msg.channel.send(`\`${JKR}\` eff -- immediate -- J:${i}/${gameJokers.length}`);
      });
    }
  });
} catch (error) {
  blackjack.endGame();
}
};

module.exports = {
init,
pub: true,
cmd: "blackjack",
argsRequired: true,
perms: 3,
cat: "gambling",
cooldown: 5000,
// hooks,
aliases: ["bjk"],
teleSubs: [
  { label: "decks", path: "inventory/decks", pass: "casino" },
],
autoSubs: [
  {
    label: "deck",
    gen: DECK,
    options: {
      argsRequired: true,
      invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "decks", opt: "cosmetics" }); },
    },
  },
],
};
