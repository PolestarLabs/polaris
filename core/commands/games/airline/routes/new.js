const RegionalIndicators = require("../../../../utilities/RegionalIndicators");

const newRoute = async (msg, args, aData) => {
  if (aData) {
    await promptDestinations(msg, aData.airlineName, aData.airlineID, aData.thisIATA, true, false);
  } else {
    msg.channel.send("What airline would you like to create a new route in?");
    /* await promptDestinations(msg, aData.airlineName); */
  }
};

const promptDestinations = async (msg, name, id, iata, starter = false, fromPicker = true) => {
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
        value: port.IATA,
      },
    ];
  } else {
    departureSelector.options = null; // TODO map options
  }

  const planePicker = {
    type: 3,
    custom_id: "route_plane_picker",
    placeholder: "Select an aircraft...",
  };
  if (starter) {
    const planeID = (await DB.airlines.AIRLINES.findOne(id)).acquiredPlanes[0].id;
    const plane = await DB.airlines.AIRPLANES.findOne({ id: planeID });
    planePicker.disabled = true;
    planePicker.options = [
      {
        label: plane.name,
        value: planeID,
        emoji: { name: EMJ[plane.make] },
      },
    ];
  } else {
    const acquiredPlanes = (await DB.airlines.AIRLINES.findOne(id)).acquiredPlanes.map((p) => p.id);
    planePicker.options = await DB.airlines.find({ id: acquiredPlanes }).map((plane) => {
      return {
        label: plane.name,
        value: plane.id,
        emoji: { name: EMJ[plane.make] },
      };
    });
  }

/*  const current
  const maxDistance = await DB.airlines.AIRPLANES.findOne()
  const availabeArrivalAirports = await DB.airlines.AIRPORT.find({
    location: { $near: { $geometry: { type: "Point", coordinates: port.coordinates }, $maxDistance: 216000 } },
  });*/

  const arrivalSelector = {
    type: 3,
    custom_id: "route_arrival",
    placeholder: "Select an arrival airport...",
    options: [{ label: "mock-data", value: "mock" }], // TODO map options
  };

  const embedMsg = fromPicker ? await msg.edit({ embed }) : await msg.channel.send({ embed });
  const prompt = await msg.channel.send({
    content: "\u200b",
    components: [ { type: 1, components: [departureSelector] }, { type: 1, components: [arrivalSelector] } ],
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

const buildArrivals = async (maxKm, coordinates) => {
  const availableAirports = await DB.airlines.AIRPORT.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxKm,
      },
    },
  });

  return {
    type: 3,
    custom_id: "route_arrival",
    placeholder: "Select an arrival airport...",
    options: availableAirports.map((a) => {
      return {
        label: a.name,
        value: a.IATA,
        emoji: { name: RegionalIndicators(a.country) },
      };
    }),
  };
};

module.exports = newRoute;
