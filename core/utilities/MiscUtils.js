module.exports = {
  
  gamechange : function gamechange(gamein = false) {
        try {
            if (gamein != false) return gamein;
            delete require.cache[require.resolve(`../../utils/lists/playing.js`)];
            var gamelist = require("../../utils/lists/playing.js");
            var max = gamelist.games.length-1
            var rand = this.randomize(0, max)

            return gamelist.games[rand]

        } catch (e) {}
    },
  
  
}