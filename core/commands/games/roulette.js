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
	if (settings.minPerBet && bet.amount < settings.minPerBet) return { reason: "minPerBet" };
	if (settings.maxPerBet && bet.amount > settings.maxPerBet) return { reason: "maxPerBet" };
	const user = Game.getUser(userID);
	if (user) {
		if (settings.maxBets && user.bets >= settings.maxBets) return { reason: "maxBets" };
		if (settings.maxTotal && user.amount >= settings.maxTotal) return { reason: "maxTotal" };
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

	const v = {};
		v.ONGOING = "A Roulette game is already ongoing in this server";

		v.BOARD_TITLE = "Polaris Roulette";
		v.BOARD_DESCRIPTION = "You may now place your bets! `bet [amt] [bet] <1-3>`\nUse `bet help` for a detailed betting tutorial.";

		v.HELP_TITLE = "Roulette Betting Help";
		v.HELP_DESCRIPTION = "Check the wiki for more detailed information";

		v.RESULTS_TITLE = "Roulette Results";
		v.RESULT_NOMONEY = "You somehow lost your money so your bets were dismissed.";

		v.WHEEL_DESCRIPTION = `${(settings.collectTime - settings.sendWheelTime) / 1000} seconds left to place your bets!`;
		v.WHEEL_DESCRIPTION_END = `The wheel will now decide your faith.`;

		v.NOTSOFAST = "You are placing bets too fast.";

		v.invalidBet = "Invalid bet";
		v.missingAll = "No params";
		v.missingAmount = "No amount";
		v.missingBet = "No bet";
		v.zeroAmount = "Bet atleast 1 RBN";

		v.notAllowed = "You can't place this bet right now";
		v.noMoney = "not enough money";
		v.minPerBet = `Minimum is ${settings.minPerBet} RBN`;
		v.maxPerBet = `Maximum is ${settings.maxPerBet} RBN`;
		v.maxBets = `Maximum bets is ${settings.maxBets}`;
		v.maxTotal = `Maximum total is ${settings.maxTotal} RBN`;

		v.BETPLACED = "Your bet has been placed";

	if (Roulette.gameExists(msg.guild.id)) return v.ONGOING;

	const helpEmbed = {
		color: settings.helpEmbedColor,
		title: v.HELP_TITLE,
		description: v.HELP_DESCRIPTION,
		image: { url: settings.helpURL }
	};

	let board = await generateBoard();
	const boardEmbed = { color: settings.boardEmbedColor , fields: [] };
		boardEmbed.title = v.BOARD_TITLE;
		boardEmbed.description = v.BOARD_DESCRIPTION;
		boardEmbed.image = { url: board };
		boardEmbed.fields = [];
			boardEmbed.fields[0] = { name: "Feed", value: "_ _" };

	const Game = new Roulette(msg);
	const Collector = msg.channel.createMessageCollector(m => m.content.toLowerCase().startsWith("bet "), { time: settings.collectTime });

	const wheelEmbed = { color: settings.boardEmbedColor , fields: [] };
		wheelEmbed.description = v.WHEEL_DESCRIPTION;
	let wheelmsg;
	setTimeout(async() => {
		const wheel = await generateWheel(Game.winningNumber);
		wheelEmbed.thumbnail = { url: wheel };
		wheelmsg = await msg.channel.send({ embed: wheelEmbed });
	}, settings.sendWheelTime);

	const boardmsg = await msg.channel.send({ embed: boardEmbed });

	const feed = [];
	function updateFeed(userID, bet) {
		if (feed.length === 5) feed.splice(4, 1);
		feed.splice(0, 0, `- <@${userID}> has placed ${_emoji("RBN")}${miliarize(bet.amount)} on ${translate(bet)}`);
		boardEmbed.fields[0].value = feed.join("\n");
		boardmsg.edit({ embed: boardEmbed });
	}

	Collector.on("message", async(m) => {
		if (m.content.split(" ")[1]?.toLowerCase() === "help") return m.channel.send({ content: "", embed: helpEmbed });

		const userID = m.author.id;
		if (checkSpam(m)) return m.reply(v.NOTSOFAST);

		const bet = Roulette.parseBet(m.content);
		if (!bet.valid) {
			m.addReaction(_emoji('chipERROR').reaction);
			return m.reply(_emoji('chipERROR') + v[bet.reason] || v.invalidBet).then(r=>r.deleteAfter(settings.noticeTimeout));
		}

		const allowed = await allowedToBet(Game, userID, bet);
		if (allowed !== true) {
			m.addReaction(_emoji('chipWARN').reaction);
			return m.reply(_emoji('chipWARN') + v[allowed.reason] || v.notAllowed).then(r=>r.deleteAfter(settings.noticeTimeout));
		}

		Game.addBet(userID, bet);
		Game.users[userID].hash = m.author.avatar || m.author.defaultAvatar;
		boardEmbed.image = {url:  getBoard(Game.users) }  // readded for testing
		updateFeed(userID, bet);
		m.addReaction(_emoji('chipOK').reaction)
	});

	Collector.on("end", async() => {
		console.log("End");
		wheelEmbed.description = v.WHEEL_DESCRIPTION_END;
		const boardImg = await getBoard(Game.users);
		wheelEmbed.image = { url: boardImg };
		await wheelmsg.edit({ embed: wheelEmbed });

		let results = Game.results;
		Game.end();

		validatedResults = await creditUsers(results);
		const displayNumber = Game.winningNumber == 37 ? "d" : Game.winningNumber

		const resultsEmbed = { color: settings.resultsEmbedColor , fields: [] };
			resultsEmbed.title = v.RESULTS_TITLE;
			resultsEmbed.description = `The winning number was ${_emoji('roulette'+displayNumber)}`;

			let value;
			if (validatedResults.length) {
				value = validatedResults.map(result => {
				if (result.invalid) return `<@${result.userID}> ${v.RESULT_NOMONEY}`;
				else if (result.payout > 0) return `<@${result.userID}> Congrats you got ${result.payout} RBN`;
				else if (result.payout < 0) return `<@${result.userID}> Sorry, but I'll be taking ${parseInt(result.payout)} RBN away from you`;
				else return `<@${result.userID}> You barely got away and didn't win or lose anything.`;
				}).join("\n");
			} else {
				value = "Sadly no one placed a bet";
			}
			resultsEmbed.fields.push({ name: "Player Results", value: value});

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
