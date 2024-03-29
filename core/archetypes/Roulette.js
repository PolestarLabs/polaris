/*
  BETS
  dozen: offset = block# (1-3)
  column: offset = block# (1-3)
  colour: offset: 0 = black, 1 = red  CHECK WITH BOARD IMAGE
  parity: offset: 0 = even, 1 = uneven
*/
const bets = {
  straight: { type: "straight", reward: 35, check(n) { return n === this.number; } },
  split: { type: "split", reward: 17, check(n) { return this.numbers.includes(n); } },
  street: { type: "street", reward: 11, check(n) { return this.numbers.includes(n); } },
  square: { type: "square", reward: 8, check(n) { return this.numbers.includes(n); } },
  basket: { type: "basket", reward: 6, check(n) { return [0, "d", 1, 2, 3].includes(n); } },
  dstreet: { type: "dstreet", reward: 5, check(n) { return n >= this.numbers[0] && n <= this.numbers[1]; } },
  dozen: { type: "dozen", reward: 2, check(n) { return n >= 1 + 12 * (this.offset - 1) && n <= 12 * this.offset; } }, // offset = 1-3
  column: { type: "column", reward: 2, check(n) { return !!parseInt(n) && (n - this.offset) % 3 === 0; } }, // offset = 1-3
  snake: { type: "snake", reward: 2, check(n) { return [1, 5, 9, 12, 14, 16, 19, 23, 27, 30, 32, 34].includes(n); } },
  manque: { type: "manque", reward: 1, check(n) { return n >= 1 && n <= 18; } },
  passe: { type: "passe", reward: 1, check(n) { return n >= 19 && n <= 36; } },
  colour: {
    type: "colour",
    reward: 1,
    check(n) {
      return this.offset ? this.numbers.includes(n) : !this.numbers.includes(n);
    },
    numbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  },
  parity: { type: "parity", reward: 1, check(n) { return !!parseInt(n) && (n % 2) === this.offset; } },
};

const dividers = ["-"];

const squareCheck = (n) => !!(n % 3) && n > 0 && n < 33;

const splitCheck = (n1, n2) => (n1 < n2 ? n1 - n2 === -1 && n1 % 3 !== 0 : n1 - n2 === 1 && n2 % 3 !== 0)
  || (n1 > n2 ? n1 - n2 === 3 : n2 - n1 === 3);

const streetCheck = (n1, n2) => (n1 > n2 ? n1 - n2 === 2 && n1 % 3 === 0 : n2 - n1 === 2 && n2 % 3 === 0);

const dstreetCheck = (n1, n2) => n2 - n1 === 5 && n2 % 3 === 0 && n1 <= 31;

const dozenCheck = (n1, n2) => n1 % 12 === 1 && n1 <= 25 && n2 - n1 === 11;

const games = new Map();

module.exports = class Roulette {
  constructor(msg) {
    this.guildID = msg.guild.id;
    this.users = {};
    this.winningNumber = randomize(0, 37);
    if (this.winningNumber === 37) this.winningNumber = "d";
    games.set(this.guildID, this);
  }

  /*
    Adds bet to user & updates payout
  */
  addBet(userID, bet) {
    if (!userID || !bet) throw new Error("Invalid Params");
    if (userID.id) userID = userID.id;

    if (!this.users[userID]) this.users[userID] = { payout: 0, bets: [] };
    const user = this.users[userID];

    user.bets.push(bet);
    user.payout += this.calculatePayout(bet);
  }

  getUser(userID) {
    if (!this.users[userID]) return null;
    return { bets: this.users[userID].bets.length, amount: this.users[userID].bets.reduce((a, b) => a + b.amount, 0) };
  }

  calculatePayout(bet) {
    if (bet.check(this.winningNumber)) return bet.amount * bet.reward;
    if (this.winningNumber === 0) return -(bet.amount * 0.5);
    return -bet.amount;
  }

  end() {
    return games.delete(this.guildID);
  }

  static gameExists(guildID) {
    return games.has(guildID);
  }

  /*
    Validates message content to return user's bet
  */
  static parseBet(content) {
    if (!content) return { valid: false, reason: "missingAll" };
    const valid = { valid: true };
    const params = content.split(" ");
    params.shift();

    const amount = parseInt(params[0]);
    if (Number.isNaN(amount)) return { valid: false, reason: "missingAmount" };
    if (amount === 0) return { valid: false, reason: "zeroAmount" };
    valid.amount = amount;

    const bet = params[1]?.toLowerCase();
    if (!bet) return { valid: false, reason: "missingBet" };
    if (bet.length > 7) return { valid: false, reason: "invalidBet" };
    const offset = parseInt(params[2]);

    if (bet === "basket") return { ...valid, ...bets.basket };
    if (bet === "snake" || bet === "snek") return { ...valid, ...bets.snake };
    if (bet === "manque" || bet === "low") return { ...valid, ...bets.manque };
    if (bet === "passe" || bet === "high") return { ...valid, ...bets.passe };
    if (["even", "odd", "uneven", "pair", "impair"].includes(bet)) {
      return {
        ...valid, ...bets.parity, offset: (bet === "even" || bet === "pair") ? 0 : 1,
      };
    }
    if (["red", "rouge", "noir", "black"].includes(bet)) return { ...valid, ...bets.colour, offset: (bet === "black" || bet === "noir") ? 0 : 1 };

    if (offset && offset >= 1 && offset <= 3) {
      if (["column", "col", "c"].includes(bet)) return { ...valid, ...bets.column, offset };
      if (["dozen", "dzn", "d", "12"].includes(bet)) return { ...valid, ...bets.dozen, offset };
    }

    if (bet === "square" && squareCheck(offset)) {
      return { ...valid, ...bets.square, numbers: [offset, (offset + 1), (offset + 3), (offset + 4)] };
    }

    // split and street
    if (bet === "split" && splitCheck(offset, offset + 1)) {
      return { ...valid, ...bets.split, numbers: [offset, (offset + 1)] };
    }
    if (bet === "street" && streetCheck(offset, offset + 2)) {
      return { ...valid, ...bets.street, numbers: [offset, (offset + 1), (offset + 2)] };
    }
    if (bet === "dstreet" && dstreetCheck(offset, offset + 5)) {
      return { ...valid, ...bets.dstreet, numbers: [offset, (offset + 5)] };
    }

    // smart detect
    let divider;
    for (divider of dividers) {
      if (bet.includes(divider)) break;
      else divider = null;
    }
    if (divider) {
      const splitBet = bet.split(divider);
      if (parseInt(splitBet[0]) && parseInt(splitBet[1])) {
        const n1 = parseInt(splitBet[0]);
        const n2 = parseInt(splitBet[1]);

        if (splitCheck(n1, n2)) return { ...valid, ...bets.split, numbers: n1 < n2 ? [n1, n2] : [n2, n1] };
        if (streetCheck(n1, n2)) return { ...valid, ...bets.street, numbers: n1 < n2 ? [n1, n1 + 1, n2] : [n2, n2 + 1, n1] };
        if (dstreetCheck(n1, n2)) return { ...valid, ...bets.dstreet, numbers: n1 < n2 ? [n1, n2] : [n2, n1] };
        if (dozenCheck(n1, n2)) return { ...valid, ...bets.dozen, offset: n1 === 1 ? 1 : n1 === 13 ? 2 : 3 };
      }
    }

    // straight
    if (bet === "00") return { ...valid, ...bets.straight, number: "d" };
    // parseInt will allow "1-5" (square) as 1 for example, so return.
    if (bet.length > 2) return { valid: false, reason: "invalidBet" };
    if (!Number.isNaN(parseInt(bet))) {
      const number = parseInt(bet);
      if (number >= 0 && number <= 36) return { ...valid, ...bets.straight, number };
      return { valid: false, reason: "invalidBet" };
    }

    return { valid: false, reason: "invalidBet" };
  }

  /*
    returns [ userID: payout ];
    Possibly add bets to beautify end message?
  */
  get results() {
    // [ [ userID, thing ], [ userID, thing ] ]
    return Object.entries(this.users).map((entry) => {
      const obj = {};
      [obj.userID] = entry;
      obj.cost = entry[1].bets.reduce((a, b) => a + b.amount, 0);
      obj.payout = entry[1].payout;
      return obj;
    });
  }
};
