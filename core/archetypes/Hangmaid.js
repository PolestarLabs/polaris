const games = new Map();
const yesNo = require("../structures/YesNo");
module.exports = class Hangmaid {
  constructor(message, words) {
    const WORD = shuffle(words)[0];
    this.word = WORD.word;
    this.theme = WORD.theme;
    this.level = WORD.level === 1 ? "Easy" : WORD.level === 2 ? "Medium" : "Hard";
    this.chances = 5;
    this.wordBoard = (new Array(this.word.length)).fill(" ");
    this.incorrectLetters = [];
    this.originalMessage = message;
    this.end = false;
    this.channel = message.channel.id
    games.set(message.channel.id, message.id);
  }

  sanitize(word){
    return word
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace('>','')
      .trim();
  }

  isFullGuess(word) {
    return word.length > 1 && this.sanitize(this.word) === this.sanitize(word);
  }

  terminate(result) {
    this.end = result;
    result === "win" ? this.word : this.wordBoard.join("");
    return true;
  }

  async handleFullGuess(guess, message, guessMessage) {
    const m = await message.channel.send(`You're about to guess \`${guess}\`. Is that right?`);
    return (await yesNo(m, guessMessage));
  }

  registerMessage(message) {
    return this.originalMessage = message;
  }

  handleInput(guess) { // handleInput () => Object

    if (this.isFullGuess(guess)) return this.terminate("win");
    else if (guess.length > 1) return this.terminate("lose");

    const wordArray = this.word.toUpperCase().split("");

    if (!wordArray.includes(guess)) {
      this.incorrectLetters.push(guess);
      if (this.incorrectLetters.length > this.chances) return this.terminate("lose");
      return false;
    }

    wordArray.forEach((wl, i) => wl === guess ? this.wordBoard[i] = guess : null);
    if (this.sanitize(this.wordBoard.join('')) === this.sanitize(this.word)) return this.terminate("win");
    
    return false;
  }

  get GUESSES(){ return this.end === "win" ? this.word : this.wordBoard.join("") }

  get ATTEMPTS(){ return this.incorrectLetters.join("") }

  get HINT(){ return this.theme }

  get ENDGAME(){ return this.end }

  static gameExists(channelID) {
    return games.get(channelID);
  }

  finish(){
    games.delete(this.channel);
  }

};
