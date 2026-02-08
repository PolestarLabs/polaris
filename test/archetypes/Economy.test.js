const Economy = require("../../core/archetypes/Economy");
const { createUserData } = require("../helpers/factories");

describe("Economy", () => {
  // ────────────────────────────────────────────────────────
  //  parseCurrencies (pure)
  // ────────────────────────────────────────────────────────
  describe("parseCurrencies", () => {
    it("passes through valid 3-letter codes", () => {
      expect(Economy.parseCurrencies("RBN")).toBe("RBN");
      expect(Economy.parseCurrencies("JDE")).toBe("JDE");
      expect(Economy.parseCurrencies("SPH")).toBe("SPH");
    });

    it("is case-insensitive", () => {
      expect(Economy.parseCurrencies("rbn")).toBe("RBN");
      expect(Economy.parseCurrencies("jde")).toBe("JDE");
    });

    it("maps full names to codes", () => {
      expect(Economy.parseCurrencies("RUBINE")).toBe("RBN");
      expect(Economy.parseCurrencies("JADE")).toBe("JDE");
      expect(Economy.parseCurrencies("SAPPHIRE")).toBe("SPH");
      expect(Economy.parseCurrencies("AMETHYST")).toBe("AMY");
      expect(Economy.parseCurrencies("EMERALD")).toBe("EMD");
      expect(Economy.parseCurrencies("TOPAZE")).toBe("TPZ");
      expect(Economy.parseCurrencies("PRISM")).toBe("PSM");
    });

    it("handles arrays of currencies", () => {
      const result = Economy.parseCurrencies(["RBN", "JDE"]);
      expect(result).toEqual(["RBN", "JDE"]);
    });

    it("throws on unknown currency", () => {
      expect(() => Economy.parseCurrencies("FAKE")).toThrow(/unknown/i);
      expect(() => Economy.parseCurrencies("XYZ")).toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  //  generatePayload (pure, no DB)
  // ────────────────────────────────────────────────────────
  describe("generatePayload", () => {
    it("creates a valid transaction payload", () => {
      const payload = Economy.generatePayload("from123", "to456", 100, "daily", "RBN", "INCOME", "+");

      expect(payload.from).toBe("from123");
      expect(payload.to).toBe("to456");
      expect(payload.amt).toBe(100);
      expect(payload.type).toBe("daily");
      expect(payload.currency).toBe("RBN");
      expect(payload.subtype).toBe("INCOME");
      expect(payload.transaction).toBe("+");
      expect(payload.transactionId).toBeTruthy();
      expect(typeof payload.timestamp).toBe("number");
    });

    it("stores absolute value of amount", () => {
      const payload = Economy.generatePayload("a", "b", -500, "test", "RBN", "PAYMENT", "-");
      expect(payload.amt).toBe(500);
    });

    it("extracts .id from user objects", () => {
      const payload = Economy.generatePayload(
        { id: "objFrom" }, { id: "objTo" },
        10, "test", "RBN", "TRANSFER", ">"
      );
      expect(payload.from).toBe("objFrom");
      expect(payload.to).toBe("objTo");
    });

    it("merges extra fields", () => {
      const payload = Economy.generatePayload(
        "a", "b", 10, "test", "RBN", "INCOME", "+",
        { customField: "hello" }
      );
      expect(payload.customField).toBe("hello");
    });

    it("generates unique transaction IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 500; i++) {
        const p = Economy.generatePayload("a", "b", 10, "t", "RBN", "INCOME", "+");
        ids.add(p.transactionId);
      }
      expect(ids.size).toBe(500);
    });

    it("transaction IDs contain currency prefix and shard", () => {
      const p = Economy.generatePayload("a", "b", 10, "t", "JDE", "INCOME", "+");
      expect(p.transactionId.startsWith("JDE")).toBe(true);
      expect(p.transactionId.length).toBeGreaterThan(10);
    });

    it("throws on missing arguments", () => {
      expect(() => Economy.generatePayload(null, "b", 10, "t", "RBN", "I", "+")).toThrow();
      expect(() => Economy.generatePayload("a", null, 10, "t", "RBN", "I", "+")).toThrow();
    });

    it("throws on non-number amount", () => {
      expect(() => Economy.generatePayload("a", "b", "notNum", "t", "RBN", "I", "+")).toThrow(TypeError);
    });
  });

  // ────────────────────────────────────────────────────────
  //  checkFunds (light DB mock)
  // ────────────────────────────────────────────────────────
  describe("checkFunds", () => {
    it("returns true when user has enough funds", async () => {
      const userData = createUserData({ rubines: 5000 });
      DB.users.get.mockResolvedValueOnce(userData);

      const result = await Economy.checkFunds("user1", 1000, "RBN");
      expect(result).toBe(true);
    });

    it("returns false when user lacks funds", async () => {
      const userData = createUserData({ rubines: 100 });
      DB.users.get.mockResolvedValueOnce(userData);

      const result = await Economy.checkFunds("user1", 5000, "RBN");
      expect(result).toBe(false);
    });

    it("returns true for zero amount", async () => {
      const result = await Economy.checkFunds("user1", 0);
      expect(result).toBe(true);
    });

    it("returns true for bot's own ID (unlimited funds)", async () => {
      const result = await Economy.checkFunds(PLX.user.id, 999999);
      expect(result).toBe(true);
    });

    it("returns false when user not found", async () => {
      DB.users.get.mockResolvedValueOnce(null);
      const result = await Economy.checkFunds("ghost", 100, "RBN");
      expect(result).toBe(false);
    });

    it("throws on missing user", () => {
      expect(() => Economy.checkFunds(null, 100)).toThrow(/missing user/i);
    });

    it("throws on non-number amount", () => {
      expect(() => Economy.checkFunds("user1", "abc")).toThrow(TypeError);
    });

    it("handles multi-currency check", async () => {
      const userData = createUserData({ rubines: 1000, jades: 200 });
      DB.users.get.mockResolvedValueOnce(userData);

      const result = await Economy.checkFunds("user1", [500, 100], ["RBN", "JDE"]);
      expect(result).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────
  //  transfer (integration-style with DB mocks)
  // ────────────────────────────────────────────────────────
  describe("transfer", () => {
    beforeEach(() => {
      const richUser = createUserData({ id: "rich", rubines: 99999 });
      DB.users.get.mockResolvedValue(richUser);
      DB.users.bulkWrite.mockResolvedValue({});
      DB.audits.collection.insertMany.mockResolvedValue({});
    });

    it("completes a valid transfer", async () => {
      const result = await Economy.transfer("rich", "poor", 500, "SEND", "RBN");

      expect(DB.users.bulkWrite).toHaveBeenCalledTimes(1);
      expect(DB.audits.collection.insertMany).toHaveBeenCalledTimes(1);
      expect(result.amt).toBe(500);
      expect(result.from).toBe("rich");
      expect(result.to).toBe("poor");
    });

    it("rejects when sender lacks funds", async () => {
      const brokeUser = createUserData({ id: "broke", rubines: 10 });
      DB.users.get.mockResolvedValueOnce(brokeUser);

      await expect(Economy.transfer("broke", "other", 5000, "SEND", "RBN"))
        .rejects.toThrow("NO FUNDS");
    });

    it("allows zero-amount when allowZero is set", async () => {
      const result = await Economy.transfer("rich", "poor", 0, "SEND", "RBN", "TRANSFER", ">", { allowZero: true });
      expect(result).toBeTruthy();
    });

    it("emits progression events for INCOME type", async () => {
      await Economy.transfer(PLX.user.id, "player", 100, "daily", "RBN", "INCOME", "+");
      expect(Progression.emit).toHaveBeenCalledWith(
        "earn.RBN.daily",
        expect.objectContaining({ value: 100, userID: "player" })
      );
    });

    it("emits progression events for PAYMENT type", async () => {
      await Economy.transfer("player", PLX.user.id, 50, "bgshop_bot", "RBN", "PAYMENT", "-");
      expect(Progression.emit).toHaveBeenCalledWith(
        "spend.RBN.bgshop_bot",
        expect.objectContaining({ value: 50, userID: "player" })
      );
    });
  });

  // ────────────────────────────────────────────────────────
  //  pay / receive convenience wrappers
  // ────────────────────────────────────────────────────────
  describe("pay / receive", () => {
    beforeEach(() => {
      const user = createUserData({ id: "payer", rubines: 99999 });
      DB.users.get.mockResolvedValue(user);
      DB.users.bulkWrite.mockResolvedValue({});
      DB.audits.collection.insertMany.mockResolvedValue({});
    });

    it("pay deducts from user to bot", async () => {
      const result = await Economy.pay("payer", 200, "role_purchase");
      expect(result.from).toBe("payer");
      expect(result.to).toBe(PLX.user.id);
      expect(result.subtype).toBe("PAYMENT");
    });

    it("receive adds from bot to user", async () => {
      const result = await Economy.receive("receiver", 300, "daily");
      expect(result.from).toBe(PLX.user.id);
      expect(result.to).toBe("receiver");
      expect(result.subtype).toBe("INCOME");
    });
  });

  // ────────────────────────────────────────────────────────
  //  TRANSACTION_TYPES constant
  // ────────────────────────────────────────────────────────
  describe("TRANSACTION_TYPES", () => {
    it("exports a non-empty object of transaction descriptions", () => {
      expect(Object.keys(Economy.TRANSACTION_TYPES).length).toBeGreaterThan(30);
    });

    it("contains expected keys", () => {
      expect(Economy.TRANSACTION_TYPES.daily).toBeDefined();
      expect(Economy.TRANSACTION_TYPES.gambling_blackjack).toBeDefined();
      expect(Economy.TRANSACTION_TYPES.lootbox_rewards).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────
  //  currencies constant
  // ────────────────────────────────────────────────────────
  describe("currencies", () => {
    it("includes all 8 currency codes", () => {
      expect(Economy.currencies).toContain("RBN");
      expect(Economy.currencies).toContain("JDE");
      expect(Economy.currencies).toContain("SPH");
      expect(Economy.currencies).toContain("EVT");
      expect(Economy.currencies).toHaveLength(8);
    });
  });
});
