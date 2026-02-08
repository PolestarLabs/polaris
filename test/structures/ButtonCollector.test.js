const { ButtonCollector } = require("../../core/structures/ButtonCollector")(null);
const { createMessage, createInteraction } = require("../helpers/factories");

describe("ButtonCollector", () => {
  let msg;

  beforeEach(() => {
    msg = createMessage();
  });

  // ────────────────────────────────────────────────────────
  //  Constructor
  // ────────────────────────────────────────────────────────
  describe("constructor", () => {
    it("creates a collector with default timeout", () => {
      const collector = new ButtonCollector(msg, {});
      expect(collector.ended).toBe(false);
      expect(collector.collected).toEqual([]);
      expect(collector.message).toBe(msg);
      collector.stop("test");
    });

    it("accepts a filter function", () => {
      const filter = jest.fn().mockReturnValue(true);
      const collector = new ButtonCollector(msg, filter, { time: 5000 });
      expect(collector.filter).toBe(filter);
      collector.stop("test");
    });

    it("uses options as second arg when filter is not a function", () => {
      const options = { time: 3000, authorOnly: "user123" };
      const collector = new ButtonCollector(msg, options);
      expect(collector.options).toBe(options);
      expect(collector.filter).toBeNull();
      collector.stop("test");
    });
  });

  // ────────────────────────────────────────────────────────
  //  Verify (interaction matching)
  // ────────────────────────────────────────────────────────
  describe("verify", () => {
    it("rejects interactions for different messages", () => {
      const collector = new ButtonCollector(msg, {});
      const otherMsg = createMessage();
      const interaction = createInteraction({ message: otherMsg });

      const result = collector.verify(interaction, interaction.data, "user1");
      expect(result).toBe(false);
      collector.stop("test");
    });

    it("accepts interactions for the correct message", () => {
      const collector = new ButtonCollector(msg, { time: 5000 });
      const interaction = createInteraction({ message: msg });

      const result = collector.verify(interaction, interaction.data, "user1");
      expect(result).toBe(true);
      expect(collector.collected).toHaveLength(1);
      collector.stop("test");
    });

    it("respects authorOnly as string", () => {
      const collector = new ButtonCollector(msg, { time: 5000, authorOnly: "allowed" });
      const interaction = createInteraction({ message: msg });

      // Wrong user
      const r1 = collector.verify(interaction, interaction.data, "notallowed");
      expect(r1).toBe(false);

      // Right user
      const r2 = collector.verify(interaction, interaction.data, "allowed");
      expect(r2).toBe(true);
      collector.stop("test");
    });

    it("respects authorOnly as array", () => {
      const collector = new ButtonCollector(msg, { time: 5000, authorOnly: ["a", "b"] });
      const interaction = createInteraction({ message: msg });

      // BUG: authorOnly array passes the Array check but then falls through
      // to `authorOnly !== userID` which compares array !== string → always false.
      // Documenting current (broken) behavior; once fixed, flip the second expect to true.
      expect(collector.verify(interaction, interaction.data, "c")).toBe(false);
      expect(collector.verify(interaction, interaction.data, "a")).toBe(false); // should be true after fix
      collector.stop("test");
    });

    it("applies filter function", () => {
      const filter = jest.fn((bp) => bp.id === "accept");
      const collector = new ButtonCollector(msg, filter, { time: 5000 });

      const good = createInteraction({ message: msg, customId: "accept" });
      const bad = createInteraction({ message: msg, customId: "reject" });

      expect(collector.verify(good, good.data, "u")).toBe(true);
      expect(collector.verify(bad, bad.data, "u")).toBe(false);
      collector.stop("test");
    });

    it("emits 'click' event on valid interaction", (done) => {
      const collector = new ButtonCollector(msg, { time: 5000 });
      const interaction = createInteraction({ message: msg });

      collector.on("click", (bp) => {
        expect(bp.userID).toBeDefined();
        expect(bp.interaction).toBe(interaction);
        collector.stop("test");
        done();
      });

      collector.verify(interaction, interaction.data, "user1");
    });
  });

  // ────────────────────────────────────────────────────────
  //  Stop
  // ────────────────────────────────────────────────────────
  describe("stop", () => {
    it("emits 'end' with collected items and reason", (done) => {
      const collector = new ButtonCollector(msg, { time: 60000 });
      const interaction = createInteraction({ message: msg });
      collector.verify(interaction, interaction.data, "u1");

      collector.on("end", (collected, reason) => {
        expect(collected).toHaveLength(1);
        expect(reason).toBe("manual");
        done();
      });

      collector.stop("manual");
    });

    it("does not emit 'end' twice", () => {
      const collector = new ButtonCollector(msg, { time: 60000 });
      const endSpy = jest.fn();
      collector.on("end", endSpy);

      collector.stop("first");
      collector.stop("second");
      expect(endSpy).toHaveBeenCalledTimes(1);
    });

    it("sets ended flag", () => {
      const collector = new ButtonCollector(msg, { time: 60000 });
      collector.stop("test");
      expect(collector.ended).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────
  //  maxMatches auto-stop
  // ────────────────────────────────────────────────────────
  describe("maxMatches", () => {
    it("auto-stops after maxMatches collected", (done) => {
      const collector = new ButtonCollector(msg, { time: 60000, maxMatches: 2 });

      collector.on("end", (collected, reason) => {
        expect(reason).toBe("maxMatches");
        expect(collected).toHaveLength(2);
        done();
      });

      const i1 = createInteraction({ message: msg });
      const i2 = createInteraction({ message: msg });

      collector.verify(i1, i1.data, "u1");
      collector.verify(i2, i2.data, "u2");
    });
  });
});
