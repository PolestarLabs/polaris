const ECO = require("../../archetypes/Economy");
const Roulette = require("../../archetypes/Roulette");
const Picto = require("../../utilities/Picto");

const settings = {};
	settings.collectTime = 35e3;
	settings.sendWheelTime = 30e3;
	settings.wheelSpinTime = 10e3;
// @flicky (set to 0/null to ignore)
	settings.boardEmbedColor = 0x2b2b3b;
	settings.helpEmbedColor = 0x2b2b3b;
	settings.wheelEmbedColor = 0x2b2b3b;
	settings.resultsEmbedColor = 0x2b2b3b;
	settings.helpURL = "https://cdn.discordapp.com/attachments/488142183216709653/719951843756867612/unknown.png"
	settings.minPerBet = 1;
	settings.maxPerBet = 2500;
	settings.maxBets = 10;
	settings.maxTotal = 20000;
	settings.timeBetweenBets = 1e3;
	settings.noticeTimeout = 5e3;

async function generateBoard() {
	// this could probably be a simple cached board
	// also may not work like this at all
	// api URL would be easiest (for updateBoard)

	/*
		Optional: Pass server ID for some customization
	*/
	return paths.CDN + "/generators/roulette.png";
};

async function generateWheel(winningNumber) {
	// make sure users can't determine the winning number
	return "https://cdn.discordapp.com/attachments/488142034776096772/719032519177273394/roulettebg.gif";
};

function getBoard(userData) {
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
	Object.keys(userData).forEach(k => {
		data += k + "_";
		data += userData[k].hash +="_";
		for (let bet of userData[k].bets) {
			data += "+" + toHex(bet) + "-" + bet.amount.toString(16);
		}
		data += ",";
	});
	data = data.substring(0, data.length - 1);

	let imageURL = paths.CDN + "/generators/roulette.png?data=" + data;

	return imageURL;
};

function toHex(bet) {
	const betTypes = ["straight", "split", "street", "square", "basket", "dstreet", "dozen", "column", "snake", "manque", "passe", "colour", "parity"];
	let type = betTypes.indexOf(bet.type).toString(16);
	let offset = bet.offset || bet.number === "d" ? 2 : bet.number === 0 ? 1 : bet.numbers?.sort()[1] - bet.numbers?.sort()[0] === 3 ? 1 : bet.type=='straight'? 0 :2;
	let number = Math.abs((bet.number || bet.numbers?.sort()[0]|| 0) -1).toString(36);

	return `${type}${offset}${number}`
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
};

async function creditUsers(results) {
	for (const result of results) {
		const userID = result.userID;
		ECO.checkFunds(userID, result.cost).then(() => {
			if (result.payout < 0) ECO.pay(userID, result.payout, "ROULETTE").catch(_ => "Too bad");
			else if (result.payout > 0) ECO.receive(userID, result.payout, "ROULETTE").catch(_ => "Shouldn't happen");
		}).catch(() => {
			result.invalid = true;
		});
	};
	return results;
};

const init = async function(msg) {

	const spamFilter = new Map();
	const checkSpam = m => {
		if (spamFilter.has(m.author.id) && m.timestamp - spamFilter.get(m.author.id) < settings.timeBetweenBets) return true;
		spamFilter.set(m.author.id, m.timestamp);
		return false;
	};

	let P={lngs:msg.lang,prefix:msg.prefix};
	if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

	if (Roulette.gameExists(msg.guild.id)) return $t("games.alreadyPlaying",P);

	const helpEmbed = {
		color: settings.helpEmbedColor,
		title: $t("games.roulette.helpTitle",P),
		description: $t("games.roulette.helpDescription",P),
		image: { url: settings.helpURL }
	};

	let board = await generateBoard();
	const boardEmbed = { color: settings.boardEmbedColor , fields: [] };
		boardEmbed.title = $t("games.roulette.boardTitle",P);
		boardEmbed.description = $t("games.roulette.boardDescription",P);
		boardEmbed.image = { url: board };
		boardEmbed.fields = [];
			boardEmbed.fields[0] = { name: "Feed", value: "_ _" };

	const Game = new Roulette(msg);
	const Collector = msg.channel.createMessageCollector(m => m.content.toLowerCase().startsWith("bet "), { time: settings.collectTime });

	const wheelEmbed = { color: settings.boardEmbedColor , fields: [] };
		wheelEmbed.description = $t("games.roulette.wheelDescription", { P, seconds: (settings.collectTime - settings.sendWheelTime) / 1e3 });
	let wheelmsg;
	setTimeout(async() => {
		const wheel = await generateWheel(Game.winningNumber);
		wheelEmbed.thumbnail = { url: wheel };
		wheelmsg = await msg.channel.send({ embed: wheelEmbed });
	}, settings.sendWheelTime);

	const boardmsg = await msg.channel.send({ embed: boardEmbed });

	const feed = [];
	function updateFeed(userID, bet) {
		if (feed.length === 5) feed.splice(0, 1);
		const betPlacedStrings = $t("games.roulette.betPlaced", { P, user: `<@${userID}>`, amount: `${_emoji("RBN")}${miliarize(bet.amount)}`, bet: translate(bet), returnObjects: true });
		feed.push("> " + betPlacedStrings[Math.floor(Math.random() * betPlacedStrings.length)])
		boardEmbed.fields[0].value = feed.join("\n");
		boardmsg.edit({ embed: boardEmbed });
	}

	Collector.on("message", async(m) => {
		if (m.content.split(" ")[1]?.toLowerCase() === "help") return m.channel.send({ content: "", embed: helpEmbed });

		const userID = m.author.id;
		if (checkSpam(m)) return m.reply($t("games.roulette.notSoFast"));

		const bet = Roulette.parseBet(m.content);
		if (!bet.valid) {
			m.addReaction(_emoji('chipERROR').reaction);
			return m.reply(_emoji('chipERROR') + $t(`games.roulette.${bet.reason}`,P) || $t("games.roulete.invalidBet",P)).then(r=>r.deleteAfter(settings.noticeTimeout));
		}

		const allowed = await allowedToBet(Game, userID, bet);
		if (allowed !== true) {
			m.addReaction(_emoji('chipWARN').reaction);
			return m.reply(_emoji('chipWARN') + $t(`games.roulette.${allowed.reason}`, { P, count: allowed.count }) || $t("games.roulette.notAllowed")).then(r=>r.deleteAfter(settings.noticeTimeout));
		}

		Game.addBet(userID, bet);
		Game.users[userID].hash = m.author.avatar || m.author.defaultAvatar;
		boardEmbed.image = {url:  getBoard(Game.users) }  // readded for testing
		updateFeed(userID, bet);
		m.addReaction(_emoji('chipOK').reaction)
	});

	Collector.on("end", async() => {
		wheelEmbed.description = $t("games.roulette.wheelEnd",P);
		await wheelmsg.edit({ embed: wheelEmbed });

		let results = Game.results;
		Game.end();

		validatedResults = await creditUsers(results);
		const displayNumber = Game.winningNumber == 37 ? "d" : Game.winningNumber

		const resultsEmbed = { color: settings.resultsEmbedColor , fields: [] };
			resultsEmbed.title = $t("games.roulette.resultsTitle",P);
			resultsEmbed.description = $t("games.roulette.resultsDescription", { P, number: _emoji('roulette'+displayNumber) });

			let value;
			if (validatedResults.length) {
				value = validatedResults.map(result => {
					let resultStrings;
					if (result.invalid) {
						resultStrings = $t("games.roulette.resultsInvalid", P);
					} else if (result.payout > 0) {
						resultStrings = $t("games.roulette.resultsWin", { P, count: result.payout, returnObjects: true });
					} else if (result.payout < 0) {
						resultStrings = $t("games.roulette.resultsLoss", { P, count: parseInt(result.payout), returnObjects: true });
					} else {
						resultStrings = $t("games.roulette.resultsDraw", { P, returnObjects: true });
					}
					return `<@${result.userID}> ` + (typeof resultStrings === "object" ? resultStrings[Math.floor(Math.random() * resultStrings.length)] : resultStrings);
				}).join("\n");
			} else {
				value = $t("games.roulette.resultsNoBet", P);
			}
			resultsEmbed.fields.push({ name: $t("games.roulette.resultsPlayer"), value: value});

			setTimeout(() => {
				wheelmsg.edit({ embed: resultsEmbed });
			}, settings.sendWheelTime + settings.wheelSpinTime - settings.collectTime);
	});
};

function e(number) {
	return _emoji(`roulette${number === "d" ? "00" : number}`);
}

function translate(bet) {
	switch (bet.type) {
		case "straight": return `${e(bet.number)}`;
		case "split": return `${e(bet.numbers[0])} & ${e(bet.numbers[1])}`;
		case "street": return `${e(bet.numbers[0])}- ${e(bet.numbers[1])}`;
		case "square": return `${e(bet.numbers[0])}, ${e(bet.numbers[1])}, ${e(bet.numbers[2])} & ${e(bet.numbers[3])}`;
		// basket
		case "dstreet": return `${e(bet.numbers[0])}through ${e(bet.numbers[1])}`;
		case "dozen": return `${e(1 + 12 * (bet.offset - 1))}through ${e(12 * bet.offset)}`;
		case "column": return `column ${bet.offset}`;
		// snake
		// manque
		// passe
		case "colour": return !bet.offset ? "black" : "red";
		case "parity": return !bet.offset ? "even": "uneven";
		default: return bet.type;
	}
}

module.exports = {
	init
	,pub:true
	,cmd:"roulette"
	,cooldown: 60e3
	,perms:3
	,cat:"gambling"
	,botPerms:["attachFiles","embedLinks"]
	,aliases:[]
};
