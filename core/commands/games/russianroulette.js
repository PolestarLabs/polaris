const RussianRoulette = require('../../archetypes/RussianRoulette.js');
const ECO = require(appRoot + '/core/archetypes/Economy.js');



const startGameCollector = async (game,msg,cb) => {


	const BET = parseInt(msg.args[0]);


	const response = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, {
		time: 30e3,
		maxMatches: 1
	});

	if (!response[0]) return msg.reply('you haven\'t said your action in 30 seconds! Stopping the game.');

	const result = await game.handleInput(response[0].content);

	console.log({result})

	if (result.invalidInput) return msg.channel.send('You **have** to say shoot or stop. Game stopped, and I\'m not returning your money back.');
	
	if (result.stopped) {
		await ECO.receive(msg.author.id, game.currentPayout-BET, 'Russian Roulette STOP');
		return msg.channel.send(better ? `You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.` : 'You\'re a quitter!\nI haven\'t changed anything because you didn\'t even played.');
	}

	const message = await msg.channel.send('Let\'s see if you\'re going to die now...');
	if (result.lost) {
		await ECO.pay(msg.author.id, BET, "Russian Roulette FAILURE");
		return message.edit(`BOOM! Someone got shot...\nYou lost your money. RIP.`);
	} else if (result.won) {
		await ECO.receive(msg.author.id, game.currentPayout-BET, 'Russian Roulette FLAWLESS');
		return message.edit(`**no bullet noise**\nYou came out alive of the game...\nI added **${game.payout}** rubines to your account.`);
	}

	await message.edit(`*\*no bullet noise\**\nNo bullet this time (${result.rounds} rounds remaining)...\nYou currently have **${game.currentPayout} rubines.**\nUse \`shoot\` to test your luck one more time (if you don't get shot, I'm going to add more money to your current amount)\nUse \`stop\` to stop here and get your money.`);
	return cb(game, msg,cb)
}

const startPlayerCollector = async (msg) => {
	const verifiedPlayers = []

	const filter = async (m) => {
		return m.content.startsWith('join ') &&
			!verifiedPlayers.filter(a => a.id === m.author.id)[0] &&
			!isNaN(m.content.split(' ')[1]) &&
			parseInt(m.content.split(' ')[1]) > 0 &&
			(await ECO.checkFunds(m.author.id, parseInt(m.content.split(' ')[1]))) &&
			verifiedPlayers.push({
				id: m.author.id,
				name: m.author.username,
				money: parseInt(m.content.split(' ')[1])
			}) &&			
			msg.edit(`**Total of rubines in the pool**: ${verifiedPlayers.map(a => a.money).reduce((a, b) => a + b)} rubines\n**Players**\n${verifiedPlayers.map(a => `- **${a.name}** - ${a.money} rubines\n`)}`)
	}

	const collector = await msg.channel.awaitMessages(filter, {
		time: 20e3,
		maxMatches: 5
	});

	return verifiedPlayers;
}

const startMultiplayerLoop = async (msg, players) => {

	const value = players.map(a => a.money).reduce((a, b) => a + b)
	let finished = false
	let round = 1
	let lost = false

	while (!finished) {

		const game = new RussianRoulette(null, 0)
		let gameFrame = {
			embed:{
				title:  `**Round ${round}**\n`,
				description: "",
				image:{url:""},
				color:0x2b2b3b
			}
		}

		const message = await msg.channel.send(gameFrame);
		let _p = 0

		while (_p < players.length) {
			const player = players[_p]
			gameFrame.embed.description += `${player.name}'s turn.... `
			//gameFrame.embed.image.url = ""// `${paths.CDN}/build/games/russian_roulette/load1_.gif`
			await message.edit(gameFrame);
			const rst = game.handleInput('shoot')
			if (rst.lost) {
				players = shuffle(players.filter(a => a.id !== player.id))
				await ECO.pay(player.id, player.money, 'RUSSIANROULETTE');
				lost = player
			}

			await wait(3);

			if (lost) {
				gameFrame.embed.description += `BOOM! ${player.name} is dead.`;
				gameFrame.embed.color = 0x521723
				gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/shot_.gif`
			} else {
				gameFrame.embed.description += '*no bullet noise*\n';
				gameFrame.embed.color = 0x32437d
				gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/blank_.gif`
			}

			await message.edit(gameFrame);

			if (lost) _p = players.length + 1;
			else _p++; 	// Stop the forEach loop, the bullet is now gone
			
			await wait(3);
		}

		if (players.length === 1) {
			await ECO.receive(players[0].id, value, 'RUSSIANROULETTE');

			gameFrame.embed.title = `Show is over, kids!`
			gameFrame.embed.description = `${players[0].name} stands victorious!`
			gameFrame.embed.color = 0x608a6d
			gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/win_.gif`

			msg.channel.send(gameFrame)
			finished = true
			return
		}

		message.deleteAfter(3000).catch(e=>null);
		_p = 0

		await msg.channel.send({
			embed:{
				title: 'End of the round!',
				description: '**Results:**\n' + (lost ? `${lost.name} was the loser. RIP.` : 'No one died this time...') + '\nStarting the next round.',
				thumbnail:{url:`${paths.CDN}/build/games/russian_roulette/miniload.gif`}
			}
		}).then(m=>m.deleteAfter(5000));
				
		lost = null
		round++
	}

}


const init = async function (msg, args) {

	if (args[0] === 'multiplayer' ||args[0] === 'mp'||args[0] === 'start' ) {
		await msg.channel.send(`Ok, multiplayer mode.\nTo join the match, just use \`join <how many rubines you are using>\`.\n**The match starts in __20 seconds__.**`);
		const players = await startPlayerCollector(await msg.channel.send('**Total of rubines in the pool:** 0 rubines\n**Players**\n---') );
		if (players.length === 1) return msg.channel.send('If only 1 person is going to play, you should use singleplayer mode.');
		if (players.length === 0) return msg.channel.send('No one joined. I\'m not playing this alone.');
		await msg.channel.send({embed:{
			description:`**Time's up!** Let's get started.\nPlayers: \`\`\`${players.map(a => a.name).join(', ')}\`\`\``,
			image:{url:`${paths.CDN}/build/games/russian_roulette/load1_.gif`}
		}
	});
		return startMultiplayerLoop(msg, shuffle(players));
	}

	const BET = parseInt(args[0]);

	if ( !BET ) return msg.reply('you have to give me a number of how much rubines you are going to ~~waste~~ use, or you can use `multiplayer` to create a multiplayer game.');
	if (BET < 100)  return msg.reply("You gotta bet at very least 100 RBN on thir");
	if (BET > 5000) return msg.reply("You can't put more than 5000 RBN at stake");

	const urf = await ECO.checkFunds(msg.author.id, BET);
	if (!urf) return msg.reply('you don\'t have all this money to waste with russian roulette.');

	const game = new RussianRoulette(msg, BET)

	await msg.channel.send(`Russian Roulette? You probably already know the rules, so let\'s get started.\nIf you survive this one, you\'re going to receive **${game.nextValue} rubines**.\nUse \`shoot\` to proceed (if you get shot, you'll lose your money).`)
	startGameCollector(game, msg, startGameCollector);
		
};



module.exports = {
	init,
	cmd: "russianroulette",
	argsRequired: true,
	perms: 3,
	cat: 'games',
	botPerms: ['attachFiles', 'embedLinks', 'manageMessages'],
	aliases: ['rr', 'roletarussa']
};