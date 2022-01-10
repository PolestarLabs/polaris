const newAirline = require("./new");
const newRoute = require("./routes/new");

const init = async (msg, args) => {
  msg.channel.send("and meanwhile a man was falling from space");
};

module.exports = {
  init,
  cmd: "airline",
  pub: false,
  perms: 3,
  cat: "games",
  botPerms: [ "attachFiles", "embedLinks" ],
  aliases: ["al"],
  autoSubs: [
    {
      label: "new",
      gen: newAirline,
      options: {
        aliases: ["create"],
      },
    },
  ],
};
