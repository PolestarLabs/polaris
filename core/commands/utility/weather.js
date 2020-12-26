const Weather = require("../../archetypes/Weather");

const init = async (msg, args) => {
  if (!args.length) msg.reply("Where though?");
  let far = false;
  if (args[0] == "F") {
    far = true;
    args.splice(0, 1);
  }
  const weather = new Weather(args.join(" "));
  weather.on("error", (code, obj) => msg.reply({
    content: "Something went wrong...",
    embed: {
      title: `Response code: ${code}`,
      description: require("util").inspect(obj._apiResponse),
      color: 0x9dd9f2,
    },
  })); // return code != 200
  weather.on("done", () => { // got API response
    if (!weather.found) {
      return msg.channel.send("Location not found :(");
    }

    // WEATHER SHOWCASE
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
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "weather",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
