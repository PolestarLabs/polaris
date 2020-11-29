module.exports = class Hangmaid {
  constructor (message, words) {
    const word = shuffle(words)[0];
    this.word = word.word;
    this.theme = word.theme;
    this.chances = 5;
    this.wordBoard = (new Array(this.word.length)).fill('_');
    this.usedLetters = [];
    this.originalMessage = undefined
  }

  async start () {
    return {
      word: this.word,
      theme: this.theme
    };
  }

  registerMessage(message) {
    return this.originalMessage = message
  }

  async renderCard () {} // todo

  handleInput (message) { // handleInput () => Object
    if (message.length > 1) {
      if (message === this.word) return { won: true} 
      else {
        this.chances--
        if (this.chances === 0) return { lost: false }
        return { originalMessage: this.originalMessage ,correct: false, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters }
      }
    }
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
        if (this.chances === 0) return { lost: true ,correct: true, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters };
        return { originalMessage: this.originalMessage ,correct: false, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters };
      }
    } else {
      idx.forEach((_) => (this.wordBoard[_.i] = message.toUpperCase()));
      if (!this.wordBoard.includes('_')) return { won: true }
      return { originalMessage: this.originalMessage ,correct: true, wordBoard: this.wordBoard, chances: this.chances, usedLetters: this.usedLetters };
    }
  }
};
