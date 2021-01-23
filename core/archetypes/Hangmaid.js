const games = new Map();
const yesNo = require("../structures/YesNo");

module.exports = class Hangmaid {
  constructor(message, words, mode) {
    const WORD = shuffle(words)[0];
    this.word = WORD.word;
    this.theme = WORD.theme;
    this.level = ["easy", "medium", "hard"][WORD.level];
    this.chances = 6;
    this.wordBoard = (new Array(this.word.length)).fill(" ");
    this.incorrectLetters = [];
    this.startedAt = Date.now();
    this.originalMessage = message;
    this.end = false;
    this.mode = mode
    this.channel = message.channel.id;
    games.set(message.channel.id, message.id);
  }

  sanitize(word) {
    return word
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(">", "")
      .trim();
  }

  isFullGuess(word) {
    return word.length > 1 && this.sanitize(this.word) === this.sanitize(word);
  }

  terminate(result) {
    this.end = result;
    return true;
  }

  async handleFullGuess(guess, message, guessMessage) {
    const m = await message.channel.send(`You're about to guess \`${guess.split(">")
      .join("")}\`. Is that right?`);
    return yesNo(m, guessMessage);
  }

  registerMessage(message) {
    return (this.originalMessage = message);
  }

  unregisterMessage() {
    return (this.originalMessage = null);
  }

  handleInput(guess) {
    if (this.isFullGuess(guess)) return this.terminate("win");
    //If a full guess is attepmted without triggering a correct answer, game is automatically lost
    if (guess.length > 1) return this.terminate("lose"); 

    const wordArray = this.word.toUpperCase()
      .split("");

    if (!wordArray.includes(guess)) {
      --this.chances;
      this.incorrectLetters.push(guess);
      if (this.chances === 0) return this.terminate("attempts");
      return false;
    }

    wordArray.forEach((wl, i) => (wl === guess ? (this.wordBoard[i] = guess) : null));
    if (this.sanitize(this.wordBoard.join("")) === this.sanitize(this.word)) return this.terminate("win");

    return false;
  }

  get GUESSES() {
    return this.end === "win" ? this.word : this.wordBoard.join("");
  }

  get ATTEMPTS() {
    return this.incorrectLetters.join("");
  }

  get HINT() {
    return this.theme;
  }

  get ENDGAME() {
    return this.end;
  }

  get MODE() {
    return this.mode
  }

  get SCORE() {
    // REVIEW[epic=flicky] review points
    if ((Date.now() - this.startedAt) < 30e3) return 1500; // 30s
    if ((Date.now() - this.startedAt) < 60e3) return 900; // 1m
    if ((Date.now() - this.startedAt) < 180e3) return 500; // 3m
    if ((Date.now() - this.startedAt) < 240e3) return 300; // 4m
    else return 0;
  }

  get MESSAGE() {
    return this.originalMessage;
  }

  static gameExists(channelID) {
    return games.get(channelID);
  }

  finish() {
    games.delete(this.channel);
  }
};
