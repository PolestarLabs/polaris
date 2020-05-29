const Discoin = require('../../archetypes/Discoin');
const ECO = require('../../archetypes/Economy');
const CFG = require('../../../config.json');
const DCN = new Discoin(CFG.discoin);

const init = async function(msg){

	const genURL = "https://pollux.gg/generators/discoin/exchange.png?id=";

	let P={lngs:msg.lang,prefix:msg.prefix}
	if(PLX.autoHelper([$t("helpkey",P)],{cmd:this.cmd,msg,opt:this.cat}))return;

	function getParams() {
		let amount = null, currency = null;

		if (parseInt(msg.args[0]) && msg.args[1]?.length === 3) {
			amount = parseInt(msg.args[0]);
			currency = msg.args[1].toUpperCase();
		} else if (msg.args[0]?.length === 3 && parseInt(msg.args[1])) {
			amount = parseInt(msg.args[1]);
			currency = msg.args[0].toUpperCase();
		}

		return { amount, currency };
	}
	let Rates;
	try {
		Rates = JSON.parse(await DCN.rates());
	} catch (e) {
		return msg.reply($t("responses.discoin.unreachable",P));
	}

	const embed = { fields: [] };
	embed.color = 0xff3355;
	let empty = {name:'\u200b',value:'\u200b',inline:true};

	const { amount, currency } = getParams();

	if (amount && currency) {
		if (amount < 0) return msg.reply($t("responses.discoin.debt",P));
		if (amount == 0) return msg.reply($t("responses.discoin.zero",P));

		const amtAfterTax = amount * .85;

		const Currency = Rates.find(r => r.id === currency);

		if (!Currency) return msg.reply($t("responses.discoin.invalidCurr",P));
		if (!await ECO.checkFunds(msg.author.id, amount)) return msg.reply("You don't have enough Rubines");

		return DCN.create(msg.author.id, amtAfterTax, currency)
			.then(async(transaction) => {
				await ECO.pay(msg.author.id, amount, "DISCOIN");

				const receiptURL = genURL + transaction.id;
				embed.description = $t("responses.discoin.receipt",P);
				embed.image = { url: receiptURL };
				embed.footer = { text: $t("responses.discoin.takedis",P) }

				msg.author.getDMChannel().then(DMChannel => {
					msg.reply(`Succesfully exchanged ${_emoji("RBN")}${miliarize(amount)} to ${currency}. Your receipt is on its way.`);
					DMChannel.createMessage({ embed });
				})
				.catch(e => {
					embed.description = $t("respones.discoin.receiptnoDM",P);
					msg.channel.send({ embed });
				});
			})
			.catch(e => {
				console.log(e);
				return msg.reply("Discoin couldn't be reached. Please try again later.");
			});

	} else {
		let RBN = Rates.find(r=>r.id === "RBN");

		embed.title = "Discoin Currency Exchange";
		embed.description = _emoji('RBN')+`1 Rubine \`RBN\` = ${miliarize(RBN.value)} D$`;

		embed.fields.push({
			name:$t("terms.usage") + ":",
			value: "```js\n"+
			`${msg.prefix}exg 100 XYZ\n`+"```",
			inline: true
		});
		// still relevant?
		embed.fields.push({
			name:"Tax information:",
			value: "Exchange Tax: **15%**\nIncome Tax: **12%**\nTransfer Tax: **5%**",
			inline: true
		});
		embed.fields.push({
			name:"Relevant links:",
			value: "📋 [Currency list](https://dash.discoin.zws.im/#/currencies)\n"+
				"📈 [Live graphs](https://discoin.zws.im/grafana/d/lqd4WqEZz)\n"+
				"📕 [Users guide](https://discoin.gitbook.io/docs/users-guide)",
			inline: true
		});

		// probably replaced with fancy image
		Rates.filter(r=>r.id!="RBN").forEach(curr=>{
			let perRBN = RBN.value/curr.value;
			let perRBNString = perRBN > 10 ? miliarize(perRBN) : perRBN.toPrecision(2).replace(".", ","); // not actually a string
			embed.fields.push({name: curr.name, value: `1 RBN = ${perRBNString} ${curr.id}` , inline: true})
		});

		while(embed.fields.length % 3) embed.fields.push(empty);

		// embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882674287968266/piechart.gif"}
		embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882599956643840/abacus.gif"}

		return { embed };
	}
}

module.exports={
    init
    ,pub:true
    ,cmd:'exchange'
    ,perms:3
    ,cat:'economy'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['discoin','convert','exg']
}
