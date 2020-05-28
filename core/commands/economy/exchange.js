const Discoin = require('../../archetypes/Discoin');
const ECO = require('../../archetypes/Economy');
const CFG = require('../../../config.json');
const DCN = new Discoin(CFG.discoin);

const init = async function(msg){

	const genURL = "https://pollux.gg/generators/discoin/exchange.png?id=";

	let P={lngs:msg.lang}
	if(PLX.autoHelper([$t("helpkey",P)],{cmd:this.cmd,msg,opt:this.cat}))return;

	function getParams() {
		let amount = null, currency = null;

		if (!isNaN(parseInt(msg.args[0])) && msg.args[1]?.length === 3) {
			amount = msg.args[0];
			currency = msg.args[1].toUpperCase();
		} else if (msg.args[0]?.length === 3 && !isNaN(parseInt(msg.args[1]))) {
			amount = msg.args[1];
			currency = msg.args[0].toUpperCase();
		}

		return { amount, currency };
	}
	let Rates;
	try {
		Rates = JSON.parse(await DCN.rates());
	} catch (e) {
		return msg.reply("Discoin could not be reached. Please try again later.");
	}

	const embed = { fields: [] };
	let empty = {name:'\u200b',value:'\u200b',inline:true};

	const { amount, currency } = getParams();

	if (amount && currency) {
		if (parseInt(amount) < 0) return msg.reply("Debt isn't transferable, exchange at least 1 Rubine");
		if (parseInt(amount) === 0) return msg.reply("Exchange at least 1 Rubine");

		const Currency = Rates.find(r => r.id === currency);

		if (!Currency) return msg.reply("Could not find the specified currency. Run this command without arguments to see available currencies");
		if (!await ECO.checkFunds(msg.author.id, amount)) return msg.reply("You don't have enough Rubines");

		return DCN.create(msg.author.id, amount, currency)
			.then(async(transaction) => {
				await ECO.pay(msg.author.id, amount, "DISCOIN");

				const receiptURL = genURL + transaction.id;
				embed.description = "Your transaction receipt:";
				embed.image = { url: receiptURL };
				embed.footer = { text: "Keep this receipt in case your Rubines don't reach their destination." }

				// DM user receipt?
				msg.author.getDMChannel().then(DMChannel => {
					msg.reply(`Succesfully exchanged ${_emoji("RBN")}${amount} to ${currency}. Your receipt is on its way.`);
					DMChannel.createMessage({ embed });
				})
				.catch(e => {
					embed.description = "I couldn't deliver it in dms, so here is your receipt:";
					msg.channel.send({ embed });
				});
			})
			.catch(e => {
				console.log(e);
				return msg.reply("Discoin couldn't be reached. Please try again later.");
			});

	} else {
		let RBN = Rates.find(r=>r.id === "RBN");

		// need to find the function for number formatting & precision.
		embed.title = "Discoin Currency Exchange";
		embed.description = _emoji('RBN')+`1 Rubine \`RBN\` = ${RBN.value.toPrecision(4)} D$`;

		embed.fields.push({
			name:"Example usage:",
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
		// if not, need to add emojis when I add them to rates result
		Rates.filter(r=>r.id!="RBN").forEach(curr=>{
			embed.fields.push({name: curr.name, value: `1 RBN = ${Math.round(RBN.value/curr.value)||(RBN.value/curr.value).toFixed(2)} ${curr.id}` , inline: true})
		});

		while(embed.fields.length % 3) embed.fields.push(empty);

		// embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882674287968266/piechart.gif"}
		embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882599956643840/abacus.gif"}
		embed.color = 0xff3355;

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
