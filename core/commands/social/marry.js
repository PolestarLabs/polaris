const RAR_COLORS = require("@polestar/constants/ui-colors").RarityColors;

const init = async function (msg,args){


	const USERDATA = await DB.users.getFull(msg.author.id);

	const inventoryIDmap = USERDATA.modules.inventory.map(it=>it.id).filter(x=>typeof x === "string");
	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();

	if (!userInventoryFull.length) return "empty";
	
	const Target = await PLX.resolveUser(args[0]||PLX.user.id);

	//return  msg.reply( "", {file: JSON.stringify(userInventoryFull,0,2), name: "x.json"});
	//const gSkip = 0;
	
	const gPage = 25;

	function availableRings(skip=0,size=23){

		let options = userInventoryFull.slice(skip,skip+size).map(ring=>{
			const partialEmoji = _emoji( ring.rarity || ring.emoji, "💍" );
			return {
				label: "💍 " + ring.name.slice(0,100),
				emoji: partialEmoji.id ? {id:partialEmoji.id} : {name: partialEmoji.name },
				value: ring.id,
			};				
			
		});

		let totalPages  = ~~(userInventoryFull.length / size);
		let currentPage = ~~(skip / size) +1;


		if (userInventoryFull.length - skip > size ) {
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
			options: availableRings(0,gPage)	 
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



	let resmsg = await msg.channel.send( {content:".",components} );
	const collector = resmsg.createButtonCollector( (i,d) => i.userID === msg.author.id, { time:125e3, removeButtons: null} );
	
	collector.on("click", (interaction,id) => {
		
		const [ring] = interaction.data.values;

		if (!ring) { 
			if (id === "propose") {
				
			}
			if (id === "cancel") {
				return interaction.message.edit({content:"",embeds:[{
					description: `${_emoji('nope')} Proposal cancelled...`,
					color: _UI.interface.danger
				}]
			}
		}

		if (ring.startsWith("next") ){
			let opts = ring.split(":");
			components[0].components[0].options = availableRings( opts[1] * gPage , gPage );
			return interaction.message.edit({components});

		}
		if (ring.startsWith("prev") ){
			let opts = ring.split(":");
			components[0].components[0].options = availableRings( opts[1]-2 * gPage , gPage );
			return interaction.message.edit({components});

		}

		const RING = userInventoryFull.find(i=>i.id===ring);

		console.log(msg.author.id , Target.avatar)

		components[0].components[0].options.forEach(o=> o.default = o.value === ring );
		interaction.message.edit({
			content: "",
			components,
			embeds: [
			{
				image: {url: `${paths.GENERATORS}/marry.png?ring=${RING.icon||RING.id}&av1=${msg.author.id}::${msg.author.avatar}&av2=${Target.id}::${Target.avatar}` },
				//title: `${_emoji(RING.rarity)} ${RING.name}`,
				color: numColor(RAR_COLORS[RING.rarity])
			}
		] })

	} ) 

}


module.exports = {
	cat:'social',
	botPerms:['attachFiles','embedLinks'],
	pub: true,
	cmd: "marry",
	aliases:["m2"],
	init,
	slashable: true,
	slashOptions: {
	  global: true,
	  args: ["player"],
	  guilds: ["789382326680551455"],
	  options: [
		 {
			name: "player",
			description: "The person to display marry with.",
			type: 6,
			required: true,
		 }
	  ]
	},
}