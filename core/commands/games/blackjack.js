// const DB = require('../../database/db_ops.js')
const Picto = require('../../utilities/Picto')
// const gear = require('../../utilities/Gearbox.js')
const deckManager = require("../inventory/decks.js")
const Blackjack = require('../../archetypes/Blackjack.js');
const _ASSETS = paths.BUILD + "games/blackjack/"
const ECO = require("../../archetypes/Economy.js")


const cardValue = card =>  new Object({rank : card.slice(0, -1) ,suit: card[card.length-1]});
const fetchCard = (card, deck) => {
	if (typeof card === 'string' && card.startsWith("JOKER")) 
		return Picto.getCanvas(`${paths.CDN}/build/cards/casino/JOKERS/${card.split("-")[1] || deck || "default"}.png`);	
	if (card[0] == "X") 
		return Picto.getCanvas(`${paths.CDN}/build/cards/casino/${deck || "default"}/backface.png`);

	const {rank,suit} = cardValue(card);           
	return Picto.getCanvas(`${paths.CDN}/build/cards/casino/${deck || "default"}/${suit}${rank}.png`);
}

const renderCard = (ctx,_cImg,_i,disp=0,glow=false) =>{
	ctx.rotate(-.15);
	let equation = (100-(disp>80?80:disp))
	ctx.drawImage(_cImg,equation * _i,40 + (_i * 1.5 * ( equation / 10)),143*2,160*2);
	//ctx.drawImage(_cImg,(54*2 - disp) * i,20*2 + (i * 1.5 * ((54*2 - disp) / 10)),143*2,160*2);
	ctx.shadowColor = glow ? '#eeff27' : '#3b3b4b';
	ctx.shadowBlur = 10;
	ctx.rotate(.15);
}

const renderHand = async (HANDS,deck,bjd,current) => {
	const IMG = Picto.new(800, 400);
	const ctx = IMG.getContext('2d');
	if (HANDS.length === 1) {
		let handImages = await Promise.all( HANDS[0].map( card => fetchCard(card,deck) ) );
		handImages.forEach((cardImg,i) => renderCard(ctx,cardImg,i,bjd) )
	} else {
		let displacement = 0;
		HANDS.forEach(async (hand,i)=>{
			let handImages = await Promise.all( hand.map( card => fetchCard(card,deck) ) );
			handImages.forEach((cardImg,i2) => {
				if(current && current !=hand ) ctx.translate(0, 100);
				renderCard(ctx,cardImg,displacement,(HANDS.length+1)*8+i*3 ,bjd)
				if(current && current !=hand ) ctx.translate(0,-100);
				displacement++
			})
			displacement+=1.5
		})
		/*
		if(current){
			Promise.all( current.map( card => fetchCard(card,deck) ) ).then(res=>{
				ctx.globalCompositeOperation = "source-over"
				res.forEach((cardImg,i) => renderCard(ctx,cardImg,i) )
			});
		}
		*/			
		if (HANDS.indexOf(current)>=0){
			//ctx.drawImage(Picto.tag(ctx,"Hand #"+HANDS.indexOf(current)+1,'14px "Corporate Logo Rounded"','#FFFFFF',{line:6}).item,30,0)
		}
	}
	return IMG
}

const drawTable  = async (PL, DL, DATA_A, DATA_B, drawOpts) => {

	let msg 	= drawOpts.m,
		bet 	= drawOpts.b,
		_PLAYER = drawOpts.p,
		_DEALER = drawOpts.d,
		_v 		= drawOpts.v;

	const SCENE = Picto.new(800, 600);
	const c = SCENE.getContext('2d');

	let SCORE_A = DATA_A.status + DATA_A.val,
		SCORE_B = DATA_B.val,
		bjkWIN	= SCORE_A.toString().toLowerCase() == "blackjack"
		bjkLOSE	= SCORE_B.toString().toLowerCase() == "blackjack",
		jkrWIN	= SCORE_A.toString().includes("JOKER"),
		jrkLOSE	= SCORE_B.toString().includes("JOKER")

	let RESULT = "Blackjack"
	let OUTCOME = "WIN"


	switch (true) {

		case bet <= 100:
			chips = 1
			break;
		case bet <= 500:
			chips = 2
			break;
		case bet <= 1000:
			chips = 3
			break;
		case bet <= 1500:
			chips = 4
			break;
		case bet <= 2000:
			chips = 5
			break;
		default:
			chips = 6
			break;
	}

	const [fel,chip,you,me,bjk,stando,joker] = await Promise.all([
		Picto.getCanvas(paths.Build + "/games/blackjack/feltro.png"),
		Picto.getCanvas(_ASSETS + "chips-" + chips + ".png"),
		drawOpts.enemyStando ? Picto.getCanvas(_ASSETS + "dio.png") : Picto.getCanvas(PLX.user.displayAvatarURL),
		Picto.getCanvas(msg.author.displayAvatarURL),
		bjkWIN 	? Picto.getCanvas(_ASSETS + "BLACKJACK-win.png") 
				: bjkLOSE 
					? Picto.getCanvas(_ASSETS + "BLACKJACK-lost.png") 
					: jkrWIN 
						? Picto.getCanvas(paths.Build + "games/blackjack/JOKER-win.png") :null,
		drawOpts.enemyStando ?  Picto.getCanvas(paths.BUILD + "STANDO.png") : null,
		jkrWIN ? Picto.getCanvas(paths.Build+"cards/casino/JOKERS/"+(SCORE_A.split('-')[1]||'default')+".png") : null
	]);
      

	c.drawImage(fel, 0, 0,800,600)
	c.drawImage(chip, 140*2, 170*2)

	//=================================
	c.drawImage(DL, -10*2, 180*2)
	c.translate(200*2, 150*2);
	c.rotate(180 * Math.PI / 180);
	c.translate(-200*2, -150*2);
	c.drawImage(PL, -10*2, 180*2)
	c.translate(200*2, 150*2);
	c.rotate(180 * Math.PI / 180);
	c.translate(-200*2, -150*2);
	//=================================


	c.drawImage(you, 8*2, 94*2, 60*2, 60*2);
	c.drawImage(me, 332*2, 124*2, 60*2, 60*2);

	let wid
	let name_p = Picto.tag(c, _PLAYER, "400 28px 'Corporate Logo Rounded'", "#fff")
	name_p.width > 100*2 ? wid = 100*2 : wid = name_p.width;
	c.drawImage(name_p.item, 324*2 - wid, 132*2, wid, name_p.height)

	let name_d = Picto.tag(c, _DEALER, "400 28px 'Corporate Logo Rounded'", "#fff")
	name_d.width > 100*2 ? wid = 100*2 : wid = name_d.width;
	c.drawImage(name_d.item, 16*2 + 60*2, 102*2, wid, name_d.height)

	let bet_img = Picto.tag(c, miliarize( bet ), "900 40px 'Whitney HTF'", "#e6d084")
	c.drawImage(bet_img.item, 110*2 - bet_img.width / 2, 170*2)
	let bet_txt = Picto.tag(c, _v.bet.toUpperCase(), "600 36px 'Whitney HTF'", "#4a8b45")
	c.drawImage(bet_txt.item, 110*2 - bet_txt.width / 2, 150*2)


	let num_p = Picto.tag(c, SCORE_A, "900 36px 'Whitney HTF',Sans", "#fff")
	c.drawImage(num_p.item, 324*2 - num_p.width, 129*2 + 20*2)

	let num_d = Picto.tag(c, SCORE_B, "900 36px 'Whitney HTF',Sans", "#fff")
	c.drawImage(num_d.item, 16*2 + 60*2, 99*2 + 20*2)

	let BUSTED = Picto.tag(c, _v.BUST.toUpperCase(), "900 40px 'Panton Black'", "#ea2e2e")
	
	c.rotate(-.5)
	if (Number(SCORE_B) > 21) c.drawImage(BUSTED.item,  40*2, 160*2);
	if (Number(SCORE_A) > 21) c.drawImage(BUSTED.item, 130*2, 250*2);
	c.rotate( .5)	

	if (jkrWIN) {
		c.drawImage(bjk, 0, 0,800,600)
		c.rotate(-25)
		c.drawImage(joker, 270*2, 00, 150*2, 178*2)
		c.rotate(25)
	}
	if (bjkWIN) {
		c.drawImage(bjk, 0, 0,800,600)
		c.drawImage(me, 328*2, 110*2, 60*2, 60*2)
	}
	if (bjkLOSE) {
		c.drawImage(bjk, 0, 0,800,600)
		c.drawImage(you, 8*2, 110*2, 60*2, 60*2)
	}


	drawOpts.enemyStando ? c.drawImage(stando, 0, 0,800,600) : null;

	return SCENE
}

const DECK 		 = async (msg,args) => {

	const USERDATA = await DB.users.get(msg.author.id);
	let P = {lngs:msg.lang}
	if (args[0] === "list") return deckManager.init(msg, args, "casino");
	
	if (["default", "vegas", "reset"].includes(msg.args[1])) {
		await DB.users.set(msg.author.id, { 'modules.skins.blackjack': 'default' });
		P.deckname = _emoji('plxcards').no_space+"`Vegas (default)`"
		return msg.channel.send(`${rand$t('responses.verbose.interjections.acknowledged')} ${$t('games.blackjack.switchdeck',P)} ${rand$t('responses.verbose.opinion_decks',P)}`)
	}

	const DECKDATA = await DB.cosmetics.find({ type: "skin", for: "casino" });
	if (!USERDATA.modules.skinInventory) {
		return msg.channel.send("You don't own any skins yet.");
	}
	
	targetDeck = DECKDATA.find(
		dck =>
			dck.localizer == args[0] ||
			dck.id == USERDATA.modules.skinInventory[args[0]] ||
			dck.name.toLowerCase().includes(args.join(' ').toLowerCase())
			) || null;
			
			if (targetDeck && USERDATA.modules.skinInventory.includes(targetDeck.id)) {
				await DB.users.set(msg.author.id, { 'modules.skins.blackjack': targetDeck.localizer });
				P.deckname =  _emoji('plxcards').no_space+"`"+targetDeck.name+"`";
				let deckSwitchMessage = `${rand$t('responses.verbose.interjections.acknowledged')} ${$t('games.blackjack.switchdeck',P)} ${rand$t('responses.verbose.opinion_decks',P)}`
				if(randomize(1,6) === 3 && $t('games.blackjack.switchdeckEgg',P).length > 1 ) deckSwitchMessage= `${rand$t('responses.verbose.interjections.acknowledged')} ${$t('games.blackjack.switchdeckEgg',P)} ${_emoji('plxOof')}`;
				return msg.channel.send(deckSwitchMessage)
	} else {
		return msg.channel.send("You don't own this deck yet.")
	}
}

const init       = async (msg,args) => {
		const USERDATA = await DB.users.get(msg.author.id);

		if (args[0] === "decks") return deckManager.init(msg, "casino");

		

		const powerups = USERDATA.modules.powerups || {};
		const myDeck = USERDATA.modules.skins?.blackjack || "default";

		let arg = args[0]

		const polluxNick = msg.guild.member(PLX.user).nick || "Pollux"
		const playerName = msg.member.nick || msg.author.username;

		const P = {lngs: msg.lang};
		const v = {}
			v.ONGOING = $t("games.blackjack.ongoing", P)
			v.NEWGAME = $t("games.blackjack.newgame", P)
			v.RESULT = $t("games.blackjack.result", P)
			v.BUST = $t("games.blackjack.bust", P)

			v.HAND = $t("games.blackjack.hand", P)

			v.HIT = $t("games.blackjack.hit", P)
			v.STAND = $t("games.blackjack.stand", P)
			v.SPLIT = $t("games.blackjack.split", P)
			v.DOUBLE_DOWN = $t("games.blackjack.doubledown", P).replace('double down', 'double')

			v._WIN = $t("games.blackjack.youwin", P)
			v._LOSE = $t("games.blackjack.youlose", P)
			v._JOKER = $t("games.blackjack.joker", "Oh no! The Joker! You're so lucky~", P)
			v._EVEN = $t("games.blackjack.even", P)
			v._PRIZE = $t("$.plus_rubines_generic", P)
			v._ANTIPRIZE = $t("$.minus_rubines_generic", P)

			v.bet = $t("dict.bet", P)

			v.insu = $t("$.insuBet", { lngs: msg.lang, number: 25 })
			v.nofunds = $t("$.noFundsBet", { lngs: msg.lang, number: USERDATA.modules.rubines })
			v.insuFloor = $t("$.insuFloor", { lngs: msg.lang, number: 25 })
			v.ceiling = $t("games.ceilingBet", { lngs: msg.lang, number: 2500 }).replace("%emj%", _emoji("rubine"))



		if (Blackjack.gameExists(msg.author.id)) {
			return msg.reply(v.ONGOING);
		}

		if (USERDATA.modules.rubines < 25) {
			P.number = USERDATA.modules.rubines;
			return msg.reply(v.insuFloor);
		}
		const bet = Math.abs(parseInt(arg));

		if(isNaN(bet)) {PLX.autoHelper('force',{cmd:'blackjack',msg,opt:'gambling'}); return};

		if (bet && bet < 25) {
			P.number = 25
			return msg.reply(v.insu);
		}

		if (USERDATA.modules.rubines < bet) return msg.reply(v.nofunds);
		if (bet > 2500) {
			P.number = 2500
			return msg.reply(v.ceiling);
		}

		const blackjack = new Blackjack(msg);
		
		return msg.channel.send(
			v.NEWGAME.replace("%usr%", msg.member.displayName).replace("%bt%", bet)
			).then(async () => {
				powerups.nojoker = true;
				const balance 	 = USERDATA.modules.rubines;
				const playerHand = blackjack.getHand(powerups);
				powerups.nojoker = false;
				const dealerHand = blackjack.getHand().map(card=> card.startsWith("JOKER") ? randomize(1,10)+"H" : card );
				let playerHands;
				
				const drawOptions = {
					v: v,
					b: bet,
					B: balance,
					p: playerName,
					d: polluxNick,
					m: msg
				}
				if(msg.author.id=="88120564400553984"){
					blackjack.deck[blackjack.deck.length-2]="JOKER-persona5"
					console.log(blackjack.deck.slice(55))
				}
				let playerHandValueCalc = Blackjack.handValue(playerHand);
				 
			if (playerHandValueCalc !== 'Blackjack' && !playerHandValueCalc.toString().includes("JOKER")) {
				playerHands = await getFinalHand(blackjack, playerHand, dealerHand, myDeck, powerups, drawOptions);
				const result = gameResult(Blackjack.handValue(playerHands[0]), 0);
				const noHit = playerHands.length === 1 && result === 'bust';
				
				while ((Blackjack.isSoft(dealerHand) || Blackjack.handValue(dealerHand) < 17) && !noHit) blackjack.hit(dealerHand,{nojoker:true});
			}else{
				playerHands = [playerHand];
			}			

		
	
			const dealerValue = Blackjack.handValue(dealerHand);
			let winnings = 0;
			let hideHoleCard = true;
			let multiHAND_DATA = []
			let result;

			const H_DATA = {}
			let doubles=0;
			let surrenders=0;
			let insurances=0;
			let insuranceAmount=0;
			let hasJoker = false;
			let gameJokers = []
      let splitExplain = []
 
      
      
			playerHands.forEach((hand, i) => {

        let calc_bet = bet 

				const playerValue = Blackjack.handValue(hand);
				result = gameResult(playerValue, dealerValue);

				if (result !== 'bust') hideHoleCard = false;
				doubles += hand.doubled?1:0;
        if(hand.surrendered) {
          surrenders++
          calc_bet = Math.ceil(calc_bet / 2)
          result = "surrender"
        }
        if(hand.insurance) {
          insurances++
          calc_bet = calc_bet - Math.ceil(calc_bet/2);
          insuranceAmount = Math.ceil(calc_bet/2);
        }

				const lossOrGain = Math.floor(
          (
            (["loss", "bust","surrender"].includes(result) ? -1 : result === "push" ? 0 : 1) *
            (hand.doubled ? 2 : 1) *
            (playerValue === "Blackjack"
              ? 1.5
              : playerValue.toString().includes("JOKER")
                ? 2
                : 1
            ) *
            calc_bet +
            (dealerValue === "Blackjack"
              ? insuranceAmount
              : -insuranceAmount
            )
          )
        );

				//winnings += lossOrGain;
				const soft = Blackjack.isSoft(hand);				
					H_DATA.num = i + 1
					H_DATA.val = playerValue
					H_DATA.status = soft ? "SOFT" : "";
					H_DATA.result = playerHands.length === 1 ? `** ${msg.member.displayName}**` : ` ${result.replace(/(^\w|\s\w)/g, ma => ma.toUpperCase())}${result !== 'push' ? `, ${lossOrGain}` : `, ${"Rubines"}"} back`}\n`
				multiHAND_DATA.push(H_DATA)
				winnings += Number(lossOrGain)
				if ( playerValue.toString().includes("JOKER") ) {
					hasJoker = true;
					gameJokers.push(playerValue.toString())
				}
				
				RESULT_EMOJI = (res) =>
          playerValue.toString().includes("JOKER")
            ? _emoji("plxbjkjkr")
            : playerValue == "Blackjack"
              ? _emoji("plxbjkbjk")
              : res == "push"
                ? _emoji("plxbjkpush")
                : res == "loss"
                  ? _emoji("plxbjkloss")
                  : res == "bust"
                    ? _emoji("plxbjkbust")
                    : res == "Dealer bust"
                      ? _emoji("plxbjkwin")
                      : res.toLowerCase() == "blackjack"
                        ? _emoji("plxbjkbjk")
                        : res.toLowerCase() == "surrender"
                          ? _emoji("plxbjksurr")
                          : _emoji("plxbjkwin");


				splitExplain.push(`${_emoji('plxcards').no_space}\`\u200b${((i+1)+"").padStart(2," ")}\` : **\`\u200b${(lossOrGain+"").padStart(6,' ')}\`** ${_emoji('RBN')} ${RESULT_EMOJI(result)}${hand.doubled?_emoji('plxbjk2x'):''} ${hand.insurance?_emoji('plxbjkinsur')+`${res.toLowerCase() == "blackjack"?"+":"-"}${insuranceAmount}` :""}`)
			});

			let POL_DATA = {}		
			POL_DATA.val = `${hideHoleCard ? Blackjack.handValue([dealerHand[0]]) : dealerValue}`
			let visihand = [dealerHand[0], ["X"]]

			let PLAY_RES = winnings === 0 ? v._EVEN : winnings > 0 ? v._WIN : v._LOSE
			if (Blackjack.handValue(playerHands[0]).toString().includes('JOKER')) PLAY_RES = v._JOKER;

			result === 'push' ? PLAY_RES = v._EVEN : PLAY_RES = PLAY_RES			
			result === 'surrender' ? PLAY_RES = v._SURR || "placeholder surrender text" : PLAY_RES = PLAY_RES

			const [POLLUX_HAND_GFX,PLAYER_HAND_GFX]= await Promise.all([
				renderHand(playerHands,  myDeck),
				renderHand([hideHoleCard ? visihand : dealerHand],  'default')
			]);

			if (winnings !== 0) {
				if (winnings > 0) {
					await ECO.receive(msg.author.id, winnings, "gambling_blackjack", "RBN");
				}
				if (winnings < 0) {
					await ECO.pay(msg.author.id, Math.abs(winnings), "gambling_blackjack", "RBN");
				}
			}
			drawOptions.b = bet*playerHands.length + doubles*bet
			let scenario = await drawTable(PLAYER_HAND_GFX, POLLUX_HAND_GFX, multiHAND_DATA[0], POL_DATA, drawOptions);
			let resp = winnings > 0 ? v._PRIZE : winnings < 0 ? v._ANTIPRIZE : ""
			let rebalance = resp.replace("%R%", _emoji("rubine") + Math.abs(winnings))

			//let ncanvas = Picto.new(800,600)
			//ncanvas.getContext('2d').drawImage(scenario,0,0,800,600);
			msg.channel.send(PLAY_RES, { file: scenario.toBuffer(), name: "blackjack.png" }).then(m => m.channel.send(rebalance).catch(() => null ))
			if(splitExplain.length > 1){
				msg.channel.send(`**${$t('games.blackjack.splitbreak',P)}**\n`+splitExplain.join('\n'))
			}

			// JOKER EFFECTS GO HERE
			if(hasJoker === true){

				gameJokers.forEach((JKR,i)=>{

					msg.channel.send("`"+JKR+"` eff -- immediate -- J:"+i+"/"+gameJokers.length);


				})

			}


		});


}

function gameResult(playerValue, dealerValue) {



	if (playerValue > 21) return 'bust';
	if (dealerValue > 21) return 'Dealer bust';
	if (playerValue === dealerValue) return 'push';
	if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';
	if (playerValue.toString().includes("JOKER") || playerValue > dealerValue) return 'win';

	return 'loss';
}

async function getFinalHand(blackjack, playerHand, dealerHand, deck, powerups, options) {

	let msg 	= options.m,
		balance = options.B,
		bet 	= options.b;

	const HIT_TXT	 = $t("games.blackjack.hit"		, {lngs: msg.lang})
	const DOUBLE_TXT = $t("games.blackjack.double"	, {lngs: msg.lang}).replace('double down', 'double')
	const SPLIT_TXT  = $t("games.blackjack.split"	, {lngs: msg.lang})
	const PASS_TXT 	 = $t("games.blackjack.pass"	, {lngs: msg.lang})
	
	const hands = [playerHand];
	let currentHand = hands[0];
	let totalBet = bet;
	
	async function ProcessHand(currentHand) {
		if (!currentHand) return Promise.resolve(true);
		const nextHand = () => currentHand = hands[hands.indexOf(currentHand) + 1];
	

		if (currentHand.length === 1) blackjack.hit(currentHand, powerups);
		if (Blackjack.handValue(currentHand) === 'Blackjack') {
			nextHand();
			return ProcessHand(currentHand);
			//continue;
		}
		let currentHandValue = Blackjack.handValue(currentHand);
		
		if ( typeof currentHandValue == 'string' && currentHandValue.startsWith("JOKER") ) {
			nextHand();
			return ProcessHand(currentHand);
			//continue;
		}
		if ( currentHandValue >= 21) {
			nextHand();
			return ProcessHand(currentHand);
			//continue;
		}
		if (currentHand.doubled) {
			blackjack.hit(currentHand); 
			nextHand();
			return ProcessHand(currentHand);
			//continue;
		}

		const canInsurance =
				balance >= totalBet + Math.ceil(bet/2)
				&& dealerHand[0].includes("A")
				&& currentHand.length === 2;
		const canDoubleDown = 
				balance >= totalBet + bet
				&& currentHand.length === 2;
		const canSplit 		= 
				balance >= totalBet + bet
				&& Blackjack.handValue([currentHand[0]]) === Blackjack.handValue([currentHand[1]])
				&& currentHand.length === 2;

		let hitstand = !canDoubleDown && !canSplit ?
			HIT_TXT + PASS_TXT :
			`${HIT_TXT} ${canDoubleDown
				? DOUBLE_TXT
				: ''}${canSplit
					? SPLIT_TXT : ''}${PASS_TXT}`

		let USR_HAND = {}, POL_HAND = {};

		USR_HAND.val 	= Blackjack.handValue(currentHand)
		POL_HAND.val 	= Blackjack.handValue([dealerHand[0]])

		USR_HAND.status = Blackjack.isSoft(currentHand) 	? "SOFT" : "";
		POL_HAND.status = Blackjack.isSoft([dealerHand[0]]) ? "SOFT" : "";

		let visibleHand = [dealerHand[0], ["X"]]
		let bjkP = USR_HAND.val.toString().toLowerCase() == "blackjack"
		let bjkD = POL_HAND.val.toString().toLowerCase() == "blackjack"
		let errored;
		const [POLLUX_HAND_GFX,PLAYER_HAND_GFX]= await Promise.all([
			renderHand(hands, deck 	 ,bjkD,currentHand),			 
			renderHand([visibleHand], 'default',bjkP)
		]).timeout(1000).catch(e=> {errored = true; return [e,0] } );
		if (errored) Promise.reject("Error during checks => \n"+POLLUX_HAND_GFX);


		options.b = totalBet
		let scenario = await drawTable(PLAYER_HAND_GFX, POLLUX_HAND_GFX, USR_HAND, POL_HAND, options).catch(e=>Picto.new(0,0));
		//let ncanvas = Picto.new(800,600)
		//ncanvas.getContext('2d').drawImage(scenario,0,0,800,600);

		msg.channel.send('', { file: scenario.toBuffer(), name: "blackjack.png" }).then(m => m.channel.send(hitstand)); 

		const responses = await msg.channel.awaitMessages(msg2 =>
			msg2.author.id === msg.author.id && (
				msg2.content === 'hit' 	     ||
				msg2.content === 'stand'     ||				
				msg2.content === 'STANDO'    ||
				msg2.content === 'stando'    ||
				msg2.content === 'surrender' ||
				(msg2.content === 'insurance'   && canInsurance)  ||
				(msg2.content === 'split' 		&& canSplit) 	  ||
				(msg2.content === 'double down' && canDoubleDown) ||
				(msg2.content === 'double' 		&& canDoubleDown)
			), {
				maxMatches: 1,
				time: 30e3
			}
		);
		
		if (responses.length === 0) return Promise.resolve(false);
		const action = responses[0].content.toLowerCase()
			
		if(action === 'insurance'){
			currentHand.insurance = true;
			totalBet +=  Math.ceil(totalBet/2);
		}
		if(action === 'surrender'){
			currentHand.surrendered = true;
			totalBet = Math.ceil(totalBet/2);
			if (currentHand === hands[hands.length - 1]) return Promise.resolve("EndGame");
			nextHand();
		}

		if (action == "stando") {
			options.enemyStando = true;
			msg.channel.send( $t("eastereggs.konodioda", {lngs:msg.lang}) )
		}
		if (action === 'stando' || action === 'stand' || Blackjack.handValue(currentHand) >= 21) {
			if (currentHand === hands[hands.length - 1]) return Promise.resolve("EndGame");
			nextHand();
		}
		if (action === 'hit') blackjack.hit(currentHand);
		if (action === 'split' && canSplit) {
			totalBet += bet;
			hands.push([currentHand.pop()]);
			blackjack.hit(currentHand);
		}
		if ((action === 'double down' || action === 'double') && canDoubleDown) {
			totalBet += bet;
			currentHand.doubled = true;
		}
		return ProcessHand(currentHand);
	}

	await ProcessHand(currentHand);
	return hands;	
}
let hooks = PLX.commandOptions.defaultCommandOptions.hooks;
hooks.postExecution = (msg)=>	(new Blackjack(msg)).endGame();

module.exports = {
	init,
	pub: true,
	cmd: 'blackjack',
	argsRequired:true,
	perms: 3,
	cat: 'gambling',
	cooldown: 5000,
	hooks,
	aliases: ['bjk'],
	teleSubs:[
		{label: 'decks', path:'inventory/decks', pass:"casino"}
	],
	autoSubs:[
		{
			label: "deck",
			gen: DECK,
			options: {
				argsRequired:true,
				invalidUsageMessage:  (msg)=> {PLX.autoHelper( 'force', {msg, cmd: "decks", opt: "cosmetics" } )}
			}
		}
	]
};