const Roulette = require("../../core/archetypes/Roulette");
const { createMessage } = require("../helpers/factories");

describe("Roulette", () => {
  let msg;

  beforeEach(() => {
    msg = createMessage({ guildId: "guild-roulette-test" });
  });

  // ────────────────────────────────────────────────────────
  //  parseBet — the core pure-logic parser
  // ────────────────────────────────────────────────────────
  describe("parseBet", () => {
    describe("validation", () => {
      it("rejects empty input", () => {
        expect(Roulette.parseBet(null)).toEqual({ valid: false, reason: "missingAll" });
        expect(Roulette.parseBet("")).toEqual({ valid: false, reason: "missingAll" });
      });

      it("rejects missing amount", () => {
        const r = Roulette.parseBet("roulette abc");
        expect(r.valid).toBe(false);
        expect(r.reason).toBe("missingAmount");
      });

      it("rejects zero amount", () => {
        const r = Roulette.parseBet("roulette 0 red");
        expect(r.valid).toBe(false);
        expect(r.reason).toBe("zeroAmount");
      });

      it("rejects missing bet type", () => {
        const r = Roulette.parseBet("roulette 100");
        expect(r.valid).toBe(false);
        expect(r.reason).toBe("missingBet");
      });

      it("rejects overly long bet names", () => {
        const r = Roulette.parseBet("roulette 100 longbetname");
        expect(r.valid).toBe(false);
        expect(r.reason).toBe("invalidBet");
      });

      it("rejects invalid straight numbers", () => {
        const r = Roulette.parseBet("roulette 100 37");
        expect(r.valid).toBe(false);
      });
    });

    describe("simple bets", () => {
      it("parses basket bet", () => {
        const r = Roulette.parseBet("roulette 100 basket");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("basket");
        expect(r.amount).toBe(100);
        expect(r.reward).toBe(6);
      });

      it("parses snake bet", () => {
        const r = Roulette.parseBet("roulette 50 snake");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("snake");
        expect(r.reward).toBe(2);
      });

      it("parses snek alias for snake", () => {
        const r = Roulette.parseBet("roulette 50 snek");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("snake");
      });

      it("parses manque/low bet", () => {
        const r1 = Roulette.parseBet("roulette 100 manque");
        const r2 = Roulette.parseBet("roulette 100 low");
        expect(r1.valid).toBe(true);
        expect(r1.type).toBe("manque");
        expect(r2.valid).toBe(true);
        expect(r2.type).toBe("manque");
      });

      it("parses passe/high bet", () => {
        const r1 = Roulette.parseBet("roulette 100 passe");
        const r2 = Roulette.parseBet("roulette 100 high");
        expect(r1.valid).toBe(true);
        expect(r1.type).toBe("passe");
        expect(r2.valid).toBe(true);
        expect(r2.type).toBe("passe");
      });
    });

    describe("colour bets", () => {
      it("parses red", () => {
        const r = Roulette.parseBet("roulette 100 red");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("colour");
        expect(r.offset).toBe(1);
      });

      it("parses rouge as red", () => {
        const r = Roulette.parseBet("roulette 100 rouge");
        expect(r.valid).toBe(true);
        expect(r.offset).toBe(1);
      });

      it("parses black", () => {
        const r = Roulette.parseBet("roulette 100 black");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("colour");
        expect(r.offset).toBe(0);
      });

      it("parses noir as black", () => {
        const r = Roulette.parseBet("roulette 100 noir");
        expect(r.valid).toBe(true);
        expect(r.offset).toBe(0);
      });
    });

    describe("parity bets", () => {
      it("parses even", () => {
        const r = Roulette.parseBet("roulette 100 even");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("parity");
        expect(r.offset).toBe(0);
      });

      it("parses odd", () => {
        const r = Roulette.parseBet("roulette 100 odd");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("parity");
        expect(r.offset).toBe(1);
      });

      it("parses pair/impair", () => {
        expect(Roulette.parseBet("roulette 100 pair").offset).toBe(0);
        expect(Roulette.parseBet("roulette 100 impair").offset).toBe(1);
      });
    });

    describe("column and dozen bets", () => {
      it("parses column 1-3", () => {
        for (let col = 1; col <= 3; col++) {
          const r = Roulette.parseBet(`roulette 100 column ${col}`);
          expect(r.valid).toBe(true);
          expect(r.type).toBe("column");
          expect(r.offset).toBe(col);
        }
      });

      it("parses dozen with aliases", () => {
        for (const alias of ["dozen", "dzn", "d", "12"]) {
          const r = Roulette.parseBet(`roulette 100 ${alias} 2`);
          expect(r.valid).toBe(true);
          expect(r.type).toBe("dozen");
          expect(r.offset).toBe(2);
        }
      });

      it("parses col alias for column", () => {
        const r = Roulette.parseBet("roulette 100 col 1");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("column");
      });
    });

    describe("straight bets", () => {
      it("parses single number 0-36", () => {
        for (const n of [0, 1, 18, 36]) {
          const r = Roulette.parseBet(`roulette 100 ${n}`);
          expect(r.valid).toBe(true);
          expect(r.type).toBe("straight");
          expect(r.number).toBe(n);
          expect(r.reward).toBe(35);
        }
      });

      it("parses 00 as double-zero ('d')", () => {
        const r = Roulette.parseBet("roulette 100 00");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("straight");
        expect(r.number).toBe("d");
      });
    });

    describe("smart-detect dash notation", () => {
      it("parses split range (e.g. 1-2)", () => {
        const r = Roulette.parseBet("roulette 100 1-2");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("split");
        expect(r.numbers).toEqual([1, 2]);
      });

      it("parses street range (e.g. 1-3)", () => {
        const r = Roulette.parseBet("roulette 100 1-3");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("street");
      });

      it("parses double-street range (e.g. 1-6)", () => {
        const r = Roulette.parseBet("roulette 100 1-6");
        expect(r.valid).toBe(true);
        expect(r.type).toBe("dstreet");
      });
    });
  });

  // ────────────────────────────────────────────────────────
  //  Bet check functions (the heart of payout logic)
  // ────────────────────────────────────────────────────────
  describe("bet checks", () => {
    it("basket covers 0, d, 1, 2, 3", () => {
      const bet = Roulette.parseBet("roulette 100 basket");
      for (const n of [0, "d", 1, 2, 3]) expect(bet.check(n)).toBe(true);
      expect(bet.check(4)).toBe(false);
      expect(bet.check(36)).toBe(false);
    });

    it("snake covers the correct 12 numbers", () => {
      const snakeNums = [1, 5, 9, 12, 14, 16, 19, 23, 27, 30, 32, 34];
      const bet = Roulette.parseBet("roulette 100 snake");
      for (const n of snakeNums) expect(bet.check(n)).toBe(true);
      expect(bet.check(2)).toBe(false);
      expect(bet.check(0)).toBe(false);
    });

    it("manque covers 1-18", () => {
      const bet = Roulette.parseBet("roulette 100 low");
      expect(bet.check(1)).toBe(true);
      expect(bet.check(18)).toBe(true);
      expect(bet.check(0)).toBe(false);
      expect(bet.check(19)).toBe(false);
    });

    it("passe covers 19-36", () => {
      const bet = Roulette.parseBet("roulette 100 high");
      expect(bet.check(19)).toBe(true);
      expect(bet.check(36)).toBe(true);
      expect(bet.check(18)).toBe(false);
    });

    it("red colour check matches correct numbers", () => {
      const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const bet = Roulette.parseBet("roulette 100 red");
      for (const n of redNums) expect(bet.check(n)).toBe(true);
      expect(bet.check(2)).toBe(false);
      expect(bet.check(0)).toBe(false);
    });

    it("even parity rejects 0 and d", () => {
      const bet = Roulette.parseBet("roulette 100 even");
      expect(bet.check(2)).toBe(true);
      expect(bet.check(0)).toBe(false);
    });

    it("dozen 1 covers 1-12", () => {
      const bet = Roulette.parseBet("roulette 100 dozen 1");
      expect(bet.check(1)).toBe(true);
      expect(bet.check(12)).toBe(true);
      expect(bet.check(13)).toBe(false);
      expect(bet.check(0)).toBe(false);
    });

    it("column 2 covers 2, 5, 8, ..., 35", () => {
      const bet = Roulette.parseBet("roulette 100 column 2");
      expect(bet.check(2)).toBe(true);
      expect(bet.check(5)).toBe(true);
      expect(bet.check(35)).toBe(true);
      expect(bet.check(1)).toBe(false);
      expect(bet.check(3)).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Game instance lifecycle
  // ────────────────────────────────────────────────────────
  describe("game lifecycle", () => {
    it("creates a game and tracks it by guild ID", () => {
      const game = new Roulette(msg);
      expect(Roulette.gameExists(msg.guild.id)).toBe(true);
      game.end();
      expect(Roulette.gameExists(msg.guild.id)).toBe(false);
    });

    it("generates a winning number between 0-36 or 'd'", () => {
      const results = new Set();
      for (let i = 0; i < 200; i++) {
        const game = new Roulette(msg);
        results.add(game.winningNumber);
        game.end();
      }
      // Should have at least some variety
      expect(results.size).toBeGreaterThan(5);
      // Every result should be valid
      for (const r of results) {
        if (r === "d") continue;
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(36);
      }
    });

    it("adds bets and tracks per-user", () => {
      const game = new Roulette(msg);
      const bet = Roulette.parseBet("roulette 100 red");
      game.addBet("user1", bet);
      game.addBet("user1", bet);
      game.addBet("user2", bet);

      const u1 = game.getUser("user1");
      expect(u1.bets).toBe(2);
      expect(u1.amount).toBe(200);

      const u2 = game.getUser("user2");
      expect(u2.bets).toBe(1);

      expect(game.getUser("user3")).toBeNull();
      game.end();
    });

    it("accepts user objects with .id property", () => {
      const game = new Roulette(msg);
      const bet = Roulette.parseBet("roulette 100 red");
      game.addBet({ id: "userobj" }, bet);
      expect(game.getUser("userobj")).not.toBeNull();
      game.end();
    });

    it("throws on invalid addBet params", () => {
      const game = new Roulette(msg);
      expect(() => game.addBet(null, null)).toThrow("Invalid Params");
      game.end();
    });
  });

  // ────────────────────────────────────────────────────────
  //  Payout calculation
  // ────────────────────────────────────────────────────────
  describe("calculatePayout", () => {
    it("returns positive payout on win (amount × reward)", () => {
      const game = new Roulette(msg);
      // Force a known winning number
      game.winningNumber = 14;

      const redBet = { ...Roulette.parseBet("roulette 100 red") };
      expect(game.calculatePayout(redBet)).toBe(100); // 100 × 1 reward

      const straightBet = { ...Roulette.parseBet("roulette 100 14") };
      expect(game.calculatePayout(straightBet)).toBe(3500); // 100 × 35

      game.end();
    });

    it("returns -amount on loss (non-zero)", () => {
      const game = new Roulette(msg);
      game.winningNumber = 14;

      const blackBet = { ...Roulette.parseBet("roulette 100 black") };
      expect(game.calculatePayout(blackBet)).toBe(-100);
      game.end();
    });

    it("returns half-loss on zero (house edge)", () => {
      const game = new Roulette(msg);
      game.winningNumber = 0;

      const redBet = { ...Roulette.parseBet("roulette 100 red") };
      expect(game.calculatePayout(redBet)).toBe(-50); // -(100 × 0.5)
      game.end();
    });

    it("results getter computes all user payouts", () => {
      const game = new Roulette(msg);
      game.winningNumber = 7;

      const winBet = Roulette.parseBet("roulette 100 red");  // 7 is red → win
      const loseBet = Roulette.parseBet("roulette 50 black"); // 7 is red → black loses

      game.addBet("winner", winBet);
      game.addBet("loser", loseBet);

      const results = game.results;
      const winner = results.find((r) => r.userID === "winner");
      const loser = results.find((r) => r.userID === "loser");

      expect(winner.payout).toBe(100);  // 100 × 1
      expect(loser.payout).toBe(-50);   // -50
      game.end();
    });
  });
});
