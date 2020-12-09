// @ts-check
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

const startCollector = async (game, msg) => {
  const Collector = msg.channel.createMessageCollector((m) => m.author.id !== PLX.user.id);

  let active = true;
  const activity = setInterval(() => {
    if (!active) return Collector.stop("time");
    active = false;
  }, 30e3);

  Collector.on("message", async (me) => {
    const guess = me.content.toUpperCase();

    if (guess.split(" ").length >= 3) {
      // player is talking - considering 3+ words a full sentence and 2- words a guess
      return null;
    } else {
      me.delete();
    }

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
    if (result.params.e && result.params.e === "win") return msg.channel.send("Congratulations! You guessed it!");
    if (result.params.e && result.params.e === "lose") return msg.channel.send("Oh no... you guessed it wrong. Better luck next time~");
    await game.registerMessage(newMsg);
  });

  Collector.on("end", (
  ) => {
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
