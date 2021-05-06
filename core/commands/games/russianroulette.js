/* eslint-disable no-await-in-loop */
const RussianRoulette = require("../../archetypes/RussianRoulette.js");
const BOARD = require("../../archetypes/Soundboard.js");

const gunRoll = `${appRoot}/../assets/sound/gunroll.mp3`;
const awp = `${appRoot}/../assets/sound/awp.mp3`;
const click = `${appRoot}/../assets/sound/click.mp3`;
const clickNoAmmo = `${appRoot}/../assets/sound/noammo.mp3`;

// TRANSLATE[epic=translations] russian roulette
// TODO[epic=anyone] rr - add easter egg with `=say` cmd
// FIXME[epic=flicky] rr - sound stopped working
// NOTE rr- could really some code cleanup

const ECO = require(`${appRoot}/core/archetypes/Economy.js`);

const startGameCollector = async (game, msg, cb) => {
	const BET = parseInt(msg.args[0]);

	const response = await msg.channel.awaitMessages(
		(m) => m.author.id === msg.author.id && ["shoot", "stop"].includes(m.content.toLowerCase()),
		{
			time: 10e3,
			maxMatches: 1,
		},
	);

	if (!response[0]) return msg.reply("you haven't said your action in 30 seconds! Stopping the game.");

	const result = await game.handleInput(response[0].content);

	console.log({ result });

	if (result.stopped) {
		await ECO.receive(msg.author.id, game.currentPayout - BET, "gambling_russroll");
		return msg.channel.send(`You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.`);
		// return msg.channel.send(result.better
		//   ? `You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.`
		//   : "You're a quitter!\nI haven't changed anything because you didn't even played.");
	}

	const message = await msg.channel.send("Let's see if you're going to die now...");
	if (result.lost) {
		await ECO.pay(msg.author.id, BET, "russianroulette.gambling");
		return message.edit("BOOM! Someone got shot...\nYou lost your money. RIP.");
	} if (result.won) {
		await ECO.receive(msg.author.id, game.currentPayout - BET, "russianroulette.win");
		return message.edit(`**no bullet noise**\nYou came out alive of the game...\nI added **${game.currentPayout}** rubines to your account.`);
	}

	await message.edit(`**no bullet noise**\nNo bullet this time (${result.rounds} rounds remaining)...\n`
		+ `You currently have **${game.currentPayout} rubines.**\n`
		+ "Use `shoot` to test your luck one more time (if you don't get shot, I'm going to add more money to your current amount)\n"
		+ "Use `stop` to stop here and get your money.");
	return cb(game, msg, cb);
};
// START
// Does member die?
const playerRoulette = async (player, game) => {
	const rst = game.handleInput("shoot");
	return !!rst.lost;
};

const handlePlayers = async (msg, players, game, gameFrame) => {
	//let voiceChannel = msg.member.voiceState.channelID;
	//voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
	let dead = null;
	for (const index in players) { // eslint-disable-line guard-for-in
		
		await wait(1);
		
		//if (voiceChannel) voiceChannel.stopPlaying();
		const player = players[index];

		// No one is dead so far
		gameFrame.embed.description += `${player.name}'s turn.... `;
		gameFrame.embed.footer = {text: `Say "shoot" or click the gun to fire! (8s)` }
		//if (voiceChannel) voiceChannel.play(click);
		// gameFrame.embed.image.url = ""// `${paths.CDN}/build/games/russian_roulette/load1_.gif`
		const died = player.isBot || await playerRoulette(player, game);
		await msg.edit(gameFrame); // Next person, edit message and wait 3 seconds

		await userShoot(msg,player);
		

		// Fire. Check if they're dead

		if (died) { // Person died
			dead = player; // This is the person who died
			players.splice(index, 1); //  Person should be removed from array
			gameFrame.embed.description += `BOOM! ${player.name} is dead.`;
			gameFrame.embed.color = 0x521723;
			gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/shot_.gif`;
		} else { // Person did not die
			gameFrame.embed.description += "*no bullet noise*\n";
			gameFrame.embed.color = 0x32437d;
			gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/blank_.gif`;
		}

		// Tell players the status of that player
		// await wait(1);
		// if (game.voiceChannel) game.voiceChannel.stopPlaying();

		//if (voiceChannel) voiceChannel.stopPlaying();
		await msg.edit(gameFrame);

		if (died) {
			//if (voiceChannel) voiceChannel.play(awp);
		} //else if (voiceChannel) voiceChannel.play(clickNoAmmo);

		if (died) break;
	}
	await wait(3);
	// End of round
	return dead;
};

const newRound = async (msg, players, round = 1, initialMessage, hasBots) => {
	// Initialise game
	//let voiceChannel = msg.member.voiceState.channelID;
	//voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
	//if (voiceChannel) voiceChannel.play(gunRoll);
	await wait(2);

	const value = players.map((a) => a.money).reduce((a, b) => a + b);
	const game = new RussianRoulette(null, 0);
	const gameFrame = {
		embed: {
			title: `**Round ${round}**\n`,
			description: "",
			image: { url: "" },
			color: 0x2b2b3b,
		},
	};

	// Actual rounds
	const message = await msg.channel.send(gameFrame);
	const diedInRound = await handlePlayers(message, players, game, gameFrame);
	await message.deleteAfter(5).catchReturn();

	// Is there 1 person left?
	if (players.length === 1) { // This person wins
		
		const player = players[0];
		initialMessage.delete().catchReturn();
		gameFrame.embed.footer = {};

		await wait(3);
		
		
		if (player.isBot){
			gameFrame.embed.title = "Did y'all lose to a **bot**???";
			gameFrame.embed.description = `${player.name} stands victorious! You guys suck...`;
			gameFrame.embed.color = 0x608a6d;
			gameFrame.embed.image.url = "http://1.bp.blogspot.com/-n7NmKmr60ts/U4JaTVi5pbI/AAAAAAAAH30/0OuS6MUxyN8/s1600/Robocop+7.gif";
			
			return await msg.channel.send(gameFrame);
			
		}else{
						
			if (hasBots){
				if (value) await ECO.receive(players[0].id, value, "russianroulette.win");				
				return msg.channel.send({
					content: "Matches with bot participants aren't eligible for Winner's Gambit.",
					embed:{
						description: `${player.name} stands victorious!\n\n • ${_emoji('RBN')} **${value}** ${$t('keywords.RBN',{count:value})} added to your balance!`,
						color: 0x32437d,
						image: {
							url: `${paths.CDN}/build/games/russian_roulette/win_.gif`
						}
					}
				});
			}
			
			const challengeFrame = {
				content: `<@${player.id}> **Winner's Gambit:** Try one last time for a 150% prize?`,
				embed: {
					description: `Click the <:Gun:338331025300127745> to accept. Otherwise click ${_emoji('nope')}`
				}
			};

			const challenge = await msg.channel.send(challengeFrame);
			await challenge.addReaction("Gun:338331025300127745");
			await challenge.addReaction(_emoji('nope').reaction);

			const playerResponse = await challenge.awaitReactions(rea=> rea.userID === player.id && ['338331025300127745',_emoji('nope').id].includes(rea.emoji.id), {time:10e3, maxMatches:1}).catch(e=>[]);
			if (playerResponse[0]?.emoji?.id === '338331025300127745'){
				challengeFrame.embed.description = `Looks like ${player.name} is shooting one last time! Let's see...`
				challengeFrame.embed.image = { url: `${paths.CDN}/build/games/russian_roulette/load1_.gif` };
				await challenge.edit(challengeFrame);

				await wait(2);

				challengeFrame.embed.description += `\n\nAnytime now...  `
				await challenge.edit(challengeFrame);
			}else{
				challengeFrame.embed.image = {};
				challengeFrame.embed.description = `Looks like ${player.name} is a wuss. They're taking all your Rubines with them though.\n\n • ${_emoji('RBN')} **${value}** ${$t('keywords.RBN',{count:value})} added to your balance!`
				challenge.removeReactions();
				await challenge.edit(challengeFrame);
				
				if (!value) return;
				return await ECO.receive(player.id, value, "russianroulette.win");
			}

			await challenge.removeReactions();
			await userShoot(challenge,player);

			const died = await playerRoulette(player, game);
			if (died) { // Person died
				challengeFrame.embed.description += `BOOM! Oh sh*t *he's dead, Jim.*`;
				challengeFrame.embed.color = 0x521723;
				challengeFrame.embed.image.url = "https://media1.tenor.com/images/d2fcf092a1223a8060639182c5e85616/tenor.gif" //`${paths.CDN}/build/games/russian_roulette/shot_.gif`;
			} else { // Person did not die
				challengeFrame.embed.description = `${player.name} stands victorious like an absolute champion!\n\n • ${_emoji('RBN')} **${~~(value*1.5)}** ${$t('keywords.RBN',{count:value})} added to your balance!`;
				challengeFrame.embed.color = 0x32437d;
				challengeFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/win_.gif`;
			}
			
			challenge.removeReactions();
			await challenge.edit(challengeFrame);
		
			Progression?.emit("action.gambit",{userID: player.id, msg});
			if (!value) return;
			if (!died) await ECO.receive(players[0].id, ~~(value * 1.5), "russianroulette.gambit");
		}
		

		//if (voiceChannel) voiceChannel.once("end", () => PLX.leaveVoiceChannel(plxMessage.member.voiceState.channelID));
		return;
	}
	// There are more people in the game
	msg.channel.send({
		embed: {
			title: "End of the round!",
			description: `**Results:**\n${diedInRound ? `${diedInRound.name} was the loser. RIP.` : "No one died this time..."}\nStarting the next round.`,
			thumbnail: { url: `${paths.CDN}/build/games/russian_roulette/miniload.gif` },
		},
	}).then((m) => m.deleteAfter(2e3));

	return newRound(msg, players, round + 1);
};
// END

const init = async (msg, args) => {
	if (args[0] === "multiplayer" || args[0] === "mp" || args[0] === "start") {
		
		await msg.channel.send("Ok, multiplayer mode.\nTo join the match, just use `join <how many rubines you are using>`.\n"
			+ "**The match starts in __20 seconds__.**");
		const poolMsg = await msg.channel.send("**Total of rubines in the pool:** 0 rubines\n**Players**\n---")
		
		const verifiedPlayers = [];
		let hasBots = false;
		let minBet = 0;

		const filter = (m) =>
			(
				m.content.toLowerCase().startsWith("join ")
				//&& !m.author.bot // NOTE: could be turned into a feature though
				&& !verifiedPlayers.filter((a) => a.id === m.author.id)[0]
				&& !Number.isNaN(m.content.split(" ")[1])
				&& parseInt(m.content.split(" ")[1]) > 0
			)
			||
			(
				["start", "stop"].includes(m.content.toLowerCase())
				&& m.author.id === msg.author.id
			);

		//await msg.channel.awaitMessages(filter, {time: 60e3});
		const playerCollector = msg.channel.createMessageCollector(filter, { time: 60e3 });
	
		playerCollector.on('message', async joinMsg => {

			if (joinMsg.content === 'stop') return playerCollector.stop('abort');
			if (joinMsg.content === 'start') return playerCollector.stop('force_start');
			
			let userBet = parseInt(joinMsg.content.split(" ")[1]);

			if ( (minBet * .8) > userBet) return joinMsg.reply("Your bet can't be less than 20% under the average bet");
			const playerCanAfford = await ECO.checkFunds(joinMsg.author.id, userBet);			
			
         if (playerCanAfford){
								
				verifiedPlayers.push({
                id: joinMsg.author.id,
                name: joinMsg.author.username,
                money: joinMsg.author.bot ? 0 : userBet,
					 isBot: joinMsg.author.bot
            });

				minBet = verifiedPlayers.reduce((a,b)=> a + b.money, 0) / verifiedPlayers.length;

				if (joinMsg.author.bot) hasBots = true;
				poolMsg.edit(`**Total of rubines in the pool**: ${verifiedPlayers.map((a) => a.money).reduce((a, b) => a + b)} rubines\n`
				+ `**Players**\n${verifiedPlayers.map((a) => ` •	 **${a.name}** - ${a.money} rubines\n`).join("")}`)
			}else{
				joinMsg.reply('No funds')
			}
			
		})

		playerCollector.on('end', async (msgs,reason) => {
			
			console.log({reason},'stopCollectorRRoulette');

			if (reason==='abort') return msg.channel.send("Game cancelled by the creator.");

			verifiedPlayers?.forEach(player => {
				Progression.emit("play.russianroulette.friends", {
					valueSet: verifiedPlayers.length,
					userID: player.id,
					msg,
				});
			});

			if (verifiedPlayers.length === 1)
				return msg.channel.send("If only 1 person is going to play, you should use singleplayer mode.");
			if (verifiedPlayers.length === 0)
				return msg.channel.send("No one joined. I'm not playing this alone.");

			const initialMessage = await msg.channel.send({
				embed: {
					description: `**Time's up!** Let's get started.\nPlayers: \`\`\`${verifiedPlayers.map((a) => a.name).join(", ")}\`\`\``,
					image: { url: `${paths.CDN}/build/games/russian_roulette/load1_.gif` },
				},
			});
			await Promise.all(verifiedPlayers.map(plyr=>{
				return ECO.pay(plyr.id, plyr.money, "russianroulette.gambling");
			}));
			return newRound(msg, shuffle(verifiedPlayers), 0, initialMessage, hasBots);
		});

		return;
	}

	const BET = parseInt(args[0]);

	if (!BET) {
		return msg.reply(
			"you have to give me a number of how much rubines you are going to ~~waste~~ use, or you can use `multiplayer` to create a multiplayer game.",
		);
	}
	if (BET < 100) return msg.reply("You gotta bet at very least 100 RBN on thir");
	if (BET > 5000) return msg.reply("You can't put more than 5000 RBN at stake");

	const urf = await ECO.checkFunds(msg.author.id, BET);
	if (!urf) return msg.reply("you don't have all this money to waste with russian roulette.");

	const game = new RussianRoulette(msg, BET);

	await msg.channel.send("Russian Roulette? You probably already know the rules, so let's get started."
		+ `\nIf you survive this one, you're going to receive **${game.nextValue} rubines**.\n`
		+ "Use `shoot` to proceed (if you get shot, you'll lose your money).");
	Progression.emit("play.russianroulette.solo", { msg, userID: msg.author.id });
	return startGameCollector(game, msg, startGameCollector);
};

module.exports = {
	init,
	cmd: "russianroulette",
	pub: true,
	argsRequired: true,
	perms: 3,
	cat: "games",
	botPerms: ["attachFiles", "embedLinks", "manageMessages"],
	aliases: ["rr", "roletarussa"],
};


async function userShoot(msg,player){
	await msg.addReaction('Gun:338331025300127745');
	return Promise.race([
		msg.channel.awaitMessages(m=>m.author.id === player.id && ['bang','shoot','boom','pew'].includes(m.content),{time:10e3, maxMatches:1}),
		msg.awaitReactions(rea=> rea.userID === player.id && rea.emoji.id === '338331025300127745', {time:10e3, maxMatches:1}),
		( player.isBot ? wait( randomize(1,5) ) : wait(8))
	]);
}

