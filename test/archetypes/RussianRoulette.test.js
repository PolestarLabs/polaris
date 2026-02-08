const RussianRoulette = require("../../core/archetypes/RussianRoulette");

describe("RussianRoulette", () => {
  const makeGame = (value = 1000) => new RussianRoulette({}, value);

  // ────────────────────────────────────────────────────────
  //  Constructor & initial state
  // ────────────────────────────────────────────────────────
  describe("constructor", () => {
    it("initializes with correct values", () => {
      const game = makeGame(1000);
      expect(game.currentPayout).toBe(1000);
      expect(game.rounds).toBe(5);
      expect(game.increment).toBe(125); // floor(1000 * 0.125)
      expect(game.maxValue).toBe(875);  // 1000 - 125
      expect(game.handgunBarrel).toEqual([1, 0, 0, 0, 0, 0]);
    });

    it("calculates increment as 12.5% of value", () => {
      const game = makeGame(800);
      expect(game.increment).toBe(100); // floor(800 * 0.125)
    });
  });

  // ────────────────────────────────────────────────────────
  //  nextValue getter
  // ────────────────────────────────────────────────────────
  describe("nextValue", () => {
    it("returns current payout + increment", () => {
      const game = makeGame(1000);
      expect(game.nextValue).toBe(1125); // 1000 + 125
    });
  });

  // ────────────────────────────────────────────────────────
  //  willSurvive
  // ────────────────────────────────────────────────────────
  describe("willSurvive", () => {
    it("returns boolean", () => {
      const game = makeGame();
      const result = game.willSurvive();
      expect(typeof result).toBe("boolean");
    });

    it("has roughly 1/6 chance of death over many trials", () => {
      const game = makeGame();
      let deaths = 0;
      const trials = 6000;
      for (let i = 0; i < trials; i++) {
        if (!game.willSurvive()) deaths++;
      }
      // Expect ~1000 deaths (1/6 of 6000), allow wide margin
      expect(deaths).toBeGreaterThan(600);
      expect(deaths).toBeLessThan(1400);
    });
  });

  // ────────────────────────────────────────────────────────
  //  handleInput
  // ────────────────────────────────────────────────────────
  describe("handleInput", () => {
    it("returns { stopped: true } for 'stop'", () => {
      const game = makeGame();
      expect(game.handleInput("stop")).toEqual({ stopped: true });
      expect(game.handleInput("Stop")).toEqual({ stopped: true });
    });

    it("returns { invalidInput: true } for unrecognized input", () => {
      const game = makeGame();
      expect(game.handleInput("hello")).toEqual({ invalidInput: true });
      expect(game.handleInput("")).toEqual({ invalidInput: true });
    });

    it("returns { won: true } when surviving all 5 rounds", () => {
      const game = makeGame();
      // Override willSurvive to always return true
      game.willSurvive = () => true;

      for (let i = 0; i < 4; i++) {
        const result = game.handleInput("shoot");
        expect(result.rounds).toBeDefined();
      }
      const finalResult = game.handleInput("shoot");
      expect(finalResult).toEqual({ won: true });
    });

    it("returns { lost: true } on death", () => {
      const game = makeGame();
      game.willSurvive = () => false;
      expect(game.handleInput("shoot")).toEqual({ lost: true });
    });

    it("increments payout each surviving round", () => {
      const game = makeGame(1000);
      game.willSurvive = () => true;

      game.handleInput("shoot");
      expect(game.currentPayout).toBe(1125); // 1000 + 125

      game.handleInput("shoot");
      expect(game.currentPayout).toBe(1250); // 1125 + 125
    });

    it("decrements rounds each surviving shot", () => {
      const game = makeGame();
      game.willSurvive = () => true;

      game.handleInput("shoot");
      expect(game.rounds).toBe(4);

      game.handleInput("shoot");
      expect(game.rounds).toBe(3);
    });
  });
});
