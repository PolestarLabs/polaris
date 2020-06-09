const Discoin = require('../../archetypes/Discoin');
const ECO = require('../../archetypes/Economy');
const CFG = require('../../../config.json');
const DCN = new Discoin(CFG.discoin);
const DEmojis = require(appRoot + "/resources/lists/discoin.json").emojis;
const Picto =  require('../../utilities/Picto');

const tax = .15;
const perMin = null;
const perMax = null;
const dailyMax = null;

function getParams(args) {
	let amount = null, currency = null;

	if (parseInt(args[0]) && args[1]?.length === 3) {
		amount = parseInt(args[0]);
		currency = args[1].toUpperCase();
	} else if (args[0]?.length === 3 && parseInt(args[1])) {
		amount = parseInt(args[1]);
		currency = args[0].toUpperCase();
	}

	return { amount, currency };
}

async function isAllowed(user, amount) {
	if (perMin && amount < perMin) return { allowed: false, reason: "perMin" };
	if (perMax && amount > perMax) return { alowed: false, reason: "perMax" };
	if (!dailyMax) return { allowed: true };

	const nd = new Date();
	const date = new Date(nd.setDate(nd.getDate() - 1)).toJSON();
	const filter = `{"from.id": "RBN", "user": "${user}", "timestamp": {"$gt": "${date}"}}`;

	return DCN.fetch(filter).then(transactions => {
		transactions = JSON.parse(transactions);
		if (!transactions) return { allowed: true };
		if ((transactions.reduce((a, b) => a + parseFloat(b.amount), 0) + amount) / (1 - tax) > dailyMax)
			return { allowed: false, reason: "dailyMax" };

		return { allowed: true };
	}).catch(e => {
		console.log(e);
		return { allowed: false, reason: "error" };
	});
}

const init = async function(msg,args){

	const genURL = "https://pollux.gg/generators/discoin/exchange.png?id=";

	let P={lngs:msg.lang,prefix:msg.prefix};
	if(PLX.autoHelper([$t("helpkey",P)],{cmd:this.cmd,msg,opt:this.cat}))return;


	let Rates;
	try {
		Rates = JSON.parse(await DCN.rates());
	} catch (e) {
		return msg.reply($t("responses.discoin.unreachable",P));
	}
	const DiscoinCurrencies = await DCN.currencies();
	let RBN = Rates.find(r=>r.id === "RBN");
	const canvas = Picto.new(715,600);
	const ctx    = canvas.getContext('2d');
	const textMode = args.length === 1 && args[0] === '-t';

	const homeCurrency = DiscoinCurrencies.find(c=>c.id === "RBN");
	const homeEmojiPic = await Picto.getCanvas(`https://cdn.discordapp.com/emojis/${homeCurrency.emoji}.png`);


	const embed = { fields: [], image:{url:'attachment://discoin.png'} };
	embed.color = 0xff3355;
	let empty = {name:'\u200b',value:'\u200b',inline:true};

	const { amount, currency } = getParams(args);

	if (amount && currency) {
		if (amount < 0) return msg.reply($t("responses.discoin.debt",P));
		if (amount == 0) return msg.reply($t("responses.discoin.zero",P));

		const check = await isAllowed(msg.author.id, amount);
		if (!check.allowed) {
			switch (check.reason) {
				case "perMax":
					return msg.reply($t("responses.discoin.perMax",{ ...P, perMax }));
				case "dailyMax":
					return msg.reply($t("responses.discoin.dailyMax",{ ...P, dailyMax }));
				case "perMin":
					return msg.reply($t("responses.discoin.perMin",{ ...P, perMin }));
				case "error":
					return msg.reply($t("responses.discoin.unreachable",P))
				default:
					return msg.reply("you hit a Discoin limit.");
			}
		}

		const amtAfterTax = amount * (1 - tax);

		const Currency = Rates.find(r => r.id === currency);

		if (!Currency) return msg.reply($t("responses.discoin.invalidCurr",P));
		if (!await ECO.checkFunds(msg.author.id, amount)) return msg.reply($t("responses.generic.noFunds",P));

		return DCN.create(msg.author.id, amtAfterTax, currency)
			.then(async(transaction) => {
				await ECO.pay(msg.author.id, amount, "DISCOIN");
				msg.reply($t("responses.discoin.discoin_desc", { ...P, bot: `<@${transaction.to.id}>`}));

				const receiptURL = genURL + transaction.id;
				embed.description = $t("responses.discoin.receipt",P);
				embed.image = { url: receiptURL };
				embed.footer = { text: $t("responses.discoin.takedis",P) };

				msg.author.getDMChannel().then(DMChannel => {
					DMChannel.createMessage({ embed });
				})
				.catch(e => {
					embed.description = $t("respones.discoin.receiptnoDM",P);
					msg.channel.send({ embed });
				});
			})
			.catch(e => {
				console.warn(e);
				return msg.reply($t("responses.discoin.unreachable",P));
			});

	} else {
		embed.title = "Discoin Currency Exchange";
		embed.description = _emoji('RBN')+`1 Rubine \`RBN\` = ${miliarize(RBN.value)} D$`;

		embed.fields.push({
			name:$t("terms.usage") + ":",
			value: "```js\n"+
			`${msg.prefix}exg 100 XYZ\n`+"```",
			inline: true
		});
		embed.fields.push({
			name: $t("responses.discoin.tax",P),
			value: $t("responses.discoin.tax_desc", { ...P, exchange: "15", income: "12", transfer: "5" }),
			inline: true
		});
		embed.fields.push({
			name:"Relevant links:",
			value: `📋 [${$t("responses.discoin.list",P)}](https://dash.discoin.zws.im/#/currencies)\n`+
				`📈 [${$t("responses.discoin.graphs",P)}](https://discoin.zws.im/grafana/d/lqd4WqEZz)\n`+
				`📕 [${$t("responses.discoin.guide",P)}](https://discoin.gitbook.io/docs/users-guide)`,
			inline: true
		});

		// rates generator
		await Promise.all( Rates.filter(r=>r.id!="RBN").map( async (curr,i)=>{
			let perRBN = RBN.value/curr.value;
			let perRBNString = perRBN >= 10 ? miliarize(perRBN) : perRBN.toPrecision(2).replace(".", ","); // not actually a string
			if(textMode) embed.fields.push({name: `${DEmojis[curr.id]||"💰"} ${curr.name}`, value: `1 RBN = ${perRBNString} ${curr.id}` , inline: true});
			else return createCurrencyGrid( (await createCard(curr)),i);
		}));

		while(embed.fields.length % 3) embed.fields.push(empty);


		// embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882674287968266/piechart.gif"}
		embed.thumbnail = textMode ? {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882599956643840/abacus.gif"} : {};

		let image = !textMode ? file(canvas.toBuffer(),"discoin.png") : null;
		return  msg.channel.send({embed},image);
	}

	async function createCurrencyGrid(card,i){

			let xpos = i % 3 * (225  + 8);
			let ypos = ~~(i/3) * (90 + 8);

			ctx.drawImage(card, 8+xpos,8+ypos);

	}

	async function createCard(curr){
		const canvas = Picto.new(225,90);
		const c    = canvas.getContext('2d');

		const thisCurrency = DiscoinCurrencies.find(c=>c.id === curr.id);

		const emojiPic = await Picto.getCanvas(`https://cdn.discordapp.com/emojis/${thisCurrency.emoji}.png`);

		let perRBN = RBN.value/curr.value;
		let perRBNString = perRBN > 10 ? miliarize(perRBN) : perRBN.toPrecision(2).replace(".", ","); // not actually a string


		Picto.roundRect(c,0,0,225,90,8,'#FFF');
		Picto.setAndDraw(c,Picto.tag(c,thisCurrency.name+" "   ,'600 20px Panton Black',"#2b2b3b"),66,6,150);
		Picto.setAndDraw(c,Picto.tag(c,thisCurrency.bot.name,'600 italic 15px Panton',"#445"),66+4,26+2,150);
		Picto.setAndDraw(c,Picto.tag(c,thisCurrency.id+" ",'900 24px "Panton Black"',"#2b2b3b"),8+27,2+62,54,'center');
		Picto.setAndDraw(c,Picto.tag(c,thisCurrency.id+" ",'600 12px "Panton Black"',"#334"),8+185,56,32);
		Picto.setAndDraw(c,Picto.tag(c,"=",'300 24px Panton',"#2b2b3b"),98,44+4,84);
		Picto.setAndDraw(c,Picto.tag(c,perRBNString+" ",'600 28px Panton',"#2b2b3b"),12+98+84,44,84,'right');
		Picto.setAndDraw(c,Picto.tag(c,curr.value.toPrecision(3)+" ",'300 18px Panton',"#334"),98+96,70,96,'right');


		let wid = 54;
		let minWid = 54;
		let hei = emojiPic.height / (emojiPic.width / wid);
		while (hei>minWid){
			wid--;
			hei = emojiPic.height / (emojiPic.width / wid);
		}
		c.drawImage( emojiPic , 8+(minWid/2)-(wid/2),8+(minWid/2)-(hei/2),wid,hei);

		let pad = 8;
		wid = 27 - pad;
		hei = homeEmojiPic.height / (homeEmojiPic.width / wid) ;
		c.drawImage( homeEmojiPic , pad +66, pad + 36 +(wid/2)-(hei/2),wid,hei);

		return canvas;
	}


};

module.exports={
    init
    ,pub:true
    ,cmd:'exchange'
    ,perms:3
    ,cat:'economy'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['discoin','convert','exg']
};
