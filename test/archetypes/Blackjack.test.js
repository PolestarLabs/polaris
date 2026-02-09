const Blackjack = require("../../core/archetypes/Blackjack");
const { createMessage } = require("../helpers/factories");

describe("Blackjack", () => {
  let msg;

  beforeEach(() => {
    msg = createMessage({ guildId: "guild-bj-test", authorId: "player-bj-test" });
  });

  // ────────────────────────────────────────────────────────
  //  Card value scoring  (pure static)
  // ────────────────────────────────────────────────────────
  describe("_cardValue", () => {
    it("scores Ace as 11", () => {
      expect(Blackjack._cardValue("AH")).toBe(11);
      expect(Blackjack._cardValue("AS")).toBe(11);
    });

    it("scores number cards at face value", () => {
      expect(Blackjack._cardValue("2C")).toBe(2);
      expect(Blackjack._cardValue("5D")).toBe(5);
      expect(Blackjack._cardValue("9H")).toBe(9);
      expect(Blackjack._cardValue("10S")).toBe(10);
    });

    it("scores face cards (J, Q, K) as 10", () => {
      expect(Blackjack._cardValue("JH")).toBe(10);
      expect(Blackjack._cardValue("QD")).toBe(10);
      expect(Blackjack._cardValue("KC")).toBe(10);
    });

    it("scores JOKER as 99", () => {
      expect(Blackjack._cardValue("JOKER")).toBe(99);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Hand value calculation  (pure static)
  // ────────────────────────────────────────────────────────
  describe("handValue", () => {
    it("sums a simple hand", () => {
      expect(Blackjack.handValue(["5H", "3D"])).toBe(8);
    });

    it("sums face cards correctly", () => {
      expect(Blackjack.handValue(["KH", "QD"])).toBe(20);
    });

    it("counts Ace as 11 when under 21", () => {
      expect(Blackjack.handValue(["AH", "5D"])).toBe(16);
    });

    it("downgrades Ace to 1 when over 21", () => {
      // A(11) + 9 + 5 = 25 → A(1) + 9 + 5 = 15
      expect(Blackjack.handValue(["AH", "9D", "5C"])).toBe(15);
    });

    it("handles multiple Aces correctly", () => {
      // A(11) + A(11) = 22 → A(11) + A(1) = 12
      expect(Blackjack.handValue(["AH", "AS"])).toBe(12);
      // A + A + 9 = 31 → 21
      expect(Blackjack.handValue(["AH", "AS", "9D"])).toBe(21);
    });

    it("returns 'Blackjack' for natural 21 (2 cards)", () => {
      expect(Blackjack.handValue(["AH", "KD"])).toBe("Blackjack");
      expect(Blackjack.handValue(["10S", "AH"])).toBe("Blackjack");
    });

    it("returns 21 (not Blackjack) for 3+ card 21", () => {
      expect(Blackjack.handValue(["7H", "7D", "7C"])).toBe(21);
    });

    it("returns JOKER card value for hands with jokers", () => {
      const result = Blackjack.handValue(["JOKER", "5D"]);
      expect(result).toBe("JOKER");
    });

    it("handles bust hands", () => {
      expect(Blackjack.handValue(["KH", "QD", "5C"])).toBe(25);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Soft hand detection  (pure static)
  // ────────────────────────────────────────────────────────
  describe("isSoft", () => {
    it("detects soft hand (Ace counted as 11)", () => {
      // A(11) + 5 = 16 → soft
      expect(Blackjack.isSoft(["AH", "5D"])).toBe(true);
    });

    it("detects hard hand (Ace forced to 1)", () => {
      // A(1) + 9 + 5 = 15 → hard (ace was downgraded)
      expect(Blackjack.isSoft(["AH", "9D", "5C"])).toBe(false);
    });

    it("returns false for natural Blackjack", () => {
      expect(Blackjack.isSoft(["AH", "KD"])).toBe(false);
    });

    it("returns false for JOKER hands", () => {
      expect(Blackjack.isSoft(["JOKER", "5D"])).toBe(false);
    });

    it("returns false for hands with no Aces", () => {
      expect(Blackjack.isSoft(["KH", "5D"])).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Shuffle  (pure static)
  // ────────────────────────────────────────────────────────
  describe("_shuffle", () => {
    it("returns array of same length", () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = Blackjack._shuffle(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it("contains same elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = Blackjack._shuffle(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("does not mutate original array", () => {
      const arr = [1, 2, 3, 4, 5];
      const copy = [...arr];
      Blackjack._shuffle(arr);
      expect(arr).toEqual(copy);
    });

    it("actually shuffles (not just identity)", () => {
      const arr = Array.from({ length: 52 }, (_, i) => i);
      // Run 5 shuffles, at least one should differ from original
      const results = Array.from({ length: 5 }, () => Blackjack._shuffle(arr));
      const allSame = results.every((r) => JSON.stringify(r) === JSON.stringify(arr));
      expect(allSame).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Game instance & deck management (uses Redis mock)
  // ────────────────────────────────────────────────────────
  describe("game instance", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("constructs with correct player/guild IDs", () => {
      const game = new Blackjack(msg);
      expect(game.playerID).toBe("player-bj-test");
      expect(game.guildID).toBe("guild-bj-test");
      expect(game.deck).toEqual([]);
    });

    it("tracks game lifecycle in redis", () => {
      const game = new Blackjack(msg);
      const key = `blackjack-ongoing:${msg.author.id}`;

      expect(PLX.redis.set).toHaveBeenCalledWith(key, true);
      expect(PLX.redis.expire).toHaveBeenCalledWith(key, 30);

      game.endGame();
      expect(PLX.redis.expire).toHaveBeenCalledWith(key, 1);
    });

    it("builds and shuffles a deck on first hit", () => {
      const game = new Blackjack(msg);
      const hand = game.getHand();
      expect(hand).toHaveLength(2);
      hand.forEach((card) => {
        expect(typeof card).toBe("string");
        expect(card.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("draws from deck on subsequent hits", () => {
      const game = new Blackjack(msg);
      const hand = game.getHand();
      const deckAfterDeal = game.deck.length;
      game.hit(hand);
      expect(hand).toHaveLength(3);
      expect(game.deck.length).toBe(deckAfterDeal - 1);
    });

    it("reports cards remaining", () => {
      const game = new Blackjack(msg);
      game.getHand();
      const remaining = game.cardsRemaining();
      expect(typeof remaining).toBe("number");
      expect(remaining).toBeGreaterThan(0);
    });

    it("handles multi-deck construction", () => {
      const game = new Blackjack(msg, 3);
      expect(game.deckAmount).toBe(3);
      game.getHand();
      // 3 decks × 52 cards × 3 (the RANKS.concat pattern) = lots of cards
      // minus 2 dealt
      expect(game.deck.length).toBeGreaterThan(100);
    });
  });
});
