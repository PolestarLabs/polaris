const userMarMap = new Map();

const init = async function (msg, args, resolve) {
	const USERDATA = await vDB.users.get(msg.author.id);
	const newUserData = await DB.users.get(msg.author.id);

	const MRG = USERDATA.married;

	if (!resolve){
		const rships = await DB.relationships.find({users: msg.author.id});
		const marryFixes = (newUserData.switches?.migrateFix?.marry||0);
		if (marryFixes) return msg.reply(`${_emoji('nope')} • Your marriages have already been fixed!`);
		if (rships.length >= 3) return msg.reply(`${_emoji('nope')} • You already got 3 marriages ported, you can't use this command!`);
	
	}

	marriageToRelationship = async (mar) => {
		const newmar = {};
		newmar.initiative = mar.initiative ? mar.id : msg.author.id;
		newmar.users = [msg.author.id, mar.id];
		newmar.ring = mar.ring;
		newmar.since = mar.since;
		newmar.type = "marriage";
		newmar.lovepoints = Math.floor(USERDATA.modules.lovepoints / USERDATA.married.length) || 0;
		newmar.merged = mar.merged;
		newmar.ringCollection = mar.ringCol;

		newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });
		if (newmar.preexistent) newmar.transferred = true;

		return newmar;
	};

	//

	const prefilt = MRG.filter((v, i, a) => {
		// let unique = i === a.map(x=>x.id).indexOf(v.id);
		const unique = a.map((x) => x.id).filter((x) => x === v.id).length === 1;
		const copies = a.filter((ff) => ff.id === v.id);
		v.ringCol = copies.map((c) => c.ring);

		if (!unique) {
			const oldest = copies.sort((a, b) => a.since - b.since)[0];
			copies.forEach((c) => c.ponderedValue = c.ring === "stardust" ? 0 : c.ring === "sapphire" ? 1 : c.ring === "rubine" ? 2 : c.ring === "jade" ? 3 : 9);
			const mostValuable = copies.sort((a, b) => a.ponderedValue - b.ponderedValue)[0];

			v.ring = mostValuable.ring;
			v.since = oldest.since;
			v.merged = true;
			return v;
		}
		return v;
	}).filter((v, i, a) => i === a.map((y) => y.id).indexOf(v.id));

	const newMARRIAGES = await Promise.all(prefilt.map(marriageToRelationship));

	function buildDescription(nMAR) {
		return `
**Total Marriages:** ${MRG.length}
**Unique Spouses:** ${MRG.map((x) => x.id).filter((v, i, a) => i === a.indexOf(v)).length}
						
**Choose up to 3 to import,** additional slots are gonna cost you ${_emoji("SPH")}**5 Sapphires** each (they'll be deducted *after* you receive the bonus Sapphires).
Please send **the number** of the selected marriages. Send \`ok\` to finish or skip.

${nMAR.map((x, i) => (x.transferred ? `\n\`${i}\` - Transferred! (<@${x.users.find((x) => x != msg.author.id)}>)`
			: `\n\u200b\`${i}\` **From** <t:${x.since}:R> | **User:** <@${x.users.find((x) => x != msg.author.id)}> | Init: ${x.initiative === msg.author.id ? _emoji("yep") : _emoji("nope")}
> **Highest Ring:** ${_emoji(x.ring, `💍\`${x.ring.toUpperCase()}\``)}${x.ringCollection.length > 1 ? `\n> **Ring Collection:** ${x.ringCollection.map((r) => _emoji(r, `💍\`${r.toUpperCase()}\``))}` : ""}
${x.preexistent ? `PREEXISTENT: ${x.preexistent._id}\n` : ""}`)).join("")}
`;
	}

	
	marriageToDdownOption = async (x) => {
		let xid = x.users.find((x) => x != msg.author.id);
		return {
			label: (await PLX.resolveUser(xid)).tag || xid,
			value: xid,
			description: `${x.transferred ?"(✅)":""} | Highest: ${x.ring.toUpperCase()} | Rings: ${x.ringCollection.length || 1}.`.slice(0,50),
			emoji: 
				_emoji(x.ring).id 
					? {id: _emoji(x.ring).id }
					: {name: "💍"}
			}
		}
	
		console.log({newMARRIAGES})

	const canBuyThisMuch = Math.min( ~~( newUserData.modules.SPH / 5 ), Math.max(0,newMARRIAGES.length-3) );

	const component = {
		type: 3,
		placeholder: `Select the marriages you want to import... ( Up to ${3+canBuyThisMuch}, each slot after 3 costs 5 Sapphires )`,
		max_values: Math.min(3 + canBuyThisMuch, newMARRIAGES.length),
		min_values: 0,
		custom_id: "marriageDdwn",
		options: await Promise.all(newMARRIAGES.slice(0,25).map(marriageToDdownOption))
	}



	const marriageEmbed = {
		description: buildDescription(newMARRIAGES),
	};
	const marriageBox = await msg.channel.send({ embed: marriageEmbed, 
		components: [{type:1,components:[component]}]
	 });
	
	const Collector = marriageBox.createButtonCollector((m) => m.userID === msg.author.id, { time: 600e3, idle: 120e3 });
	
	Collector.on("click", async ({interaction,id,userID,message:m,data}) => {

		if (id === "cancel_mrg") return Collector.stop("ABORT");
		if (id === "confirm_mrg") return Collector.stop("CONFIRM");

		const precomps = m.components;
		const components = [
			{type:2, label:"Confirm", style:3, custom_id:"confirm_mrg"},
			{type:2, label:"Cancel", style:4, custom_id:"cancel_mrg"},
		];
		precomps[1] = ({type:1,components});

		userMarMap.set(userID,[])
		if (data.values) userMarMap.set(userID, data.values );

		const embed = {
			description: userMarMap.get(userID).map(u=>
				` • <@${u}>`	
			).join("\n") + `\n\nCost: ${_emoji("SPH")} **${
				5 * Math.max(userMarMap.get(userID).length - 3, 0) || "Free"
			}**`
		}

		if (m){
			m = await m.edit({embed, components: precomps});
		}else{
			m = await msg.channel.send({embed, components: precomps});
		}

	});


	Collector.on("end", async (m, r) => {
		if (r !== "CONFIRM") {
			marriageBox.edit({content:`${_emoji("nope")} Cancelled`, embed:{}});
			if (resolve){
				return resolve(null)
			}
			return;
		} 

		const transferlist = [];
		const importlist = [];
		const xferred = await Promise.all(userMarMap.get(msg.author.id).map(uid=>{
			const thisMrg = newMARRIAGES.find(m=> m.users.includes(uid) && m.users.includes(msg.author.id) );
			transferlist.push(`<@${thisMrg.users.filter(x=>x!==msg.author.id)[0]}>`);
			if (thisMrg.transferred) return true;
			importlist.push(`<@${thisMrg.users.filter(x=>x!==msg.author.id)[0]}>`);
			const newM = DB.relationships.create("marriage", thisMrg.users, thisMrg.initiative, thisMrg.ring, thisMrg.since);
			return newM;
		}));
		const imported = xferred.filter(x=> typeof x !== 'boolean' );		

		const res = await marriageBox.edit({
			embed: {
				description: `
		**Complete!**
		Marriages transferred: **${ imported.length }**
> ${importlist.join(" | ")}
		Marriages already in: **${ xferred.length-imported.length }**
> ${transferlist.join(" | ")}
		Cost: **${5 * Math.max(imported - 3, 0) || "Free"}**
		`,
			},
		});

			
		await DB.users.set(msg.author.id, { $inc: { "switches.migrateFix.marry":1} }).catch(console.error);


		if (typeof resolve === "function") resolve({
			res,
			cost: 5 * Math.max(imported - 3, 0) || 0,
			imported: imported.length || newMARRIAGES.filter(x => x.transferred).length,
			size: MRG.length
		});
	});

 
	 

};
module.exports = {
	init,
	pub: false,
	cmd: "mrgt",
	perms: 3,
	cat: "misc",
	botPerms: ["attachFiles", "embedLinks"],
	aliases: [],
};
