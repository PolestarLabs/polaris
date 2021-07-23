const EASTER_EGGS = [
	{
		trigger: "south pole"
		, dummyLocation: "ushuaia argentina"
		, city: "South Pole"
		, country: { name: "Antarctica" }
		, flag_override: "united-nations"
		, map_override: "/build/weather/eggs/southpole.png"
		, temp_offset: -30
		, text: "Freezing"
		, code: 21
	}
	/*
	{
		trigger: ""         // Args match
		,dummyLocation: ""  // Real location to use as a template
		,city: ""           // 
		,region: ""         //
		,country: {name:""} //
		,timezone_id:  ""   //
		,curr: 00           // Current temp
		,temp_offset: 00    // Add/Remove degrees from the original
		,sunset: ""         // XX:XX TT
		,sunrise:  ""       // XX:XX TT
		,text: ""           // Condition text
		,code: 00           // Condition code (See Yahoo Docs)
	} 
	*/
]

const Weather = require("../../archetypes/Weather");

const init = async (msg, args) => {
	if (!args.length) {
		//msg.channel.send("You didn't specify a region so I'm using yours instead");
		args[0] = (await DB.users.get(msg.author.id, { personal: 1 })).personal?.city;
		if (!args[0]) return msg.command.invalidUsageMessage(msg)
	}
	//msg.reply("Where though?");

	let far = false;
	for (let i = 0; i < args.length; i++)
		if (["-f", "f"].includes(args[i]?.toLowerCase()))
			far = (args.splice(i, 1), true);

	const weather = new Weather();
	if (far) weather.setUnit("F");

	try {
		await weather.initiate(args.join(" "));
	} catch (code) {
		if (code instanceof Error) return msg.reply("Location has to be of a-Z characters."); // or _- and some more.
		return msg.reply(`${code} - Couldn't connect with the API`); // probably...
	}

	let EGG = {};
	if (EASTER_EGGS.map(ee => ee.trigger).includes(args.join(" "))) {
		EGG = EASTER_EGGS.find(ee => ee.trigger === args.join(" "));
		await weather.initiate(EGG.dummyLocation);
	}

	if (!weather.found) return msg.channel.send("Location not found :(");


	const PAYLOAD = {
		city: EGG.city || weather.location.city
		, region: EGG.region || weather.location.region
		, country: EGG.country || weather.location.country
		, timezone_id: EGG.timezone_id || weather.location.timezone_id
		, temp: EGG.curr || weather.now.curr + (EGG.temp_offset || 0)
		, sunset: EGG.sunset || weather.now.sunset
		, sunrise: EGG.sunrise || weather.now.sunrise
		, text: EGG.text || weather.now.text
		, code: EGG.code || weather.now.code
		, flag_override: EGG.flag_override
		, map_override: EGG.map_override
		, week: [
			weather.week[0],
			weather.week[1],
			weather.week[2],
		]
		, unit: far ? "F" : "C"
	};

	let buffer = new Buffer(JSON.stringify(PAYLOAD)).toString('base64');

	//FIXME[epic=anyone] do not use that hard coded link

	msg.channel.send("", {
		file: await resolveFile(`${ paths.GENERATORS}/weather.png?furball=${encodeURIComponent(buffer)}`),
		name: 'weather.png'
	})



	/*
	// ANCHOR WEATHER SHOWCASE -- not actual cmd
	if (far) weather.setUnit("F");
	const { inspect } = require("util");
	const now = inspect(weather.now);
	const week = inspect([weather.week[0], weather.week[2], "and more..."], { depth: 1 });
	const loc = inspect(weather.location);
  
	msg.channel.send({
		embed: {
		title: "Weather properties",
		description: "Methods: weather.setUnit('F' | 'C')\nProperties: `found` boolean",
		color: 0x9dd9f2,
		fields: [
			{
			name: "weather.location",
			value: `\`\`\`js\n${loc}\`\`\``,
			},
			{
			name: "weather.now",
			value: `\`\`\`js\n${now}\`\`\``,
			},
			{
			name: "weather.week",
			value: `\`\`\`js\n${week}\`\`\``,
			},
		],
		},
	});
	*/


};

module.exports = {
	init,
	pub: true,
	cmd: "weather",
	perms: 3,
	cat: "utility",
	botPerms: ["attachFiles", "embedLinks"],
	aliases: ["wtt"],
};
