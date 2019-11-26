module.exports = class Hangmaid {
  constructor (message, words) {
    const word = shuffle(words)[0];
    this.word = word.word;
    this.theme = word.theme;
    this.chances = 5;
    this.wordBoard = (new Array(this.word.length)).fill('_');
    this.usedLetters = [];
  }

  async start () {
    return {
      word: this.word,
      theme: this.theme
    };
  }

  async renderCard () {} // todo

  handleInput (message) { // handleInput () => Object
    const idx = this.word.split('').map((a, i) => {
      return { is: (a === message.toLowerCase()), i }
    }).filter(a => a.is)

    this.usedLetters.push(message.toLowerCase());
    if (!idx[0]) {
      console.log(this.word)
      console.log(message)
      if (this.word === message.toLowerCase()) return { won: true }
      else {
        this.chances--;
        if (this.chances === 0) return { lost: true };
        return { correct: false, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters };
      }
    } else {
      idx.forEach((_) => (this.wordBoard[_.i] = message.toUpperCase()));
      if (!this.wordBoard.includes('_')) return { won: true }
      return { correct: true, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters };
    }
  }
};
