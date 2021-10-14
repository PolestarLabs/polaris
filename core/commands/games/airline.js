/* eslint-disable arrow-body-style */
const Airline = require("../../archetypes/Airline");
const RegionalIndicators = require("../../utilities/RegionalIndicators");

const RARS = [ "C", "U", "R", "SR", "UR" ];

const STARTER_AIRPORTS_OPTIONS = DB.airlines.AIRPORT.find({ starter: true });
const STARTER_AIRPLANE_OPTIONS = DB.airlines.AIRPLANES.find({ starter: true });

const EMJ = {
  airbus: "898260332714291200",
  fokker: "898260332739457096",
  boeing: "898260332806565899",
  bombardier: "898260332689096774",
  cessna: "898260332957548565",
  dassault: "898260332953362473",
  embraer: "898260332764618763",
  namc: "898260334832390174",
  mcdonnel: "898260333016281098",
  tupolev: "898260333066584104",
  comac: "898261986096324618",
};

const init = async (msg, args) => {

  function serverColor() {
    const roles = msg.member.roles.map((r) => msg.guild.roles.get(r)).filter((x) => x.color).sort((a, b) => b.position - a.position);
    const color = roles[0]?.color || numColor(_UI.colors.red);
    return `${Number(color).toString(16)}`;
  }

  if (args[0] === "create" && args[1]?.match(/^([A-Z0-9]{4})$/)) {
    msg.channel.send(args[1]);
  }

  switch (args[0]) {
    default: msg.channel.send("VENUS FLY TRAP");
      break;
    case "create": {
      msg.channel.send("Give your airline a name. Be nice and keep it shorter than 35 characters.");
      let filter = (m) => m.author.id === msg.author.id && m.content.length <= 35;
      const c2 = await msg.channel.awaitMessages(filter, { time: 30e3, maxMatches: 1 });
      const airlineName = c2[0].content;

      msg.channel.send("Now give it a 4-digit alphanumeric code. This will be used in callsigns and flight numbers.");
      filter = (m) => m.author.id === msg.author.id && m.content.match(/^([A-z0-9]{4})$/);
      const c1 = await msg.channel.awaitMessages(filter, { time: 30e3, maxMatches: 1 });
      const airlineID = c1[0].content.toUpperCase();

      const SELECT_HUB = {
        type: 3,
        custom_id: "airline_select_hub",
        placeholder: "Pick an airport...",
        min_values: 1,
        max_values: 1,
        options: (await STARTER_AIRPORTS_OPTIONS).map((airport) => {
          return {
            label: `${airport.name} (${airport.IATA})`,
            value: airport.ICAO,
            description: `${airport.city} • ${[...Array(airport.tier).keys()].map(x => "⭐").join("")}`,
            emoji: { name: RegionalIndicators(airport.country) },
          };
        }),
      };
      const SELECT_PLANE_ONE = {
        type: 3,
        custom_id: "airplane_select",
        placeholder: "Pick an airplane...",
        min_values: 1,
        max_values: 1,
        options: (await STARTER_AIRPLANE_OPTIONS).map((plane) => {
          return {
            label: `${plane.name}`,
            value: plane.id,
            description: `Range: ${plane.range}km | Capacity: ${plane.capacity} • ${[...Array(plane.price).keys()].map(x => "⭐").join("")} `,
            emoji: { id: EMJ[plane.make] }, // { id:  _emoji( RARS[plane.price -1]).id }
          };
        }),
      };

      const svc = serverColor();

      const embed = {
        title: "Choose your starter airport and your starter plane",
        description: `**${airlineName}** (${airlineID})`,
        thumbnail: { url: `${paths.GENERATORS}/airlines/generic-logo.png?name=${airlineID}&c1=${svc}` },
        fields: [
          { name: "🟣 Starter Hub", value: "\u200b", inline: true },
          { name: "🔵 Starter Plane", value: "\u200b", inline: true },
          { name: "Tally (Max 6)", value: "⚫⚫⚫⚫⚫⚫\n\u200b", inline: 0 },
        ],
      };

      const CONFIRM = {
        type: 2,
        style: 3,
        label: "Confirm",
        disabled: true,
        emoji: { name: "YEP", id: "763616714914922527" },
        custom_id: "airline_confirm",
      };

      const CANCEL = {
        type: 2,
        style: 4,
        label: "Cancel",
        disabled: false,
        emoji: { name: "NOPE", id: "763616715036033084" },
        custom_id: "airline_cancel",
      };

      const prompt = await msg.channel.send({
        embed,
        components: [{ type: 1, components: [ CONFIRM, CANCEL ] }],
      });

      const tray = await msg.channel.send({
        content: "\u200b",
        components: [
          { type: 1, components: [SELECT_HUB] },
          { type: 1, components: [SELECT_PLANE_ONE] },
        ],
      });

      const collector = tray.createButtonCollector((int) => int.userID === msg.author.id, {
        time: 1000e3, idle: 60e3, removeButtons: false, disableButtons: true,
      });
      let hasHub;
      let hasPlane;
      let planeScore = 0;
      let hubScore = 0;
      let thisIATA;
      let planeID;
      const buttonInput = prompt.createButtonCollector((int) => int.userID === msg.author.id, {
        time: 1000e3, idle: 60e3, removeButtons: false, disableButtons: true,
      });

      buttonInput.on("click", async (i) => {
        if (i.data.custom_id === "airline_cancel") {
          prompt.embeds[0].color = 16527440;
          prompt.embeds[0].fields.push({ name: "\u200b", value: "❌" });
          prompt.edit({ embed: prompt.embeds[0], components: [] });
          await tray.delete();
        }

        if (i.data.custom_id === "airline_confirm") {
          msg.channel.send("TODO");
        }
      });

      collector.on("click", async (i) => {
        const [selection] = i.data.values || [null];
        if (i.data.custom_id === "airplane_select") {
          const air = (await STARTER_AIRPLANE_OPTIONS).find(x => x.id === selection);
          planeID = air.id;
          embed.fields[1].value = `<:${air.make}:${EMJ[air.make]}> ${RegionalIndicators(air.country)} ${air.name}`;
          planeScore = air.price || 0;
          hasPlane = true;
        }
        if (i.data.custom_id === "airline_select_hub") {
          const air = (await STARTER_AIRPORTS_OPTIONS).find((x) => x.ICAO === selection);
          embed.fields[0].value = `${RegionalIndicators(air.country)} ${air.name}`;
          thisIATA = air.IATA;
          hubScore = air.tier || 0;
          hasHub = true;
        }



        embed.fields[2].value = `${
          [...Array(hubScore).keys()].map(x => "🟣").join("") +
          [...Array(Math.min(planeScore, (6 - hubScore))).keys()].map(x => "🔵").join("") +
          [...Array(Math.max(0, hubScore + planeScore - 6)).keys()].map(x => "🔴").join("") +
          [...Array(Math.max(6 - (hubScore + planeScore), 0)).keys()].map(x => "⚫").join("")

        } \n`+
        ((hubScore + planeScore) > 6 ? "Score too high. Max is 6" : "\u200b");

        embed.image = { url: `${paths.GENERATORS}/airlines/starting.png?IATA=${thisIATA}&id=${planeID}` };

        prompt.edit({ embed });

        if ((hubScore + planeScore) > 6) {
          prompt.components[0].components[0].disabled = true;
          prompt.edit({ components: prompt.components });
        }

        if (hasHub && hasPlane && (hubScore + planeScore) <= 6) {
          prompt.components[0].components[0].disabled = false;
          prompt.edit({ components: prompt.components });
        }
      });
    }
  }
};

module.exports = {
  init,
  cmd: "airline",
  pub: false,
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["al"],
};
