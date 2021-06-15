module.exports = { // FIXME[epic=flicky] This doesn't seem to be used anywhere?

  gamechange: function gamechange(gamein = false) {
    try {
      if (gamein !== false) return gamein;
      delete require.cache[require.resolve("../../resources/lists/playing.js")];
      const gamelist = require("../../resources/lists/playing.js");
      const max = gamelist.games.length - 1;
      const rand = this.randomize(0, max);

      return gamelist.games[rand];
    } catch (e) {
      return null;
    }
  },

};
