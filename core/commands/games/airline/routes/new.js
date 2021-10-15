const RegionalIndicators = require("../../../../utilities/RegionalIndicators");

const newRoute = async (msg, args, aData) => {
  if (aData) {
    await promptDestinations(msg, aData.airlineName, aData.thisIATA, true);
  } else {
    msg.channel.send("What airline would you like to create a new route in?");
    /* await promptDestinations(msg, aData.airlineName); */
  }
};

const promptDestinations = async (msg, name, iata, starter = false, fromPicker = true) => {
  const embed = {
    title: `New route for ${name}`,
    description: iata ? "The first route is free." : "Cost: X",
    fields: [
      {
        name: "🛫 Departure",
        value: "-",
        inline: true,
      },
      {
        name: "🛬 Arrival",
        value: "-",
        inline: true,
      },
    ],
  };

  const departureSelector = {
    type: 3,
    custom_id: "route_departure",
    placeholder: "Select a departure airport...",
  };
  if (starter) {
    const port = await DB.airlines.AIRPORT.findOne({ IATA: iata });
    embed.fields[0].value = `${RegionalIndicators(port.country)} ${port.name}`;
    departureSelector.options = [
      {
        label: port.name,
        emoji: { name: RegionalIndicators(port.country) },
        default: true,
        value: port.thisIATA,
      },
    ];
  } else {
    departureSelector.options = null; // TODO map options
  }

  const arrivalSelector = {
    type: 3,
    custom_id: "route_arrival",
    placeholder: "Select an arrival airport...",
    options: [{ label: "mock-data", value: "mock" }], // TODO map options
  };

  const embedMsg = fromPicker ? await msg.edit({ embed }) : await msg.channel.send({ embed });
  const prompt = await msg.channel.send({
    content: "",
    components: [ { type: 1, components: departureSelector }, { type: 1, components: arrivalSelector } ],
  });

  prompt.createButtonCollector((i) => i.userID === msg.author.id, {
    time: 1000e3, idle: 60e3, removeButtons: false, disableButtons: true,
  });

  prompt.on("buttonClick", async (i) => {
    const [selection] = i.data.values || [null];
    if (i.data.custom_id === "route_departure") {
      embed.fields[0].value = selection;
      await embedMsg.edit({ embed });
    }
  });
};

module.exports = newRoute;
