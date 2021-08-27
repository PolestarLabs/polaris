const yeses = [
	`${paths.CDN}/build/marry/yes1.gif`,
	`${paths.CDN}/build/marry/yes2.gif`,
	`${paths.CDN}/build/marry/yes3.gif`,
	`${paths.CDN}/build/marry/yes4.gif`,
 
 ];
 const noses = [
	`${paths.CDN}/build/marry/no4.gif`,
	`${paths.CDN}/build/marry/no1.gif`,
	`${paths.CDN}/build/marry/no2.gif`,
	`${paths.CDN}/build/marry/no3.gif`,
 ];
 const awkws = [
	`${paths.CDN}/build/marry/awk1.gif`,
	`${paths.CDN}/build/marry/awk2.gif`
 ];

const RAR_COLORS = require("@polestar/constants/ui-colors").RarityColors;
const YesNo = require("../../structures/YesNo.js");

const init = async function (msg,args){

	const userMarriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });

	if (userMarriages.length > 2) return "You can't have more than **3** active relationships at a time. Relationship slots management is coming soon";

	const Target = await PLX.resolveMember(msg.guild.id, args[0] || msg.mentions[0]?.id).catch(() => {});
	if (!Target) return this.invalidUsageMessage(msg);
	
	const P = { lngs: msg.lang, prefix: msg.prefix };
	
	if (Target.id === msg.author.id) 
		return $t("responses.marry.cantMarrySelf", P);	
	if (Target.id === PLX.user.id) 
		return $t("responses.marry.cantMarryPollux", P);	

	const USERDATA = await DB.users.getFull(msg.author.id);

	const inventoryIDmap = USERDATA.modules.inventory.filter(x=>x.count>0).map(it=>it.id).filter(x=>typeof x === "string");
	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
	
	if (!userInventoryFull.length) return _emoji("nope") + "There are no rings to propose in your inventory. Please try `plx!craft ring`";// $t("responses.marry.needRing", P);
	
	const gPage = 25;
	const components = [
	 {
	  type:1,
	  components:[
		{
			type: 3,
			placeholder: "Select the ring to propose with...",
			custom_id: `ringSelect:${msg.id}`,
			min_values: 0,
			max_values: 1,
			disabled: false,
			options: availableRings(userInventoryFull, USERDATA,0,gPage)	 
		}
	  ]
	 },
	 {
		 type: 1,
		 components: [
			 {
				type: 2,
				custom_id: "propose",
				emoji: {name:"💍"},
				label: "Propose",
				disabled: true,
				style: 1
			 },
			 {
				type: 2,
				custom_id: "cancel",
				label: "Cancel",
				style: 2				 
			 }
		 ]
	 }
	]



	let resmsg = await msg.channel.send( {
		content:"\u200b",
		components
	} );
	const collector = resmsg.createButtonCollector( (i,d) => i.userID === msg.author.id, { time:125e3, removeButtons: null} );
	
	let selectedRing = null;
	
	collector.on("click", (interaction,id) => {
		
		const [ring] = interaction.data.values || [interaction.data.custom_id];

		if (ring === "propose") {
			collector.stop();
			execMarriage(P,resmsg,selectedRing,msg,Target,USERDATA);			
			return console.log({selectedRing})
		}
		if (ring === "cancel") {
			return interaction.message.edit({
				//content:"",
				embeds:[{
					description: `${_emoji('nope')} Proposal cancelled...`,
					color: numColor(_UI.colors.interface.danger)
				}],
				components: []
			})
		}


		if (ring.startsWith("next") ){
			let opts = ring.split(":");
			components[0].components[0].options = availableRings( userInventoryFull, USERDATA,  opts[1] * gPage , gPage );
			return interaction.message.edit({components});

		}
		if (ring.startsWith("prev") ){
			let opts = ring.split(":");
			components[0].components[0].options = availableRings( userInventoryFull, USERDATA,  opts[1]-2 * gPage , gPage );
			return interaction.message.edit({components});

		}

		const RING = userInventoryFull.find(i=>i.id===ring);

		selectedRing = RING;

		components[0].components[0].options.forEach(o=> o.default = o.value === ring );
		components[1].components[0].disabled = false;
		interaction.message.edit({
			//content: "",
			components,
			embeds: [
				{
					image: {url: `${paths.GENERATORS}/marry.png?ring=${RING.icon||RING.id}&av1=${msg.author.id}::${msg.author.avatar}&av2=${Target.id}::${Target.avatar}` },
					//title: `${_emoji(RING.rarity)} ${RING.name}`,
					color: numColor(RAR_COLORS[RING.rarity])
				}
			]
		}).then(m=>resmsg=m)

	});
	
	

	async function execMarriage(){
		P.userA = msg.member.nick || msg.author.username;
		P.userB = Target.nick || Target.user.username;
		// Find authors current marriages;
		const marriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
		// Check if there is a marriage with the Target already
		const marriageWithTarget = marriages.find((mrg) => mrg.users.includes(Target.id));

		// If not marriage, regular marriage procedure
		if (!marriageWithTarget) return marriageFlow();
		
		
		// Check if current ring is already present in collection (then deny)
		if (marriageWithTarget.ringCollection?.includes(selectedRing.id))
			//  if ring present > deny
			return "nope";
		else
			upgradeMarriage(msg, resmsg, USERDATA,  marriageWithTarget._id,selectedRing);

		


	}

	async function marriageFlow(){
			
		const embed =  resmsg.embeds[0];

		P.userA = msg.member.nick || msg.author.username;
		P.userB = Target.nick || Target.user.username;


		embed.color = 0xf0418b;
		P.ringname = selectedRing.name;
		embed.description = `:love_letter:  ${$t("responses.marry.proposal", P)}`;

		let proposal = await resmsg.edit({ embed });

		const willMarry = await YesNo(proposal, msg, { approver: Target.id, avoidEdit: true });

		if (willMarry === false){
			embed.description = `:broken_heart: *${$t("responses.marry.saidNo", P)}*\u2003 :tumbler_glass:${_emoji("plxOof")}`;
			marryGif = shuffle(shuffle(noses))[0];
			embed.image = { url: marryGif };
			return proposal.edit({ embed });
		}
		if (willMarry === null){
			embed.description = `:black_heart: *${$t("responses.marry.saidNothing", P)}*\u2003 :cocktail:${_emoji("PolluxChu")}`;
			marryGif = shuffle(shuffle(awkws))[0];
			embed.image = { url: marryGif };
			return proposal.edit({ embed });
		}

		embed.description = `:heartpulse: **${$t("responses.marry.saidYes", P)}**\u2003 :champagne:${_emoji("plxYay")}`;
		marryGif = shuffle(shuffle(yeses))[0];
		embed.image = { url: marryGif };
		proposal.edit({ embed });

		// Create
		const THIS_MARRIAGE_ID = (await DB.relationships.create("marriage", [msg.author.id, Target.id], msg.author.id, RING.id))._id;
		// Remove Ring
		await USERDATA.removeItem(RING.id);

		// Mutual Feature Prompt >>>
			MutualFeatPrompt(selectedRing)

	}

	async function MutualFeatPrompt(THIS_MARRIAGE_ID){

		P.userA = msg.member.nick || msg.author.username;
		P.userB = Target.nick || Target.user.username;

		const featPieceLEFT = (piece) => `**${P.userB}** ${piece || `${_emoji("loading")}:black_heart:`}`;
		const featPieceRIGHT = (piece) => `${piece || `:black_heart:  ${_emoji("loading")}`} **${P.userA}**`;
		const footer = {text: $t("responses.marry.addToFeatured3", P), icon_url: `${paths.CDN}/build/items/${selectedRing.icon||selectedRing.id}.png` };
		let pL = featPieceLEFT(); let pR = featPieceRIGHT();
		
		const responseMe = {
		content: $t("responses.marry.addToFeatured2", P),
		embed: {
				footer,
				color: 0xbecfcc,
			description: `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`,
		},
		};
		const responseThem = {
		content: $t("responses.marry.addToFeatured", P),
		embed: {
				footer,
				description: `${_emoji("loading")} :black_heart: `,
		},
		};
		const colorgrade = [0xa7d4cc, 0x68d9d1, 0x41f0ed];
		let spot = 0;
		
		
		
		let firstRes = responseMe;
		firstRes.content = `${$t("responses.marry.addToFeatured", P)}\n${$t("responses.marry.addToFeatured2", P)}`;
		
		const featurePrompt = await msg.channel.send(firstRes);
		let featurePromptState = firstRes;
		firstRes = null;
		
		const DoFeatMe = () => {
		pL = featPieceLEFT(`${_emoji("yep")} :sparkling_heart:`);
		responseThem.embed.description = `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`;
		featurePromptState = responseThem;
		return mutateFeaturePrompt(responseThem);
		//DB.users.set(Target.id, { featuredMarriage: THIS_MARRIAGE_ID });
		};
		const DoFeatThem = () => {
		pR = featPieceRIGHT(`:sparkling_heart: ${_emoji("yep")}`);
		responseMe.embed.description = `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`;
		featurePromptState = responseMe;
		return mutateFeaturePrompt(responseMe);
		//DB.users.set(msg.author.id, { featuredMarriage: THIS_MARRIAGE_ID });
		};
		const DontFeat = (m) => {
		const res = { content: featurePrompt.content, embed: featurePrompt.embeds[0] };
		if (m === msg.author.id) pL = featPieceLEFT(`${_emoji("nope")} :broken_heart:`);
		if (m === Target.id) pR = featPieceRIGHT(`:broken_heart: ${_emoji("nope")} `);
		featurePromptState = res;
		return mutateFeaturePrompt(res);
		};
		
		function mutateFeaturePrompt(res) {
		spot++;
		res.embed.color = colorgrade[spot];
		res.embed.description = `${pL}\u2003 \u2003${pR}`;
		return featurePrompt.edit(res);
		}

		await featurePrompt.setButtons([
			{custom_id: "featYes",  label: $t(["terms.yep",  "Yep" ],P), emoji: {id:_emoji("yep" ).id}, style: 3},
			{custom_id: "featNope", label: $t(["terms.nope", "Nope"],P), emoji: {id:_emoji("nope").id}, style: 4}
		]);

		let participants = [Target.id, msg.author.id];
		let featYes1, featYes2;

		const featColl = featurePrompt.createButtonCollector((i)=> participants.includes(i.userID), {maxMatches:2,removeButtons:true,time:15e3} );
		featColl.on("click", async (interaction) => {
			participants = participants.filter(x=>x!==interaction.userID);

			console.log(interaction.userID, interaction.data.custom_id)

			if (interaction.userID === msg.author.id){
				if (interaction.data.custom_id === "featYes") featYes1 = true && await DoFeatThem();
				if (interaction.data.custom_id === "featNope") await DontFeat(Target.id);
			}
			if (interaction.userID === Target.id){
				if (interaction.data.custom_id === "featYes") featYes2 = true && await DoFeatMe();
				if (interaction.data.custom_id === "featNope") await DontFeat(msg.author.id);
			}
		});

		featColl.on("end", ()=>{
			if (!featYes1) DontFeat(Target.id);
			if (!featYes2) DontFeat(msg.author.id);

			featurePromptState.embed.color = 0x41f0ed;
			featurePromptState.embed.footer = {};
			featurePromptState.embed.image = {
				url: `${paths.GENERATORS}/marry.png?full=1&ring=${selectedRing.icon||selectedRing.id}&av1=${msg.author.id}::${msg.author.avatar}&av2=${Target.id}::${Target.avatar}` 
			}
			featurePrompt.edit(featurePromptState);

		})
		
	
	}

	


}

async function getMarriagesDDown(user,prompt="Select...",id="mrgDdown",defaultFun){
	const userMarriages = await DB.relationships.find({users: user });
	if (!userMarriages) return null;
	const components = [
		{
			type:1,
			components:[
			{
				type: 3,
				placeholder: prompt,
				custom_id: id,
				min_values: 0,
				max_values: 1,
				disabled: false,
				options: await Promise.all(userMarriages.slice(0,25).map( async mrg =>{
					let [mUser,ring] = await Promise.all(
						[
							PLX.resolveUser(mrg.users.find(u=>u!=user)),
							DB.items.findOne({id: mrg.ring })
						]
					);
					
					const ringsSize = mrg.ringCollection.length||0;
					
					return {
						default: defaultFun ? defaultFun(mrg) : false,
						label: mUser.username,
						description: `💍 ${ring.name}  ${ ringsSize > 1 ? `(+${ringsSize-1})` : "" }`,
						value: mrg._id.toString(),
						emoji: {name: shuffle(['💜','❤️','💙','💚','🤍','💛','🧡'])[0] }
					}
				}))
		  	}
		 ]
		}		
	];
	return components;
}

function availableRings(rings,USERDATA,skip=0,size=23,nodescription){

	let options = rings.slice(skip,skip+size).map(ring=>{
		const partialEmoji = _emoji( ring.rarity || ring.emoji, "💍" );
		return {
			label: "💍 " + ring.name.slice(0,100),
			description: nodescription ? "" : `(x${USERDATA.modules.inventory.find(x=>x.id===ring.id)?.count || 0 })`,
			emoji: partialEmoji.id ? {id:partialEmoji.id} : {name: partialEmoji.name },
			value: ring.id,
		};				
		
	});
	let totalPages  = ~~(rings.length / size);
	let currentPage = ~~(skip / size) +1;

	if (rings.length - skip > size ) {
		options.push({
			label: `Next Page...`,
			description: ` ${currentPage +1}/${totalPages} More options ahead`,
			value: "next:" + currentPage + ":" + totalPages
		})
	}
	if (skip) {
		options.push({
			label: `Previous Page...`,
			description: ` ${currentPage -1}/${totalPages} The options you just skipped`,
			value: "prev:" +  currentPage + ":" + totalPages
		})
	}
	return options;
}


async function upgrade(msg,args){

	const P = { lngs: msg.lang, prefix: msg.prefix };

	const components = await getMarriagesDDown(msg.author.id,"Choose a marriage to upgrade","mrgUpgrade");
	if (!components) return "No marriages";

	const userData = await DB.users.getFull(msg.author.id);

	const inventoryIDmap = userData.modules.inventory.filter(x=>x.count>0).map(it=>it.id).filter(x=>typeof x === "string");
	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
	if (!userInventoryFull.length) return _emoji("nope") + $t("responses.marry.needRing", P);

	let skip = 0;
	let pgSize = 10;

	const options = availableRings( userInventoryFull , userData, skip ,pgSize);
	components[1] = ({
		type:1,
		components: [{
			type:3,
			placeholder: "Select the ring...",
			custom_id: `ringSelect3`,
			min_values: 0,
			max_values: 1,
			options
		}]
	});


	msg.reply({
		content: "Choose a marriage to upgrade and a ring to use",
		components
	}).then(menu=>{
		const collector = menu.createButtonCollector((i)=> i.userID === msg.author.id ,{time:25e3});
		
		let selectedRel, selectedRing;
		collector.on('click', async (i) => {
			
			if  (i.data.custom_id === "commit_upgrade_mrg") {
				collector.stop();
				return upgradeMarriage(msg,menu, userData, selectedRel._id,selectedRing);
			}
			if  (i.data.custom_id === "abort_upgrade_mrg") {
				menu.edit({
					embed: {description: `${_emoji('nope')} Cancelled`, color: numColor(_UI.colors.danger)  }
				})
				return collector.stop();
			}			
			
			const [val] = i.data.values || [];

			if (i.data.custom_id === "ringSelect3"){
				selectedRing = await DB.items.findOne({id: val});
				components[1].components[0].options.forEach(x=>x.default = x.value == val)
			}
			if (i.data.custom_id === "mrgUpgrade"){
				selectedRel = await DB.relationships.findOne({_id: val.toString()});
				components[0].components[0].options.forEach(x=>x.default = x.value == val.toString())
			}
			components[2] = {type:1, components:[
				{ disabled: !(selectedRing && selectedRel) ,type:2,label:"Confirm",style:1,custom_id:"commit_upgrade_mrg"},
				{type:2,label:"Cancel",style:2,custom_id:"abort_upgrade_mrg"},
			]}

			menu.edit({components});

		}) 

	})
  

}
async function feature(msg,args){

	const userData = await DB.users.get(msg.author.id);
	const P = { lngs: msg.lang, prefix: msg.prefix };

	let components = await getMarriagesDDown(
		msg.author.id,
		"Choose your new featured marriage",
		"mrgFeature",
		(item) => {
			return userData.featuredMarriage === item._id.toString()
		}
	);
	if (!components || !components?.[0]?.components?.[0]?.options?.length ) return "No marriages";

	msg.reply({
		embed: {description: "Choose one of your partners to be displayed in your Profile Card" },
		components
	}).then(menu=>{
		const collector = menu.createButtonCollector((i)=> i.userID === msg.author.id ,{time:25e3});
		
		let selectedRel, selectedRing;
		collector.on('click', async (i) => {
			
			let [val] = i.data.values || [];
			if (!val) return;
			let isPaging = Number(val.split(":")[1] || 0);

			if (val.includes("ring_")){
				selectedRing = await DB.items.findOne({id: val});
				components[1].components[0].options.forEach(x=> x.default = x.value === val );
				if (!selectedRel||!selectedRing) return;
				DB.relationships.set( {_id: selectedRel._id} , {$set: {ring: val }});
			}

			if (!val.includes("ring_") && !isPaging){
				selectedRel = await DB.relationships.findOne({_id: val});
				selectedRing = await DB.items.findOne({id: selectedRel.ring});
				
				components[0].components[0].options.forEach(x=> x.default = x.value === val.toString() );
				DB.users.set(msg.author.id, {$set: {featuredMarriage: val }});				
			}			

			if (typeof isPaging === 'number'){
				const ringsCol = await DB.items.find({id:{$in: selectedRel.ringCollection }});
				const pgSize = 20;
				const skip = val.startsWith('prev') ? isPaging-2 * pgSize : val.startsWith('next') ? isPaging * pgSize : 0;
				const options = availableRings( ringsCol , userData, skip ,pgSize);
				
				components[1] = ({
					type:1,
					components: [{
						type:3,
						placeholder: "Select the ring...",
						custom_id: `ringSelect2:${msg.id}`,
						min_values: 0,
						max_values: 1,
						options
					}]
				});
			}			
			

			menu.edit({embed: {
				description: `${_emoji('yep')} Featuring <@${selectedRel.users.find(u=>u!==msg.author.id)}> with 💍 **${selectedRing.name}**`
			} ,components});
		})
	})
  

}

async function upgradeMarriage(msg,resmsg, USERDATA, THIS_MARRIAGE_ID, RING){
		
	const P = {lngs:msg.lang};

	const prompt = await resmsg.edit({
		embed: {
			description: `Upgrade current marriage with **${RING.name}** ?`
		}
	});

	switch (await YesNo(prompt,msg)){
		case true:
			if (! (await USERDATA.hasItem(RING.id)) ){
				return prompt.edit({embed:{
					description: "⚠ You do not own any more of this item!",
					color: numColor(_UI.colors.warning)
				}});
			}
			await USERDATA.removeItem(RING.id);
			await DB.relationships.set({ _id: THIS_MARRIAGE_ID }, { $addToSet: {ringCollection: RING.id }, $set: { ring: RING.id } });
			return "ok"
			break;
		case false:
			return "false";
			break;
		case null:
			return "null";
	
	}	
	
}


module.exports = {
	cat:'social',
	botPerms:['attachFiles','embedLinks'],
	pub: true,
	cmd: "marry",
	aliases:["m2"],
	upgradeMarriage,
	init,
	slashable: true,
	autoSubs: [
		{
		  label: "upgrade",
		  gen: upgrade,
		  options: {
			 aliases: ["up"],
			
		  },
		},
		{
		  label: "feature",
		  gen: feature,
		  options: {
			 aliases: ["fe"],
			
		  },
		},
	],
	slashOptions: {
	  global: false,
	  args: ["player"],
	  guilds: ["789382326680551455"],
	  options: [
		 {
			name: "player",
			description: "The person to display marry with.",
			type: 6,
			required: true,
		 },		 		
	  ]
	},
}
