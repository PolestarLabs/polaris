const Airline = require("../../archetypes/Airline");

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
      let filter = (m) => m.author.id === msg.author.id && m.content.match(/^([A-Z0-9]{4})$/);
      const c1 = await msg.channel.awaitMessages(filter, { time: 30e3, maxMatches: 1 });
      const airlineID = c1[0].content;

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
        options: [
          {
            label: "Los Angeles (LAX)",
            value: "lax-5",
            description: "Cost: 💲💲💲💲💲",
            emoji: { name: "🇺🇸" },
          },
          {
            label: "New York, Kennedy (JFK)",
            value: "jfk-5",
            description: "Cost: 💲💲💲💲💲",
            emoji: { name: "🇺🇸" },
          },
          {
            label: "London, Heathrow (LHR)",
            value: "lhr-5",
            description: "Cost: 💲💲💲💲💲",
            emoji: { name: "🇬🇧" },
          },
          {
            label: "Dubai (DXB)",
            value: "dbx-5",
            description: "Cost: $$$$$",
            emoji: { name: "🇦🇪" },
          },
          {
            label: "São Paulo, Guarulhos (GRU)",
            value: "gru-4",
            description: "Cost: $$$$",
            emoji: { name: "🇧🇷" },
          },
          {
            label: "San Francisco (SFO)",
            value: "sfo-4",
            description: "Cost: $$$$",
            emoji: { name: "🇺🇸" },
          },
          {
            label: "Rio de Janeiro (GIG)",
            value: "gig-4",
            description: "Cost: $$$$",
            emoji: { name: "🇧🇷" },
          },
          {
            label: "Frankfurt (FRA)",
            value: "fra-4",
            description: "Cost: $$$$",
            emoji: { name: "🇩🇪" },
          },
          {
            label: "Paris, Charles de Gaulle (CDG)",
            value: "cdg-3",
            description: "Cost: $$$",
            emoji: { name: "🇫🇷" },
          },
          {
            label: "Tokyo, Haneda (HND)",
            value: "hnd-3",
            description: "Cost: $$$",
            emoji: { name: "🇯🇵" },
          },
          {
            label: "Moscow, Sheremetyevo (SVO)",
            value: "svo-2",
            description: "Cost: $$",
            emoji: { name: "🇷🇺" },
          },
          {
            label: "Sydney (SYD)",
            value: "syd-2",
            description: "Cost: $$",
            emoji: { name: "🇦🇺" },
          },
          {
            label: "Cairo (CAI)",
            value: "cai-2",
            description: "Cost: $$",
            emoji: { name: "🇪🇬" },
          },
          {
            label: "Shangai, Pudong (PVG)",
            value: "pvg-2",
            description: "Cost: $$",
            emoji: { name: "🇨🇳" },
          },
        ],
      };

      msg.channel.send({
        embed: { title: "Choose your starter airport and your starter plane" },
        components: [
          { type: 1, components: [SELECT_HUB] },
        ],
      });
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
