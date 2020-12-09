// @ts-check
// TRANSLATE[epic=translations] hangmaid

const cmd = "hangmaid";
const words = require("./words.json");
const Hangmaid = require("../../../archetypes/Hangmaid.js");
const init = async function (msg, args) {
  const game = new Hangmaid(msg, words);
  const mode = args[0] === "group" ? "group" : "solo";
  game.start()
    .then(async (data) => {
      const mainMessage = await msg.channel.send(`${paths.DASH}/generators/hangmaid?${encodeURI(`g=${data.wordSpaced}&refresh=${Date.now()}&d=${data.difficulty}&h=${data.theme}`)}`);
      game.registerMessage(mainMessage);
      await startCollector(game, msg, mode);
    });
};

// TODO[epic=mistery]: Add language support
// TODO[epic=mistery]: Ability to play solo /  group ( group default? ) | in progress
// TODO[epic=mistery]: Possibly add a specific keyword to prompt a full guess attempt

/* TODO[epic=mistery]: Optional: Add ranks just like Guessflag  (SEE LINKS)
    #  GAME MODES EXAMPLE -------------- LINK ../../../archetypes/GuessingGames.js:105
    #  POINTS CALCULATION EXAMPLE ------ LINK ../../../archetypes/GuessingGames.js:200
    #  RANKING REGISTER EXAMPLE -------  LINK ../../../commands/games/guessflag.js:46
*/

const startCollector = async (game, msg, mode) => {
  let stopped = false;
  let filter;
  if (mode === "group") {
    filter = (m) => m.author.id !== PLX.author.id;
  } else {
    filter = (m) => m.author.id === m.author.id;
  }
  const Collector = msg.channel.createMessageCollector(filter);

  let active = true;
  let activity = setInterval(() => {
    if (!active) return Collector.stop("time");
    active = false;
  }, 30e3);

  active = true;
  Collector.on("message", async (me) => {
    if (stopped) return;
    if (!new RegExp(/[A-Za-z]/).test(me.content)) return me.addReaction("NOPE:763616715036033084");
    let guess = me.content.toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // HANDLING THE GUESS ---------
    if (me.content.startsWith(">")) {
      stopped = true
      const handler = await game.handleFullGuess(guess, msg, me);
      if (!handler) {
        stopped = false;
        return activity = setInterval(() => {
          if (!active) return Collector.stop("time");
          active = false;
        }, 30e3);
      } else {
        stopped = false;
      }
    }

    if (guess.length > 1 && !guess.startsWith(">")) {
      // player is talking
      return null;
    } else {
      me.delete();
    }
    // TRANSLATE[epic=translations] Translation strings
    if (!game.isFullGuess(guess) && (game.wordBoard.includes(guess) || game.incorrectLetters.includes(guess))) {
      return msg.channel.send("You already said that, honey~")
        .then((warn) => setTimeout(() => warn.delete(), 1500));
    }

    if (guess.startsWith(">")) guess = guess.replace(">", "");
    const result = await game.handleInput(guess);
    if (!result) return;
    if (result.params.e) Collector.stop();
    await result.message.delete();
    const newMsg = await msg.channel.send(`${paths.DASH}/generators/hangmaid?${
      encodeURI(`a=${result.params.a}&${result.params.e ? `e=${result.params.e}&` : ""}g=${result.params.g}&refresh=${Date.now()}&h=${result.params.h}`)
    }`);
    if (result.params.e && result.params.e === "win") return msg.channel.send("Congratulations! You guessed it!");
    if (result.params.e && result.params.e === "lose") return msg.channel.send("Oh no... you guessed it wrong. Better luck next time~");
    await game.registerMessage(newMsg);
  });

  Collector.on("end", (a, b) => {
    clearInterval(activity);
  });
};

module.exports = {
  init,
  cmd,
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles"],
  aliases: ["hangman", "forca"],
};
