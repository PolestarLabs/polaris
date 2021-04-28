const ECO = require("../../archetypes/Economy");
const Roulette = require("../../archetypes/Roulette");
// const Picto = require("../../utilities/Picto");

// REVIEW[epic=flicky] check and alter the amounts
const settings = {
  collectTime: 60e3,
  sendWheelTime: 30e3,
  wheelSpinTime: 8e3,
  // @flicky (set to 0/null to ignore)
  boardEmbedColor: 0x14ACB7,
  helpEmbedColor: 0x5A90F5,
  wheelEmbedColor: 0x14ACB7,
  resultsEmbedColor: 0x14ACB7,
  helpURL: "https://cdn.pollux.gg/pollux101/roulette-cheatsheet.png",
  minPerBet: 5,
  maxPerBet: 2500,
  maxBets: 10,
  maxTotal: 20000,
  timeBetweenBets: 1e3,
  noticeTimeout: 5e3,
};

const numSort = (a, b) => a - b;
function toHex(bet) {
  const betTypes = ["straight", "split", "street", "square", "basket", "dstreet", "dozen", "column", "snake", "manque", "passe", "colour", "parity"];
  const type = betTypes.indexOf(bet.type).toString(16);

  const offset = bet.offset ?? (bet.number === "d"
    ? 2 : bet.number === 0
      ? 1 : bet.numbers?.sort(numSort)[1] - bet.numbers?.sort(numSort)[0] === 3
        ? 1 : bet.type === "straight"
          ? 0 : 2);
  const number = Math.abs((bet.number || bet.numbers?.sort(numSort)[0] || 0) - 1).toString(36);

  return `${type}${offset}${number}`;
}

async function allowedToBet(Game, userID, bet) {
  if (settings.minPerBet && bet.amount < settings.minPerBet) return { reason: "minPerBet", count: settings.minPerBet };
  if (settings.maxPerBet && bet.amount > settings.maxPerBet) return { reason: "maxPerBet", count: settings.maxPerBet };
  const user = Game.getUser(userID);
  if (user) {
    if (settings.maxBets && user.bets >= settings.maxBets) return { reason: "maxBets", count: settings.maxBets };
    if (settings.maxTotal && user.amount >= settings.maxTotal) return { reason: "maxTotal", count: settings.maxTotal };
    if (!await ECO.checkFunds(userID, bet.amount + user.amount)) return { reason: "noMoney" };
  }
  return true;
}

async function creditUsers(results) {
  for (const result of results) {
    const { userID } = result;
    ECO.checkFunds(userID, result.cost).then((hasEnough) => {
      if (!hasEnough) result.invalid = true;
      else if (result.payout < 0) {
        Progression.emit("play.roulette.lose",{userID, value: 1});
        Progression.emit("streak.roulette.win",{userID, valueSet: 0});
        ECO.pay(userID, result.payout, "gambling_roulette").catch(() => "Too bad")
      }
      else if (result.payout > 0) {
        Progression.emit("play.roulette.win",{userID, value: 1});
        Progression.emit("streak.roulette.win",{userID, value: 1});
        ECO.receive(userID, result.payout, "gambling_roulette").catch(() => "Shouldn't happen")
      };
    });
  }
  return results;
}

async function generateBoard() {
  // this could probably be a simple cached board
  // also may not work like this at all
  // api URL would be easiest (for updateBoard)

  /*
    Optional: Pass server ID for some customization
  */
  return `${paths.DASH}/generators/roulette.png`;
}

async function generateWheel() {
  // make sure users can't determine the winning number
  return "https://cdn.discordapp.com/attachments/488142034776096772/719032519177273394/roulettebg.gif";
}

function getBoard(userData, highlight) {
  /*
    bet {
      amount: integer
      type: string
      offset: number (0-3)
    }
    type: [straight, split, street, basket, dozen, column, snake, manque, passe, colour, parity]
    offset: dozen & column: 1-3 - colour: 0 = black, 1 = red - parity: 0 = even, 1 = uneven
  */
  let data = "";

  Object.keys(userData).forEach((k) => {
    data += `${k}_`;
    data += userData[k].hash += "_";
    for (const bet of userData[k].bets) {
      data += `+${toHex(bet)}-${bet.amount.toString(16)}`;
    }
    data += ",";
  });
  data = data.substring(0, data.length - 1);

  const imageURL = `${paths.DASH}/generators/roulette.png?data=${data}`;

  return imageURL + (highlight ? `&h=${highlight}` : "");
}

function e(number) {
  return _emoji(`roulette${number === "d" ? "00" : number}`);
}

function translate(bet) {
  const _b = "\u2002";// _emoji('__');

  switch (bet.type) {
    case "straight": return `${e(bet.number)}${_b}Straight **${(bet.number === "d" ? "00" : bet.number)}**`;
    case "split": return `${_emoji("split")}${_b}${e(bet.numbers[0])} & ${e(bet.numbers[1])}`;
    case "street": return `${_emoji("street")}${_b}${e(bet.numbers[0])}- ${e(bet.numbers[1])}`;
    case "square": return `${_emoji("square")}${_b}${e(bet.numbers[0])} ${e(bet.numbers[1])} ${e(bet.numbers[2])} ${e(bet.numbers[3])}`;
    case "basket": return `${_emoji("basket")}${_b}Basket`; // basket
    case "dstreet": return `${_emoji("dstreet")}${_b}${e(bet.numbers[0])} > ${e(bet.numbers[1])}`;
    case "dozen": return `${_emoji(`dozen${bet.offset}`)}${_b}${e(1 + 12 * (bet.offset - 1))} ~ ${e(12 * bet.offset)}`;
    case "column": return `${_emoji(`column${bet.offset}`)}${_b}Column ${bet.offset}`;
    case "snake": return `${_emoji("snake")}${_b}Snake`; // snake
    case "manque": return `${_emoji("manque")}${_b}Manque`; // manque
    case "passe": return `${_emoji("passe")}${_b}Passe`; // passe
    case "colour": return !bet.offset ? `${_emoji("noir")}${_b}Noir` : `${_emoji("rouge")}${_b}Rouge`;
    case "parity": return !bet.offset ? `${_emoji("even")}${_b}Pair` : `${_emoji("odd")}${_b}Impair`;
    default: return bet.type;
  }
}

const init = async (msg) => {
  const spamFilter = new Map();
  const checkSpam = (m) => {
    if (spamFilter.has(m.author.id) && m.timestamp - spamFilter.get(m.author.id) < settings.timeBetweenBets) return true;
    spamFilter.set(m.author.id, m.timestamp);
    return false;
  };

  const P = { lngs: msg.lang, prefix: msg.prefix };

  if (Roulette.gameExists(msg.guild.id)) return $t("games.alreadyPlaying", P);

  const helpEmbed = {
    color: settings.helpEmbedColor,
    title: $t("games.roulette.helpTitle", P),
    description: $t("games.roulette.helpDescription", P),
    image: { url: settings.helpURL },
  };

  const board = await generateBoard();
  const boardEmbed = { color: settings.boardEmbedColor, fields: [] };
  boardEmbed.title = $t("games.roulette.boardTitle", P);
  boardEmbed.description = $t("games.roulette.boardDescription", P);
  boardEmbed.image = { url: board };
  boardEmbed.fields = [];
  boardEmbed.fields[0] = { name: "Feed", value: "_ _" };

  const Game = new Roulette(msg);
  const Collector = msg.channel.createMessageCollector((m) => m.content.toLowerCase().startsWith("bet "), { time: settings.collectTime });

  const wheelEmbed = { color: settings.boardEmbedColor, fields: [] };
  wheelEmbed.description = $t("games.roulette.wheelDescription", { P, seconds: (settings.collectTime - settings.sendWheelTime) / 1e3 });
  let wheelmsg;
  setTimeout(async () => {
    const wheel = await generateWheel(Game.winningNumber);
    wheelEmbed.thumbnail = { url: wheel };
    wheelmsg = await msg.channel.send({ embed: wheelEmbed });
  }, settings.sendWheelTime);

  const boardmsg = await msg.channel.send({ embed: boardEmbed });

  const feed = [];
  function updateFeed(userID, bet) {
    if (feed.length === 5) feed.splice(0, 1);
    /*
    P.user = userName;
    P.amount = `**${miliarize(bet.amount)}** ${_emoji("RBN")}`;
    P.bet = translate(bet);

    const commentary = rand$t("games.roulette.betPlaced", P);
    */

    const betPlacedString = `<@${userID}>: **\`${(`${bet.amount}`).padStart(4, " ")}\`** ${_emoji("RBN")} \u2002→ \u2002${translate(bet)}`;
    feed.push(`> ${betPlacedString}`);

    boardEmbed.fields[0].value = feed.join("\n");
    boardmsg.edit({ embed: boardEmbed });
  }

  Collector.on("message", async (m) => {
    if (m.content.split(" ")[1]?.toLowerCase() === "help") return m.channel.send({ content: "", embed: helpEmbed });

    const userID = m.author.id;
    if (checkSpam(m)) return m.reply($t("games.roulette.notSoFast"));

    const bet = Roulette.parseBet(m.content);
    if (!bet.valid) {
      m.addReaction(_emoji("chipERROR").reaction);
      return m.reply(_emoji("chipERROR") + $t(`games.roulette.${bet.reason}`, P) || $t("games.roulete.invalidBet", P))
        .then((r) => r.deleteAfter(settings.noticeTimeout));
    }

    const allowed = await allowedToBet(Game, userID, bet);
    if (allowed !== true) {
      m.addReaction(_emoji("chipWARN").reaction);
      return m.reply(_emoji("chipWARN") + $t(`games.roulette.${allowed.reason}`, { P, count: allowed.count }) || $t("games.roulette.notAllowed"))
        .then((r) => r.deleteAfter(settings.noticeTimeout));
    }
    Progression.emit("play.roulette."+bet.type ,{msg:m, userID, value:bet.amount});

    Game.addBet(userID, bet);
    Game.users[userID].hash = m.author.avatar || m.author.defaultAvatar;
    boardEmbed.image = { url: getBoard(Game.users) }; // readded for testing
    updateFeed(userID, bet);
    // return m.addReaction(_emoji("chipOK").reaction);
    m.delete();
  });

  Collector.on("end", async () => {
    wheelEmbed.description = $t("games.roulette.wheelEnd", P);
    await wheelmsg.edit({ embed: wheelEmbed });

    const { results } = Game;
    Game.end();

    validatedResults = await creditUsers(results);
    const displayNumber = Game.winningNumber === 37 ? "d" : Game.winningNumber;

    const resultsEmbed = { color: settings.resultsEmbedColor, fields: [] };
    resultsEmbed.title = $t("games.roulette.resultsTitle", P);
    resultsEmbed.description = $t("games.roulette.resultsDescription", { P, number: _emoji(`roulette${displayNumber}`) });
    resultsEmbed.image = { url: "attachment://roulette.png" };
    // resultsEmbed.thumbnail = { url: `https://cdn.discordapp.com/emojis/${_emoji(`roulette${displayNumber}`).id}.png` };

    let value;
    if (validatedResults.length) {
      const uniqueUsers = validatedResults.map(x=>x.userID).filter((v,i,a)=> a.indexOf(v)===i);
      uniqueUsers.forEach(userID=>{
        Progression.emit("play.roulette.lose",{userID,msg,value: uniqueUsers.length});
      });
        
      value = validatedResults.map((result) => {
        let resultStrings;
        if (result.invalid) {
          resultStrings = $t("games.roulette.resultsInvalid", P);
        } else if (result.payout > 0) {
          resultStrings = $t("games.roulette.resultsWin", {
            P, e: _emoji("RBN"), count: result.payout, returnObjects: true,
          });
        } else if (result.payout < 0) {
          resultStrings = $t("games.roulette.resultsLoss", {
            P, e: _emoji("RBN"), count: Math.abs(parseInt(result.payout)), returnObjects: true,
          });
        } else {
          resultStrings = $t("games.roulette.resultsDraw", { P, returnObjects: true });
        }
        return `<@${result.userID}> ${typeof resultStrings === "object"
          ? resultStrings[Math.floor(Math.random() * resultStrings.length)] : resultStrings}`;
      }).join("\n");
    } else {
      value = $t("games.roulette.resultsNoBet", P);
    }
    resultsEmbed.fields.push({ name: $t("games.roulette.resultsPlayer"), value });

    setTimeout(async () => {
      boardEmbed.image = {};
      boardmsg.edit({ embed: boardEmbed });
      // wheelmsg.delete();
      wheelmsg.channel.send({ embed: resultsEmbed }, { name: "roulette.png", file: (await resolveFile(getBoard(Game.users, displayNumber))) });
    }, settings.sendWheelTime + settings.wheelSpinTime - settings.collectTime);
  });
  return null;
};

module.exports = {
  init,
  pub: true,
  cmd: "roulette",
  cooldown: 6e4,
  perms: 3,
  cat: "gambling",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  helpImage: settings.helpURL,
};
