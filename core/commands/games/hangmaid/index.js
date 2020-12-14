const axios = require("axios");

// @ts-nocheck
// TRANSLATE[epic=translations] hangmaid

const WORDS = require("./words.json");
const Hangmaid = require("../../../archetypes/Hangmaid.js");

const init = async function (msg, args) {
  let oldGame = Hangmaid.gameExists(msg.channel.id);
  if (oldGame) {
    await PLX.reply({
      id: oldGame,
      channel: msg.channel,
      guild: msg.guild
    }, "There's already a game going on here.");
    return;
  }
  const GAME = new Hangmaid(msg, WORDS);
  const MODE = args[0] === "group" ? "group" : "solo";

  const mainMessage = await msg.channel.send(`${paths.DASH}/generators/hangmaid?${encodeURI(`g=${GAME.GUESSES}&refresh=${Date.now()}&d=${GAME.level}&h=${GAME.HINT}`)}`);
  GAME.registerMessage(mainMessage);
  await startCollector(GAME, msg, MODE);

};

// TODO[epic=mistery]: hm - Add language support
// TODO[epic=mistery]: hm - Ability to play solo /  group ( group default? ) | in progress
// TODO[epic=mistery]: hm - Possibly add a specific keyword to prompt a full guess attempt

/* TODO[epic=mistery]: hm - Optional: Add ranks just like Guessflag  (SEE LINKS)
    #  GAME MODES EXAMPLE -------------- LINK ../../../archetypes/GuessingGames.js:105
    #  POINTS CALCULATION EXAMPLE ------ LINK ../../../archetypes/GuessingGames.js:200
    #  RANKING REGISTER EXAMPLE -------  LINK ../../../commands/games/guessflag.js:46
*/

// Need msg for the collector filter in solo mode
const startCollector = async (Game, msg, mode) => {
  let paused = false;
  const filter = mode === "group" ? (m) => m.author.id !== PLX.author.id : (m) => m.author.id === msg.author.id;
  const commandMsg = Game.originalMessage;

  const Collector = commandMsg.channel.createMessageCollector(filter, { time: 5 * 60e3 }); //5 Minutes

  let active = true;
  let activity = setInterval(() => {
    if (!active) return Collector.stop("time");
    active = false;
  }, 30e3);

  Collector.on("message", async (attemptMsg) => {
    active = true;
    if (paused) return;

    let guessClean = attemptMsg.content.toUpperCase();
    let guess = Game.sanitize(attemptMsg.content);

    const RegexCyrillic = /[а-яё]/gi;
    const RegexLatin = /[A-Z]/gi;

    if (Game.language === "ru" && !RegexCyrillic.test(guess)) {
      return attemptMsg.addReaction(_emoji("nope").reaction);
    } else if (!RegexLatin.test(guess)) return attemptMsg.addReaction(_emoji("nope").reaction);

    let attemptFullWord = false;
    if (guessClean.startsWith(">")) {
      attemptFullWord = await Game.handleFullGuess(guessClean, commandMsg, attemptMsg);
      active = true;
      paused = false;
      if (!attemptFullWord) return;
    }

    if (guess.length === 1 || guessClean.startsWith(">") || Game.isFullGuess(guess)) {
      attemptMsg.delete()
        .catch(e => 0);

      // TRANSLATE[epic=translations] Translation strings

      if (!Game.isFullGuess(guess) && (Game.wordBoard.includes(guess) || Game.incorrectLetters.includes(guess))) {
        return commandMsg.channel.send("You already said that, honey~")
          .then((warn) => setTimeout(() => warn.delete(), 1500));
      }

      const result = await Game.handleInput(guess);

      if (Game.ENDGAME) Collector.stop(Game.ENDGAME);
      await Game.originalMessage.delete()
        .catch(e => 0);

      const newMsg = await commandMsg.channel.send(`${paths.DASH}/generators/hangmaid?${
        encodeURI(`a=${Game.ATTEMPTS}&${Game.ENDGAME ? `e=${Game.ENDGAME}&` : ""}g=${Game.GUESSES}&refresh=${Date.now()}&h=${Game.theme}`)
      }`);

      await Game.registerMessage(newMsg);
    }
  });

  Collector.on("end", (col, reason) => {
    clearInterval(activity);
    Game.finish();
    if (reason === "win") return commandMsg.channel.send("Congratulations! You guessed it!");
    if (reason === "lose") return commandMsg.channel.send("Oh no... you guessed it wrong. Better luck next time~");
    if (reason === "time") return commandMsg.channel.send("Time's up");
    if (reason === "attempts") return commandMsg.channel.send("Oops! You're out of attempts...");
  });
};

module.exports = {
  init,
  cmd: "hangmaid",
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles"],
  aliases: ["hangman", "forca"],
};
