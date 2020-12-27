const { resolveFile } = require("../../../../event-instance/core/utilities/Gearbox/global");
const Weather = require("../../archetypes/Weather");

const init = async (msg, args) => {
  if (!args.length) msg.reply("Where though?");

  let far = false;
  if (args[0] === "F") { // NOTE document that Farenheit is an option
    far = true;
    args.splice(0, 1);
  }

  const weather = new Weather();

  try {
    await weather.initiate(args.join(" "));
  } catch (code) {
    if (code instanceof Error) return msg.reply("Location has to be of a-Z characters."); // or _- and some more.
    return msg.reply(`${code} - Couldn't connect with the API`); // probably...
  }

  if (!weather.found) return msg.channel.send("Location not found :(");

  // ANCHOR WEATHER SHOWCASE -- not actual cmd
  if (far) weather.setUnit("F");
  const { inspect } = require("util");
  const now = inspect(weather.now);
  const week = inspect([weather.week[0], weather.week[2], "and more..."], { depth: 1 });
  const loc = inspect(weather.location);

  
  let payload =  {};
  payload.city =  weather.location.city;
  payload.region=  weather.location.region;
  payload.country=  weather.location.country;
  payload.timezone_id=  weather.location.timezone_id;
  payload.temp = weather.now.curr
  payload.sunset = weather.now.sunset
  payload.sunrise = weather.now.sunrise
  payload.text = weather.now.text
  payload.code = weather.now.code
  payload.week = [
    weather.week[0],
    weather.week[1],
    weather.week[2],
  ];


  let buffer = new Buffer(JSON.stringify(payload)).toString('base64');

  /*
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

  msg.channel.send(""
  ,{file: await resolveFile(`${paths.DASH}/generators/weather.png?furball=${encodeURIComponent(buffer)}`), name: 'weather.png'})
  
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
