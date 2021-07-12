const axios = require("axios");

// @ts-nocheck
// TRANSLATE[epic=translations] hangmaid

const WORDS = require("./words.json");
const Hangmaid = require("../../../archetypes/Hangmaid.js");

const init = async function (msg, args) {
  const oldGame = Hangmaid.gameExists(msg.channel.id);
  if (oldGame) {
    await PLX.reply({
      id: oldGame,
      channel: msg.channel,
      guild: msg.guild,
    }, "There's already a game going on here.");
    return;
  }
  const MODE = args[0] === "solo" ? "solo" : "server";
  const GAME = new Hangmaid(msg, WORDS, MODE);
  console.log(GAME.word)

  const embed = {
    description: `The word's theme is ${GAME.HINT}\nYou have 30 seconds to guess a letter.\nUse \`> your answer here\` to guess the word. *Be aware: if you miss it, it's game over!*`,
    image: {
      url: `${paths.DASH}/generators/hangmaid?${encodeURI(`g=${GAME.GUESSES}&refresh=${Date.now()}&d=${GAME.level}&h=${GAME.HINT}`)}`
    },
    title: "Game's on!",
    color: numColor(_UI.colors.cyan)
  };

  const mainMessage = await msg.channel.send({ embed: embed });
  GAME.registerMessage(mainMessage);
  await startCollector(GAME, msg, MODE);
};

// TODO[epic=mistery]: hm - Add language support

/* TODO[epic=mistery]: hm - Optional: Add ranks just like Guessflag  (SEE LINKS)
    #  GAME MODES EXAMPLE -------------- LINK ../../../archetypes/GuessingGames.js:105
    #  POINTS CALCULATION EXAMPLE ------ LINK ../../../archetypes/GuessingGames.js:200
    #  RANKING REGISTER EXAMPLE -------  LINK ../../../commands/games/guessflag.js:46
*/

// Need msg for the collector filter in solo mode
const startCollector = async (Game, msg, mode) => {
  let paused = false;
  const filter = mode === "server" ? (m) => m.author.id !== PLX.user.id : (m) => m.author.id === msg.author.id;
  const commandMsg = Game.originalMessage;

  const Collector = commandMsg.channel.createMessageCollector(filter, { time: 5 * 60e3 }); // 5 Minutes

  let active = true;
  const activity = setInterval(() => {
    if (!active) return Collector.stop("time");
    active = false;
  }, 30e3);

  Collector.on("message", async (attemptMsg) => {
    active = true;
    if (paused) return;

    const guessClean = attemptMsg.content.toUpperCase();
    const guess = Game.sanitize(attemptMsg.content);

    const RegexCyrillic = /[а-яё]/gi;
    const RegexLatin = /[A-Z]/gi;

    if (!Game.originalMessage) {
      return attemptMsg.delete();
    }

    if (Game.language === "ru" && !RegexCyrillic.test(guess)) {
      return attemptMsg.addReaction(_emoji("nope").reaction);
    }
    if (!RegexLatin.test(guess)) return attemptMsg.addReaction(_emoji("nope").reaction);

    let attemptFullWord = false;
    if (guessClean.startsWith(">")) {
      attemptFullWord = await Game.handleFullGuess(guessClean, commandMsg, attemptMsg);
      active = true;
      paused = false;
      if (!attemptFullWord) return;
    }

    if (guess.length === 1 || guessClean.startsWith(">") || Game.isFullGuess(guess)) {
      attemptMsg.delete()
        .catch((e) => 0);

      // TRANSLATE[epic=translations] Translation strings

      if (!Game.isFullGuess(guess) && (Game.wordBoard.includes(guess) || Game.incorrectLetters.includes(guess))) {
        return commandMsg.channel.send("You already said that, honey~")
          .then((warn) => setTimeout(() => warn.delete(), 1500));
      }

      await Game.originalMessage.delete()
        .catch((e) => 0);
      Game.unregisterMessage();
      await Game.handleInput(guess);

      const newEmbed = {
        color: numColor(_UI.colors.cyan),
        title: "Game's on!",
        description: `The word's theme is \`${Game.HINT}\`\nYou have 30 seconds to guess a letter.\nUse \`> your answer here\` to guess the word. *Be aware: if you miss it, it's game over!*`,
        image: {
          url: `${paths.DASH}/generators/hangmaid?${encodeURI(`a=${Game.ATTEMPTS}&${Game.ENDGAME ? `e=${Game.ENDGAME === "win" ? "win" : "lose"}&` : ""}g=${Game.GUESSES}&refresh=${Date.now()}&h=${Game.theme}`)
            }`
        }
      };

      if (Game.ENDGAME) {
        Game.finish();
        Collector.stop(Game.ENDGAME);
        switch (Game.ENDGAME) {
          case "attempts":
            newEmbed.title = _emoji("NOPE").no_space + " Oopsie... you're out of attempts!";
            newEmbed.description = "";
            newEmbed.color = numColor(_UI.colors.warning);
            break;
          case "win":
            newEmbed.title = ":tada: Congratulations! You guessed it!";
            newEmbed.description = `You scored ${Game.SCORE} points with grade ${Game.GRADE}.`;
            newEmbed.color = numColor(_UI.colors.success);
            Progression.emit("play.hangmaid.win", { msg, userID: msg.author.id });
            Progression.emit("streak.hangmaid.win", { msg, userID: msg.author.id });

            break;
          case "lose":
            newEmbed.title = _emoji("NOPE").no_space + " Oh, dear, you missed it... better luck next time~";
            newEmbed.description = "";
            newEmbed.color = numColor(_UI.colors.danger);
            Progression.emit("play.hangmaid.lose", { msg, userID: msg.author.id });
            Progression.emit("streak.hangmaid.win", { valueSet:0,msg, userID: msg.author.id });
        }
      }

      const newMsg = await msg.channel.send({ embed: newEmbed });
      Game.registerMessage(newMsg);

    }
  });

  Collector.on("end", async (col, reason) => {
    Game.finish();
    clearInterval(activity);
    if (reason === "time") return commandMsg.channel.send(":hourglass: Ah, you took too long.");
    if (reason === "win") {
      const payload = {
        points: Game.SCORE,
        timestamp: Date.now(),
        data: {
          rounds: Game.shots,
          word: Game.GUESSES,
          score: Game.SCORE,
          grade: Game.GRADE,
          time: ~~((Date.now() - Game.startedAt) / 1000),
        },
      };
      console.log(Game)
      if (Game.MODE === "solo") {
        payload.id = `${Game.userMessage.author.id}`;
        payload.type = "hangmaid-solo";
      } else if (Game.MODE === "server") {
        payload.id = `${commandMsg.guild.id}`;
        payload.type = "hangmaid-server";
      }

      await DB.rankings.collection.insert(payload);
    }
  });
};

module.exports = {
  init,
  cmd: "hangmaid",
  pub: true,
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles"],
  aliases: ["forca", "hm"],
};
