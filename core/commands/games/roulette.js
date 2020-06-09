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
		return paths.CDN + "/generators/roulette.png"

	*/
	return "https://cdn.discordapp.com/attachments/488142183216709653/718882975844139018/unknown.png";
};

async function generateWheel(winningNumber) {
	// make sure users can't determine the winning number
	return "https://cdn.discordapp.com/attachments/488142034776096772/719032519177273394/roulettebg.gif";
};

async function getBoard(userData) {
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
		data += k + "-";
		data += userData[k].hash;
		for (let bet of userData[k].bets) {
			data += "-" + toHex(bet) + "-" + bet.amount.toString(16);
		}
		data += "+";
	});
	data = data.substring(0, data.length - 1);

	let imageURL = paths.CDN + "/generators/roulette.png?data=" + encodeURIComponent(data);
	console.log(imageURL);
	//"%7B%22bet%22%3A%7B%22amount%22%3A150%2C%22type%22%3A%22dozen%22%2C%22offset%22%3A1%7D%2C%22userID%22%3A%2288120564400553984%22%7D"
	//https://beta.pollux.gg/generators/roulette.png?data=%7B%22gameUsers%22%3A%7B%2288120564400553984%22%3A%7B%22payout%22%3A-130%2C%22bets%22%3A%5B%7B%22valid%22%3Atrue%2C%22amount%22%3A10%2C%22type%22%3A%22colour%22%2C%22reward%22%3A1.5%2C%22numbers%22%3A%5B2%2C4%2C6%2C8%2C10%2C11%2C13%2C15%2C17%2C20%2C22%2C24%2C26%2C28%2C29%2C31%2C33%2C35%5D%2C%22offset%22%3A1%7D%2C%7B%22valid%22%3Atrue%2C%22amount%22%3A100%2C%22type%22%3A%22colour%22%2C%22reward%22%3A1.5%2C%22numbers%22%3A%5B2%2C4%2C6%2C8%2C10%2C11%2C13%2C15%2C17%2C20%2C22%2C24%2C26%2C28%2C29%2C31%2C33%2C35%5D%2C%22offset%22%3A1%7D%2C%7B%22valid%22%3Atrue%2C%22amount%22%3A10%2C%22type%22%3A%22colour%22%2C%22reward%22%3A1.5%2C%22numbers%22%3A%5B2%2C4%2C6%2C8%2C10%2C11%2C13%2C15%2C17%2C20%2C22%2C24%2C26%2C28%2C29%2C31%2C33%2C35%5D%2C%22offset%22%3A0%7D%2C%7B%22valid%22%3Atrue%2C%22amount%22%3A10%2C%22offset%22%3A2%2C%22type%22%3A%22dozen%22%2C%22reward%22%3A2%7D%5D%7D%7D%2C%22bet%22%3A%7B%22valid%22%3Atrue%2C%22amount%22%3A10%2C%22offset%22%3A2%2C%22type%22%3A%22dozen%22%2C%22reward%22%3A2%7D%2C%22userID%22%3A%2288120564400553984%22%7D

	return "https://cdn.discordapp.com/attachments/488142183216709653/718882975844139018/unknown.png";
};

function toHex(bet) {
	const betTypes = ["straight", "split", "street", "square", "basket", "dstreet", "dozen", "column", "snake", "manque", "passe", "colour", "parity"];
	let type = 1 << (40 + betTypes.indexOf(bet.type));

	if (["basket", "snake", "passe", "manque"].includes(bet.type)) return type.toString(16);
	if (["colour", "parity", "column", "dozen"].includes(bet.type)) return (type + (1 << bet.offset)).toString(16)

	if (bet.type === "straight") return (type + (1 << (bet.number === "d" ? 37 : bet.number))).toString(16);
	if (bet.type === "square") return (type + (1 << bet.numbers.sort()[0])).toString(16);
	if (bet.type === "street") return (type + (1 << bet.numbers.sort()[0])).toString(16);
	if (bet.type === "dstreet") return (type + (1 << bet.numbers[0])).toString(16);
	if (bet.type === "split") {
		let numbers = bet.numbers.sort();
		if (numbers[1] - numbers[0] === 3) return type.toString(16);
		else return (type + (1 << 38)).toString(16);

	}
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
		if (spamFilter.has(m.author.id) && spamFilter.get(m.author.id) > (Date.now() - settings.timeBetweenBets)) return true;
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

		await boardmsg.edit({ embed: boardEmbed }); // REPLACE WITH FEED
		m.addReaction(_emoji('chipOK').reaction)
		return m.reply(_emoji('chipOK') + v.BETPLACED).then(r=>r.deleteAfter(settings.noticeTimeout));
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

module.exports = {
	init
	,pub:true
	,cmd:"roulette"
	,cooldown: 10e3
	,perms:3
	,cat:"gambling"
	,botPerms:["attachFiles","embedLinks"]
	,aliases:[]
};
