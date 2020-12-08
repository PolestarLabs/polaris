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

  registerMessage(message) {
    return this.originalMessage = message;
  }

  handleInput(message) { // handleInput () => Object
    if (message.content.split(" ").length >= 3) return;
    const params = {};
    params.d = this.level;
    params.h = this.theme;
    if (message.content.split(" ").length === 2 || message.content.length > 2) {
      if (message.content.toUpperCase() === this.word.toUpperCase()) {
        params.e = "win";
        params.g = this.word;
        params.a = this.incorrectLetters.join("");
        this.ended = true;
      } else {
        params.e = "lose";
        params.g = this.wordBoard.join("");
        params.a = this.incorrectLetters.join("");
        this.ended = true;
      }
    }
    if (this.ended) return { message: this.originalMessage, params };

    const wordArray = this.word.toUpperCase().split("");
    if (!wordArray.includes(message.content.toUpperCase())) {
      this.incorrectLetters.push(message.content.toUpperCase());
      params.g = this.wordBoard.join("");
      params.a = this.incorrectLetters.join("");
      return { message: this.originalMessage, params };
    }
    for (let i = 0; i <= wordArray.length; i++) {
      if (wordArray[i] === message.content.toUpperCase()) this.wordBoard[i] = message.content;
    }
    params.g = this.wordBoard.join("");
    params.a = this.incorrectLetters.join("");
    return { message: this.originalMessage, params };
  }
};
