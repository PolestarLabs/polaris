const STRINGS = (P) => {
	const v = {};
	v.singleplayer_no_bet =
		 "you have to give me a number of how much rubines you are going to ~~waste~~ use, or you can use `multiplayer` to create a multiplayer game.";
	v.singleplayer_no_funds = "you don't have all this money to waste with russian roulette.";
	v.min_bet = "You gotta bet at very least 100 RBN on thir";
	v.max_bet = "You can't put more than 5000 RBN at stake";
	v.singleplayer_instructions = 
		"Russian Roulette? You probably already know the rules, so let's get started."
		+ `\nIf you survive this one, you're going to receive **${P.Game.nextValue} rubines**.\n`
		+ "Use `shoot` to proceed (if you get shot, you'll lose your money)."

	v.singleplayer_timeout = "you haven't said your action in 30 seconds! Stopping the game.";
	v.singleplayer_quit = `You're a quitter!\n I added **${P.Game.currentPayout} rubines** to your account. Sigh.`;
	v.singleplayer_pre_message = "Let's see if you're going to die now...";
	v.singleplayer_ded = "BOOM! Someone got shot...\nYou lost your money. RIP.";
	v.singleplayer_no_bullet_final = `**no bullet noise**\nYou came out alive of the game...\nI added **${P.Game.currentPayout}** rubines to your account.`
	v.singleplayer_no_bullet_full = 
		`**no bullet noise**\nNo bullet this time (${P.result.rounds} rounds remaining)...\n`
		+ `You currently have **${P.Game.currentPayout} rubines.**\n`
		+ "Use `shoot` to test your luck one more time (if you don't get shot, I'm going to add more money to your current amount)\n"
		+ "Use `stop` to stop here and get your money.";
	v.footer_instruction =  `Say "shoot" or click the gun to fire! (8s)`;
	v.mp_player_turn = `${P.player.name}'s turn.... `;
	v.mp_ded = `BOOM! ${P.player.name} is dead.`;
	v.mp_no_bullet = "*no bullet noise*\n";
	v.mp_intro = 
		"Ok, multiplayer mode.\nTo join the match, just use `join <how many rubines you are using>`.\n"
		+ "**The match starts in __20 seconds__.**";

	v.mp_pool = "**Total of rubines in the pool:** 0 rubines\n**Players**\n---";
	v.mp_no_20_under = "Your bet can't be less than 20% under the average bet";
	v.mp_pool_tally = 
		`**Total of rubines in the pool**: ${P.verifiedPlayers.map((a) => a.money).reduce((a, b) => a + b)} rubines\n`
		+ `**Players**\n${P.verifiedPlayers.map((a) => ` •	 **${a.name}** - ${a.money} rubines\n`).join("")}`;
	v.mp_no_funds = "No Funds";
	v.mp_abort_player = "Game cancelled by the creator.";
	v.switch_to_singleplayer = "Looks like only one person is gonna play. Switching to singleplayer mode...";
	v.mp_no_players = "No one joined. I'm not playing this alone.";
	v.mp_players_list = `**Time's up!** Let's get started.\nPlayers: \`\`\`${P.verifiedPlayers.map((a) => a.name).join(", ")}\`\`\``;
	v.round_no = `**Round ${P.round}**\n`;
	v.bot_shame = "Did y'all lose to a **bot**???";
	v.bot_megashame = `${P.player.name} stands victorious! You guys suck...`;
	v.bot_no_gambit = "Matches with bot participants aren't eligible for Winner's Gambit.";
	
	v.victor_tokai = `\n\n • ${_emoji('RBN')} **${~~(P.value*1.5)}** ${$t('keywords.RBN',{count:P.value})} added to your balance!`;
	v.victor = `${P.player.name} stands victorious!\n\n • ${_emoji('RBN')} **${P.value}** ${$t('keywords.RBN',{count:P.value})} added to your balance!`
	v.victor_gambit = `${P.player.name} stands victorious like an absolute champion!`;
	
	v.gambit = `<@${P.player.id}> **Winner's Gambit:** Try one last time for a 150% prize?`;
	v.gambit_prompt = `Click the <:Gun:338331025300127745> to accept. Otherwise click ${_emoji('nope')}`;
	v.gambit_pre = `Looks like ${P.player.name} is shooting one last time! Let's see...`;
	v.gambit_anytime = "Anytime now...";
	v.gambit_refuse = `Looks like ${P.player.name} is a wuss. They're taking all your Rubines with them though.\n\n • ${_emoji('RBN')} **${P.value}** ${$t('keywords.RBN',{count:P.value})} added to your balance!`;
	v.hes_ded_jim = `BOOM! Oh sh*t *he's dead, Jim.*`;

	v.mp_round_end = "End of the round!";
	v.mp_round_results =  `**Results:**\n${P.diedInRound ? `${P.diedInRound.name} was the loser. RIP.` : "No one died this time..."}\nStarting the next round.`;

	return v;
}



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

const startSinglePlayer = async (msg,args) => {

	let v = STRINGS({lngs:msg.lang});

	const BET = parseInt(args[0]);

	if (!BET) {
		return msg.reply( v.singleplayer_no_bet );
	}
	if (BET < 100) return msg.reply(v.min_bet);
	if (BET > 5000) return msg.reply(v.max_bet);

	const hasFunds = await ECO.checkFunds(msg.author.id, BET);
	if (!hasFunds) return msg.reply(v.singleplayer_no_funds);

	const Game = new RussianRoulette(msg, BET);
	v = STRINGS({lngs:msg.lang, Game});

	await msg.channel.send(v.singleplayer_instructions);
	Progression.emit("play.russianroulette.solo", { msg, userID: msg.author.id });

	const startGameCollector = async () => {
		const response = await msg.channel.awaitMessages(
			(m) => m.author.id === msg.author.id && ["shoot", "stop"].includes(m.content.toLowerCase()),
			{time: 10e3, maxMatches: 1}
		);

		if (!response[0]) return msg.reply(v.singleplayer_timeout);

		const result = await Game.handleInput(response[0].content);

		if (result.stopped) {
			await ECO.receive(msg.author.id, Game.currentPayout - BET, "gambling_russroll");
			return msg.channel.send(v.singleplayer_quit);
			// return msg.channel.send(result.better
			//   ? `You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.`
			//   : "You're a quitter!\nI haven't changed anything because you didn't even played.");
		}

		const gameMessage = await msg.channel.send(v.singleplayer_pre_message);
		if (result.lost) {
			await ECO.pay(msg.author.id, BET, "russianroulette.gambling");
			return gameMessage.edit(v.singleplayer_ded);
		} if (result.won) {
			await ECO.receive(msg.author.id, Game.currentPayout - BET, "russianroulette.win");
			return gameMessage.edit(v.singleplayer_no_bullet_final);
		}

		v = STRINGS({lngs:msg.lang, Game, result});
		await gameMessage.edit(v.singleplayer_no_bullet_full);

		return startGameCollector();
	}
	return startGameCollector();
};

// START
// Does member die?
const playerRoulette = async (player, game) => {
	const rst = game.handleInput("shoot");
	return !!rst.lost;
};

const handlePlayers = async (msg, players, Game, gameFrame) => {

	let v = STRINGS({lngs:msg.lang, Game, players, verifiedPlayers:players});
	//let voiceChannel = msg.member.voiceState.channelID;
	//voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
	let deadInThisRound = null;
	for (const index in players) { // eslint-disable-line guard-for-in

		await wait(1);

		//if (voiceChannel) voiceChannel.stopPlaying();
		const player = players[index];
		let v = STRINGS({lngs:msg.lang, Game, players, verifiedPlayers:players, player});

		// No one is dead so far

		gameFrame.embed.description += v.mp_player_turn;
		gameFrame.embed.footer = {text: v.footer_instruction }
		//if (voiceChannel) voiceChannel.play(click);
		// gameFrame.embed.image.url = ""// `${paths.CDN}/build/games/russian_roulette/load1_.gif`
		const died = player.isBot || await playerRoulette(player, Game);
		await msg.edit(gameFrame); // Next person, edit message and wait 3 seconds

		await userShoot(msg,player);


		// Fire. Check if they're dead

		if (died) { // Person died
			deadInThisRound = player; // This is the person who died
			players.splice(index, 1); //  Person should be removed from array
			gameFrame.embed.description += v.mp_ded;
			gameFrame.embed.color = 0x521723;
			gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/shot_.gif`;
		} else { // Person did not die
			gameFrame.embed.description += v.mp_no_bullet;
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

	// End of round
	await wait(3);
	return deadInThisRound;
};
// END




const init = async (msg, args) => {

	const P = {lngs: msg.lang};

	if (args[0] === "multiplayer" || args[0] === "mp" || args[0] === "start") {

		return await startMultiplayerGame(msg);
	}




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


async function startMultiplayerGame(msg) {

	let v = STRINGS({lngs:msg.lang});

	await msg.channel.send(v.mp_intro);
	const poolMsg = await msg.channel.send(v.mp_pool);

	const verifiedPlayers = [];
	let hasBots = false;
	let minBet = 0;

	const filter = (m) => (
		m.content.toLowerCase().startsWith("join ")
		//&& !m.author.bot // NOTE: could be turned into a feature though
		&& !verifiedPlayers.filter((a) => a.id === m.author.id)[0]
		&& !Number.isNaN(m.content.split(" ")[1])
		&& parseInt(m.content.split(" ")[1]) > 0
	) || (
		["start", "stop"].includes(m.content.toLowerCase())
		&& m.author.id === msg.author.id
	);

	//await msg.channel.awaitMessages(filter, {time: 60e3});
	const playerCollector = msg.channel.createMessageCollector(filter, { time: 60e3 });

	playerCollector.on('message', async (joinMsg) => {

		if (joinMsg.content === 'stop')
			return playerCollector.stop('abort');
		if (joinMsg.content === 'start')
			return playerCollector.stop('force_start');

		let userBet = parseInt(joinMsg.content.split(" ")[1]);

		if ((minBet * .8) > userBet)
			return joinMsg.reply(v.mp_no_20_under);
		const playerCanAfford = await ECO.checkFunds(joinMsg.author.id, userBet);

		if (playerCanAfford) {

			verifiedPlayers.push({
				id: joinMsg.author.id,
				name: joinMsg.author.username,
				money: joinMsg.author.bot ? 0 : userBet,
				isBot: joinMsg.author.bot
			});

			minBet = verifiedPlayers.reduce((a, b) => a + b.money, 0) / verifiedPlayers.length;

			if (joinMsg.author.bot) hasBots = true;
			
			v = STRINGS({lngs:msg.lang, players, verifiedPlayers:players});
			poolMsg.edit(v.mp_pool_tally);
		} else {
			joinMsg.reply(v.mp_no_funds).then(m=> m.deleteAfter(5) && joinMsg.deleteAfter(5).catchReturn() );
		}

	});
	playerCollector.on('end', async (msgs, reason) => {

		console.log({ reason }, 'stopCollectorRRoulette');

		if (reason === 'abort')
			return msg.channel.send(v.mp_abort_player);

		verifiedPlayers?.forEach(player => {
			Progression.emit("play.russianroulette.friends", {
				valueSet: verifiedPlayers.length,
				userID: player.id,
				msg,
			});
		});

		if (verifiedPlayers.length === 1) {
			msg.channel.send(v.switch_to_singleplayer);
			return startSinglePlayer();
		}

		if (verifiedPlayers.length === 0)
			return msg.channel.send(v.mp_no_players);

		const initialMessage = await msg.channel.send({
			embed: {
				description: v.mp_players_list,
				image: { url: `${paths.CDN}/build/games/russian_roulette/load1_.gif` },
			},
		});
		await Promise.all(verifiedPlayers.map(plyr => {
			return ECO.pay(plyr.id, plyr.money, "russianroulette.gambling");
		}));
		return processRound(shuffle(verifiedPlayers), 1, initialMessage, hasBots);
	});

	async function processRound(players, round = 1, initialMessage) {
		// Initialise game
		//let voiceChannel = msg.member.voiceState.channelID;
		//voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
		//if (voiceChannel) voiceChannel.play(gunRoll);
		await wait(2);

		
		const value = players.map((a) => a.money).reduce((a, b) => a + b);
		const Game = new RussianRoulette(null, 0);

		let v = STRINGS({lngs:msg.lang, Game, players, verifiedPlayers:players, round, value});

		const gameFrame = {
			embed: {
				title: v.round_no,
				description: "",
				image: { url: "" },
				color: 0x2b2b3b,
			},
		};

		// Actual rounds
		const gameMessage = await msg.channel.send(gameFrame);
		const diedInRound = await handlePlayers(gameMessage, players, Game, gameFrame);
		await gameMessage.deleteAfter(5).catchReturn();

		// Is there 1 person left?
		if (players.length === 1) { // This person wins

			const player = players[0];
			initialMessage.delete().catchReturn();
			gameFrame.embed.footer = {};

			v = STRINGS({lngs:msg.lang, Game, player, players, verifiedPlayers:players, round, value});

			await wait(3);

			if (player.isBot){
				gameFrame.embed.title = v.bot_shame;
				gameFrame.embed.description = v.bot_megashame;
				gameFrame.embed.color = 0x608a6d;
				gameFrame.embed.image.url = "http://1.bp.blogspot.com/-n7NmKmr60ts/U4JaTVi5pbI/AAAAAAAAH30/0OuS6MUxyN8/s1600/Robocop+7.gif";

				return await msg.channel.send(gameFrame);

			}else{

				if (hasBots){
					if (value) await ECO.receive(players[0].id, value, "russianroulette.win");
					return msg.channel.send({
						content: v.bot_no_gambit,
						embed:{
							description: v.victor,
							color: 0x32437d,
							image: {
								url: `${paths.CDN}/build/games/russian_roulette/win_.gif`
							}
						}
					});
				}

				const challengeFrame = {
					content: v.gambit,
					embed: {
						description: v.gambit_prompt
					}
				};

				const challenge = await msg.channel.send(challengeFrame);
				await challenge.addReaction("Gun:338331025300127745");
				await challenge.addReaction(_emoji('nope').reaction);

				const playerResponse = await challenge.awaitReactions(rea=> rea.userID === player.id && ['338331025300127745',_emoji('nope').id].includes(rea.emoji.id), {time:10e3, maxMatches:1}).catch(_e=>[]);
				if (playerResponse[0]?.emoji?.id === '338331025300127745'){
					challengeFrame.embed.description = v.gambit_pre
					challengeFrame.embed.image = { url: `${paths.CDN}/build/games/russian_roulette/load1_.gif` };
					await challenge.edit(challengeFrame);

					await wait(2);

					challengeFrame.embed.description += `\n\n${v.gambit_anytime}  `
					await challenge.edit(challengeFrame);
				}else{
					challengeFrame.embed.image = {};
					challengeFrame.embed.description = v.gambit_refuse;
					challenge.removeReactions();
					await challenge.edit(challengeFrame);

					if (!value) return;
					return await ECO.receive(player.id, value, "russianroulette.win");
				}

				await challenge.removeReactions();
				await userShoot(challenge,player);

				const died = await playerRoulette(player, Game);
				if (died) { // Person died
					challengeFrame.embed.description += v.hes_ded_jim;
					challengeFrame.embed.color = 0x521723;
					challengeFrame.embed.image.url = "https://media1.tenor.com/images/d2fcf092a1223a8060639182c5e85616/tenor.gif" //`${paths.CDN}/build/games/russian_roulette/shot_.gif`;
				} else { // Person did not die
					challengeFrame.embed.description = v.victor_gambit;
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
				title: v.mp_round_end,
				description: v.mp_round_results,
				thumbnail: { url: `${paths.CDN}/build/games/russian_roulette/miniload.gif` },
			},
		}).then((m) => m.deleteAfter(2e3));

		return processRound(players, round++);
	};
}

async function userShoot(msg,player){
	await msg.addReaction('Gun:338331025300127745');
	return Promise.race([
		msg.channel.awaitMessages(m=>m.author.id === player.id && ['bang','shoot','boom','pew'].includes(m.content),{time:10e3, maxMatches:1}),
		msg.awaitReactions(rea=> rea.userID === player.id && rea.emoji.id === '338331025300127745', {time:10e3, maxMatches:1}),
		( player.isBot ? wait( randomize(1,5) ) : wait(8))
	]);
}

