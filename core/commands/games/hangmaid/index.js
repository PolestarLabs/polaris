// @ts-check
// TODO[epic=translations] hangmaid

const cmd = "hangmaid";
const words = require("./words.json");
const Hangmaid = require("../../../archetypes/Hangmaid.js");

const init = async function (msg) {
  const game = new Hangmaid(msg, words);
  game.start()
    .then(async (data) => {
      const mainMessage = await msg.channel.send(`${paths.DASH}/generators/hangmaid?${encodeURI(`g=${data.wordSpaced}&refresh=${Date.now()}&d=${data.difficulty}&h=${data.theme}`)}`);
      game.registerMessage(mainMessage);
      await startCollector(game, msg);
    });
};

// TODO: Add language support
// TODO: Ability to play solo /  group ( group default? )
// TODO: Possibly add a specific keyword to prompt a full guess attempt

/* TODO: Optional: Add ranks just like Guessflag  (SEE LINKS)
    #  GAME MODES EXAMPLE -------------- LINK ../../../archetypes/GuessingGames.js:105
    #  POINTS CALCULATION EXAMPLE ------ LINK ../../../archetypes/GuessingGames.js:200
    #  RANKING REGISTER EXAMPLE -------  LINK ../../../commands/games/guessflag.js:46
*/


const startCollector = async (game, msg) => {
  const Collector = msg.channel.createMessageCollector((m) => m.author.id !== PLX.user.id);

  let active = true;
  const activity = setInterval(() => {
    if (!active) return Collector.stop("time");
    active = false;
  }, 30e3);

  Collector.on("message", async (me) => {
    const guess = me.content.toUpperCase();

    if (guess.length > 1) {
      // either player is talking or trying to guess
      return null;
    } else {
      me.delete();
    }
    // TODO: Translation strings
    if (!game.isFullGuess(guess) && (game.wordBoard.includes(guess) || game.incorrectLetters.includes(guess))) {
      return msg.channel.send("You already said that, honey~")
        .then((mee) => setTimeout(() => mee.delete(), 1500));
    }
    const result = await game.handleInput(guess);
    if (!result) return;
    if (result.params.e) Collector.stop();
    await result.message.delete();
    const newMsg = await msg.channel.send(`${paths.DASH}/generators/hangmaid?${
      encodeURI(`a=${result.params.a}&${result.params.e ? `e=${result.params.e}&` : ""}g=${result.params.g}&refresh=${Date.now()}&h=${result.params.h}`)
    }`);
    await game.registerMessage(newMsg);
    if (result.params.e && result.params.e === "won") return msg.channel.send("Congratulations! You guessed it!");
    if (result.params.e && result.params.e === "lose") return msg.channel.send("Oh no... you guessed it wrong. Better luck next time~");
  });

  Collector.on("end", (coll, reason) => {
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
