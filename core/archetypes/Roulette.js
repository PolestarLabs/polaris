/*
	BETS
	dozen: offset = block# (1-3)
	column: offset = block# (1-3)
	colour: offset: 0 = black, 1 = red  CHECK WITH BOARD IMAGE
	parity: offset: 0 = even, 1 = uneven
*/
const bets = {
	straight: { type: "straight", reward: 8, check: n => n === this.number },
	split: { type: "split", reward: 6, check: n => this.numbers.includes(n) },
	street: { type: "street", reward: 5, check: n => this.numbers.includes(n) },
	basket: { type: "basket", reward: 4, check: n => [0, 1, 2, 3].includes(n) },
	dozen: { type: "dozen", reward: 2, check: n => n >= (1 * this.offset) && n <= (12 * this.offset) }, // offset = 1-3
	column: { type: "column", reward: 2, check: n => (n - this.offset) % 3 === 0}, // offset = 1-3
	snake: { type: "snake", reward: 1.8, check: n => this.numbers.includes(n), numbers: [1, 5, 9, 12, 14, 16, 19, 23, 27, 30, 32, 34] },
	manque: { type: "manque", reward: 1.5, check: n => n >= 1 && n <= 18 },
	passe: { type: "passe", reward: 1.5, check: n => n >= 19 && n <= 36 },
	colour: { type: "colour", reward: 1.5, check: n => this.offset ? !this.numbers.includes(n) : this.numbers.includes(n), numbers: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35] },
	parity: { type: "parity", reward: 1.5, check: n => (n % 2) === (this.offset ? 1 : 0) },
};

const dividers = [ "-" ];

const splitCheck = (n1, n2) => {
	n1 !== 0 && n2 !== 0 &&
	(
		(
			(n1 - n2 === 1 || n1 - n2 === -1) &&
			(n1 < n2 ? n1 : n2) % 3 != 0
		) ||
		(n1 > n2 ? n1 - n2 === 3 : n2 - n1 === 3)
	);
};

const streetCheck = (n1, n2) => {
	n1 !== 0 && n2 !== 0 &&
	(n1 > n2 ? n1 - n2 === 2 && n1 % 3 === 0 : n2 - n1 === 2 && n2 % 3 === 0) &&
	(
		(n1 > n2 && n1 % 3 === 0) ||
		(n2 > n1 && n2 % 3 === 0)
	);
};


module.exports = class Roulette {
	constructor() {
		this.users = {};
		this.winningNumber = Math.floor(Math.random * 37);
	}


	/*
		Adds bet to user & updates payout
	*/
	addBet(userID, bet) {
		if (userID.id) userID = userID.id;

		if (!this.users[userID]) this.users[userID] = { payout: 0, bets: [] };
		const user = this.users[userID];

		user.bets.push(bet);
		if (bet.check(this.winningNumber)) user.payout += bet.amount * (bet.reward - 1);
		else user.payout -= bet.amount;
	}

	/*
		Validates message content to return user's bet
	*/
	parseBet(content) {
		const valid = { valid: true };
		const params = content.split(" ");
		params.shift();

		const amount = parseInt(params[0]);
		if (!amount) return { valid: false, reason: "missingAmount" };
		else valid.amount = amount;

		// const bet = params[1]?.toLowerCase();
		let bet = 0;
		let offset = params[2];
		if (!bet) return { valid: false, reason: "missingBet" };
		if (bet.length > 6) return { valid: false, reason: "invalidBet" };

		// straight
		if (parseInt(bet)) {
			const number = parseInt(bet);
			if (number >= 0 && number <= 36) return { ...valid, number: number, ...bets.straight };
			else return { valid: false, reason: "invalidBet" };
		}

		if (bet === "basket") return { ...valid, ...bets.basket };
		if (bet === "snake") return { ...valid, ...bets.snake };
		if (bet === "manque") return { ...valid, ...bets.manque };
		if (bet === "passe") return { ...valid, ...bets.passe };
		if (bet === "even" || bet === "oneven") return { ...valid, ...bets.parity, offset: bet === "even" ? 0 : 1 };
		if (bet === "red" || bet === "black") return { ...valid, ...bets.colour, offset: bet === "black" ? 0 : 1 };

		if (parseInt(offset) && parseInt(offset) >= 1 && parseInt(offset) <= 3) {
			offset = parseInt(offset);
			if (bet === "column") return { ...valid, offset: offset, ...bets.column };
			if (bet === "dozen") return { ...valid, offset: offset, ...bets.dozen };
		}

		// split and street
		bet = bet.split("");
		if (parseInt(bet[0]) && dividers.includes(bet[1].toLowerCase()) && parseInt(bet[2])) {
			const n1 = parseInt(bet[0]),
				n2 = parseInt(bet[2]);

			console.log(`n1: ${n1}, n2: ${n2}, split: ${splitCheck(n1, n2)}, street: ${streetCheck(n1, n2)}`);
			if (splitCheck(n1, n2)) return { ...valid, ...bets.split, numbers: [n1, n2] };
			if (streetCheck(n1, n2)) return { ...valid, ...bets.street, numbers: [n1, n2, n1 < n2 ? n1 + 1 : n2 + 1] };
		}

		return { valid: false, reason: "invalidBet" };
	}

	/*
		returns [ userID: payout ];
		Possibly add bets to beautify end message?
	*/
	get results() {
		return Object.entries(this.users).map(entry => {
			let obj = {};
			obj[entry[0]] = entry[1].payout;
			return obj;
		});
	}
};
