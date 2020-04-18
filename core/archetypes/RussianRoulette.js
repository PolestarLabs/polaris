const handgunBarrel =[0, 0, 0, 1, 0, 0]

module.exports = class RussianRoulette {
  constructor (message, value) {
    this.money = value * 0.25
    this.currentValue = value
    this.rounds = 5
    this.maxValue = value - value * 0.25
  }

  get nextValue () {
    return this.currentValue + this.money
  }

  async renderCard () {} // todo

  willSurvive () {
    return !Boolean(shuffle(handgunBarrel)[0])
  }

  handleInput (message) {
    if (message.toLowerCase() === 'stop') {
      return { stopped: true }
    } else if (message.toLowerCase() === 'shoot') {
      const willSurvive = this.willSurvive()
      if (!willSurvive) return { lost: true } // rip
      this.currentChances -= 10
      this.currentValue = this.nextValue
      this.rounds -= 1
      if (this.rounds === 0) return { won: true }
      return { rounds: this.rounds, currentValue: this.currentValue }
    } else {
      return { invalidInput: true }
    }
  }
}
