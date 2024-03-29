

module.exports = class RussianRoulette {
  constructor(message, value) {
    this.increment = Math.floor(value * 0.125);
    this.currentPayout = value;
    this.rounds = 5;
    this.maxValue = value - Math.floor(value * 0.125);
    this.handgunBarrel = [1, 0, 0, 0, 0, 0];
  }

  get nextValue() {
    return this.currentPayout + this.increment;
  }

  // NOTE: finish russian roulette arch
  async renderCard() { } // eslint-disable-line no-empty-function

  willSurvive() {
    return !shuffle(this.handgunBarrel)[0];
  }

  handleInput(message) {
    if (message.toLowerCase() === "stop") {
      return { stopped: true };
    } if (message.toLowerCase() === "shoot") {
      const willSurvive = this.willSurvive();
      if (!willSurvive) return { lost: true }; // rip
      this.currentChances -= 10;
      this.currentPayout = this.nextValue;
      this.rounds -= 1;
      if (this.rounds === 0) return { won: true };
      return { rounds: this.rounds };
    }
    return { invalidInput: true };
  }
};
