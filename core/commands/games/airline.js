const Airline = require("../../archetypes/Airline");
const RegionalIndicators = require("../../utilities/RegionalIndicators");

const STARTER_AIRPORTS_OPTIONS = DB.airlines.AIRPORT.find({starter:true});
const STARTER_AIRPLANE_OPTIONS = DB.airlines.AIRPLANES.find({starter:true});


const init = async (msg, args) => {
  console.log(args);

  if (args[0] === "create" && args[1]?.match(/^([A-Z0-9]{4})$/)) {
    msg.channel.send(args[1]);
  }

  switch (args[0]) {
    default: msg.channel.send("VENUS FLY TRAP");
      break;
    case "create": {
      msg.channel.send("A new airline? Awesome! Tell me a 4-digit alphanumeric code for your new airline.");
      let filter = (m) => m.author.id === msg.author.id && m.content.match(/^([A-z0-9]{4})$/);
      const c1 = await msg.channel.awaitMessages(filter, { time: 30e3, maxMatches: 1 });
      const airlineID = c1[0].content.toUpperCase();

      msg.channel.send("Now, give your airline a name. Be nice and keep it shorter than 35 characters.");
      filter = (m) => m.author.id === msg.author.id && m.content.length <= 35;
      const c2 = await msg.channel.awaitMessages(filter, { time: 30e3, maxMatches: 1 });
      const airlineName = c2[0].content;


      const SELECT_HUB = {
        type: 3,
        custom_id: "airline_select_hub",
        placeholder: "Pick an airport...",
        min_values: 1,
        max_values: 1,
        options: (await STARTER_AIRPORTS_OPTIONS).map(airport=> {
          return {
            label: `${airport.name} (${airport.IATA})`,
            value: airport.ICAO,
            description:  `${airport.city} • ${[...Array(airport.tier).keys()].map(x=>"⭐").join('') }`,
            emoji: { name: RegionalIndicators(airport.country) }  
          }
  
        })
      };
      const SELECT_PLANE_ONE = {
        type: 3,
        custom_id: "airplane_select",
        placeholder: "Pick an airplane...",
        min_values: 1,
        max_values: 1,
        options: (await STARTER_AIRPLANE_OPTIONS).map(plane=> {
          return {
            label: `${plane.name}`,
            value: plane.id,
            description:  `Range: ${plane.range}km | Capacity: ${plane.capacity} • ${[...Array(plane.price).keys()].map(x=>"⭐").join('') } `,
            emoji: { name: RegionalIndicators(plane.country) }  
          }
  
        })
      };


      const embed = {
        title: "Choose your starter airport and your starter plane",
        description: `**${airlineName}** (${airlineID})`,
        fields: [
          {name:"Starter Hub",value:"\u200b",inline:true},
          {name:"Starter Plane",value:"\u200b",inline:true},
          {name:"Tally",value:"\u200b",inline:0}
        ]
      };

      let prompt = await msg.channel.send({
        embed
      });
      let tray = await msg.channel.send({
        content: "\u200b",
        components: [
          { type: 1, components: [SELECT_HUB] },
          { type: 1, components: [SELECT_PLANE_ONE] },
        ],
      });

      let collector = tray.createButtonCollector(int=>int.userID===msg.author.id,{idle:60e3,removeButtons:false});
      let planeScore =0, hubScore = 0;

      collector.on("click", async (i) => {
        const [selection] = i.data.values || [null];
        if (i.data.custom_id === "airplane_select" ){
          let air = (await STARTER_AIRPLANE_OPTIONS).find(x=>x.id === selection);
          embed.fields[1].value = `${RegionalIndicators(air.country)} ${air.name}`
          planeScore = air.price||0;

        }
        if (i.data.custom_id === "airline_select_hub" ){
          let air = (await STARTER_AIRPORTS_OPTIONS).find(x=>x.ICAO === selection);
          embed.fields[0].value = `${RegionalIndicators(air.country)} ${air.name}`
          hubScore = air.tier||0;
        }
        
        embed.fields[2].value = ` ${[...Array(hubScore + planeScore).keys()].map(x=>"⭐").join('') } \n`+
        ( (hubScore + planeScore) > 6 ? `Score too high. Max is 6` : "" );


        prompt.edit({embed});
        
      })


    }
  }
};

module.exports = {
  init,
  cmd: "airline",
  pub: true,
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["al"],
};
