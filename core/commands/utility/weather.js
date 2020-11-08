const Weather = require("../../archetypes/Weather");

const init = async (msg, args) => {
    if (!args.length) msg.reply("Where though?");
    const weather = new Weather(args.join(" "));
    weather.on("error", code => msg.reply("Something went wrong...")); // return code != 200
    weather.on("done", () => { // got API response
      // WEATHER SHOWCASE
      const inspect = require("util").inspect;
      const now = inspect(weather.now);
      const week = inspect([weather.week[0], weather.week[2], "and more..."], {depth: 1});
      const loc = inspect(weather.location);
      msg.channel.send({ 
        embed: {
          title: "Weather properties",
          color: 0x9dd9f2,
          fields: [
            {
              name: "location",
              value: `\`\`\`js\n${loc}\`\`\``,
            },
            {
              name: "now",
              value: `\`\`\`js\n${now}\`\`\``,
            },
            {
              name: "week",
              value: `\`\`\`js\n${week}\`\`\``,
            },
          ]
        }
      });
    });
}

module.exports = {
  init,
  pub: true,
  cmd: "weather",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
