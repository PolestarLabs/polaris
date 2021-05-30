const STRINGS = (P) => {
	
	P.RBN_emoji = _emoji('RBN');
	P.emojiNope = _emoji('nope');
	
	P.playersList = `\`\`\`${P.verifiedPlayers?.map((a) => a.name).join(", ")}\`\`\``;
	P.totalBetTally = P.verifiedPlayers?.map((a) => a.money).reduce((a, b) => a + b) || 0;
	P.tokaiValue = ~~(P.value*1.5);
	P.minBet20 = ~~(P.minBet*.8)||0;
	P.rubines = $t('keywords.RBN',{count:P.value});
	P.died_in_round = P.diedInRound ? $t("games.rrlt.mp_round_results_died" , P) : $t("games.rrlt.mp_round_results_no_dead" , P);
	
	const v = {
		singleplayer_no_bet: $t("games.rrlt.singleplayer_no_bet" , P),
		singleplayer_no_funds: $t("games.rrlt.singleplayer_no_funds" , P),
		min_bet: $t("games.rrlt.min_bet" , P),
		max_bet: $t("games.rrlt.max_bet" , P),
		singleplayer_instructions: $t("games.rrlt.singleplayer_instructions" , P),
		singleplayer_timeout: $t("games.rrlt.singleplayer_timeout" , P),
		singleplayer_quit: $t("games.rrlt.singleplayer_quit" , P),
		singleplayer_pre_message: $t("games.rrlt.singleplayer_pre_message" , P),
		singleplayer_ded: $t("games.rrlt.singleplayer_ded" , P),
		singleplayer_no_bullet_final: $t("games.rrlt.singleplayer_no_bullet_final" , P),
		singleplayer_no_bullet_full: $t("games.rrlt.singleplayer_no_bullet_full" , P),
		footer_instruction: $t("games.rrlt.footer_instruction" , P),
		mp_player_turn: $t("games.rrlt.mp_player_turn" , P),
		mp_ded: $t("games.rrlt.mp_ded" , P),
		mp_no_bullet: $t("games.rrlt.mp_no_bullet" , P),
		mp_intro: $t("games.rrlt.mp_intro" , P),
		mp_pool: $t("games.rrlt.mp_pool" , P),
		mp_no_20_under: $t("games.rrlt.mp_no_20_under" , P),
		mp_pool_tally: $t("games.rrlt.mp_pool_tally" , P), 		//FIXME
		mp_no_funds: $t("games.rrlt.mp_no_funds" , P),
		mp_abort_player: $t("games.rrlt.mp_abort_player" , P),
		switch_to_singleplayer: $t("games.rrlt.switch_to_singleplayer" , P),
		mp_no_players: $t("games.rrlt.mp_no_players" , P),
		mp_players_list: $t("games.rrlt.mp_players_list" , P),
		round_no: $t("games.rrlt.round_no" , P),
		bot_shame: $t("games.rrlt.bot_shame" , P),
		bot_megashame: $t("games.rrlt.bot_megashame" , P),
		bot_no_gambit: $t("games.rrlt.bot_no_gambit" , P),
		victor_tokai: $t("games.rrlt.victor_tokai" , P), 		//FIXME
		victor: $t("games.rrlt.victor" , P),					//FIXME
		victor_gambit: $t("games.rrlt.victor_gambit" , P),
		gambit: $t("games.rrlt.gambit" , P),
		gambit_prompt: $t("games.rrlt.gambit_prompt" , P),
		gambit_pre: $t("games.rrlt.gambit_pre" , P),
		gambit_anytime: $t("games.rrlt.gambit_anytime" , P),
		gambit_refuse: $t("games.rrlt.gambit_refuse" , P),
		hes_ded_jim: $t("games.rrlt.hes_ded_jim" , P),
		mp_round_end: $t("games.rrlt.mp_round_end" , P),
		mp_round_results: $t("games.rrlt.mp_round_results" , P),	//FIXME
	};

 
 


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
	const verifiedPlayers = [];
	const poolEmbed = {
		description: v.mp_pool_tally,
		fields:[
			{name:"Players", value: `${
				verifiedPlayers?.map((a) => ` • <@${a.id}> - ${_emoji("RBN")} **${a.money}** \n`).join("") 
				|| `${_emoji('loading') } Waiting...`
			}`}
		]
	}
	const poolMsg = await msg.channel.send({
		embed:poolEmbed,
		components: msg.setButtons( [
			{label: "Start", emoji:{name:"🔫"},disabled:true,style:1,custom_id:`rrStart`},
			{label: "Abort", emoji:{name:"🔫"},disabled:false,style:4,custom_id:`rrStop`},
		] ,1) // 1 = dry-run
	});

	
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
	const buttonCollector = poolMsg.createButtonCollector((i,d)=>i.userID===msg.author.id,{maxMatches: 1, time: 60e3});	

	buttonCollector.on("click",(b)=> b.id === "rrStart" ? playerCollector.stop("force_start") : playerCollector.stop('abort') );
	playerCollector.on('message', async (joinMsg) => {

		if (joinMsg.content === 'stop'){
			buttonCollector.stop('abort');
			return playerCollector.stop('abort');
		}
		if (joinMsg.content === 'start'){
			buttonCollector.stop('force_start');
			return playerCollector.stop('force_start');
		}

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

			minBet = ~~(verifiedPlayers.reduce((a, b) => a + b.money, 0) / verifiedPlayers.length);

			if (joinMsg.author.bot) hasBots = true;
				console.log({verifiedPlayers})
			v = STRINGS({lngs:msg.lang, verifiedPlayers, minBet});

			poolEmbed.description = v.mp_pool_tally;
			poolEmbed.fields[0].value = `${verifiedPlayers?.map((a) => ` • <@${a.id}> - ${_emoji("RBN")} **${a.money}** \n`).join("") || '---'}`
			poolMsg.edit({embed:poolEmbed});
			if (verifiedPlayers.length > 1) poolMsg.enableButtons("all");
		} else {
			joinMsg.reply(v.mp_no_funds).then(m=> m.deleteAfter(5) && joinMsg.deleteAfter(5).catchReturn() );
		}

	});
	playerCollector.on('end', async (msgs, reason) => {

		console.log({ reason }, 'stopCollectorRRoulette');

		if (reason === 'abort'){
			  await poolMsg.edit({content: v.mp_abort_player, embed: null});
			return msg.channel.send( v.mp_abort_player);
		}

		verifiedPlayers?.forEach(player => {
			Progression.emit("play.russianroulette.friends", {
				valueSet: verifiedPlayers.length,
				userID: player.id,
				msg,
			});
		});

		if (verifiedPlayers.length === 1) {
			msg.channel.send(v.switch_to_singleplayer);
			return startSinglePlayer(msg);
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
	//await msg.addReaction('Gun:338331025300127745');
	await msg.setButtons({emoji:{id:"338331025300127745"},label:"Fire!",custom_id:"shoot!",style:4});
	return Promise.race([
		msg.channel.awaitMessages(m=>m.author.id === player.id && ['bang','shoot','boom','pew'].includes(m.content),{time:10e3, maxMatches:1}),
		msg.awaitReactions(rea=> rea.userID === player.id && rea.emoji.id === '338331025300127745', {time:10e3, maxMatches:1}),
		msg.awaitButtonClick(click=> click.userID === player.id && click.id === 'shoot!', {time:10e3, maxMatches:1}),
		( player.isBot ? wait( randomize(11,15) ) : wait(8))
	]);
}

