module.exports = class Hangmaid {
  constructor(message, words) {
    const word = shuffle(words)[0];
    this.word = word.word;
    this.theme = word.theme;
    this.level = word.level === 1 ? "Easy" : word.level === 2 ? "Medium" : "Hard";
    this.chances = 5;
    this.wordBoard = (new Array(this.word.length)).fill(" ");
    this.incorrectLetters = [];
    this.ended = false;
    this.originalMessage = undefined;
  }

  async start() {
    return {
      word: this.word,
      theme: this.theme,
      difficulty: this.level,
      wordSpaced: this.wordBoard.join(""),
    };
  }

  isFullGuess(word) {
    return word.length > 1 && this.word.toUpperCase() === word.toUpperCase();
  }

  terminate(result) {
    const params = {};
    params.d = this.level;
    params.h = this.theme;
    params.e = result;
    params.g = result === "win" ? this.word : this.wordBoard.join("");
    params.a = this.incorrectLetters.join("");
    return {
      message: this.originalMessage,
      params
    };
  }

  registerMessage(message) {
    return this.originalMessage = message;
  }

  handleInput(guess) { // handleInput () => Object
    guess = guess.toUpperCase();

    const params = {};
    params.d = this.level;
    params.h = this.theme;

    if (this.isFullGuess(guess)) {
      params.e = "win";
      params.g = this.word;
      params.a = this.incorrectLetters.join("");
      return this.terminate("win");
    } else {
      if (guess.length > 1 && guess.split(" ").length <= 2) {
        //check if it's not a letter and if it's a guess (2 words or less, full sentence 3+)
        params.e = "lose";
        params.g = this.wordBoard.join("");
        params.a = this.incorrectLetters.join("");
        return this.terminate("lose");
      }
    }

    const wordArray = this.word.toUpperCase()
      .split("");
    if (!wordArray.includes(guess)) {
      this.incorrectLetters.push(guess);
      params.g = this.wordBoard.join("");
      params.a = this.incorrectLetters.join("");
      return {
        message: this.originalMessage,
        params
      };
    }

    wordArray.forEach((wl, i) => wl === guess ? this.wordBoard[i] = guess : null);
    if (!this.wordBoard.includes(" ")) return this.terminate("win");

    params.g = this.wordBoard.join("");
    params.a = this.incorrectLetters.join("");
    return {
      message: this.originalMessage,
      params
    };
  }
};
