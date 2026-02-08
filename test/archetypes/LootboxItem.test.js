const LootboxItem = require("../../core/archetypes/LootboxItem");

describe("LootboxItem", () => {
  // ────────────────────────────────────────────────────────
  //  Constructor — type mapping
  // ────────────────────────────────────────────────────────
  describe("constructor type mapping", () => {
    it("maps BKG to 'background'", () => {
      const item = new LootboxItem("BKG", "C", {});
      expect(item.type).toBe("background");
    });

    it("maps MDL to 'medal'", () => {
      const item = new LootboxItem("MDL", "C", {});
      expect(item.type).toBe("medal");
    });

    it("maps BPK to 'boosterpack' with items collection", () => {
      const item = new LootboxItem("BPK", "C", {});
      expect(item.type).toBe("boosterpack");
      expect(item.collection).toBe("items");
    });

    it("maps ITM to the provided itemType with items collection", () => {
      const item = new LootboxItem("ITM", "B", { itemType: "key" });
      expect(item.type).toBe("key");
      expect(item.collection).toBe("items");
    });

    it("maps RBN/JDE/SPH to 'gems'", () => {
      for (const gem of ["RBN", "JDE", "SPH"]) {
        const item = new LootboxItem(gem, "C", {});
        expect(item.type).toBe("gems");
      }
    });

    it("maps unknown types to null", () => {
      const item = new LootboxItem("???", "C", {});
      expect(item.type).toBeNull();
    });

    it("stores rarity, exclusive, event, from params", () => {
      const item = new LootboxItem("BKG", "A", { exclusive: true, event: "xmas" });
      expect(item.rarity).toBe("A");
      expect(item.exclusive).toBe(true);
      expect(item.event).toBe("xmas");
    });

    it("defaults rarity to C", () => {
      const item = new LootboxItem("BKG", undefined, {});
      expect(item.rarity).toBe("C");
    });
  });

  // ────────────────────────────────────────────────────────
  //  calculateGems (pure math)
  // ────────────────────────────────────────────────────────
  describe("calculateGems", () => {
    it("returns a positive number for RBN", () => {
      const item = new LootboxItem("RBN", "C", {});
      const amount = item.calculateGems("RBN");
      expect(typeof amount).toBe("number");
      expect(amount).toBeGreaterThan(0);
      expect(item.currency).toBe("RBN");
    });

    it("returns a positive number for JDE (5x multiplier)", () => {
      const item = new LootboxItem("JDE", "C", {});
      const amount = item.calculateGems("JDE");
      expect(amount).toBeGreaterThan(0);
      expect(item.currency).toBe("JDE");
    });

    it("returns ceil'd value for SPH (÷100)", () => {
      const item = new LootboxItem("SPH", "C", {});
      const amount = item.calculateGems("SPH");
      expect(amount).toBeGreaterThan(0);
      expect(Number.isInteger(amount)).toBe(true);
      expect(item.currency).toBe("SPH");
    });

    it("stores amount on instance", () => {
      const item = new LootboxItem("RBN", "B", {});
      item.calculateGems("RBN");
      expect(item.amount).toBeDefined();
      expect(item.amount).toBe(item.calculateGems("RBN") || item.amount);
    });
  });
});
