const locales = require("../../core/structures/Locales");

describe("Locales", () => {
  const { i18n, langlist } = locales;

  // ────────────────────────────────────────────────────────
  //  Data integrity
  // ────────────────────────────────────────────────────────
  describe("i18n data integrity", () => {
    it("exports a non-empty array", () => {
      expect(Array.isArray(i18n)).toBe(true);
      expect(i18n.length).toBeGreaterThan(10);
    });

    it("every locale has required fields", () => {
      for (const locale of i18n) {
        expect(locale).toHaveProperty("code");
        expect(locale).toHaveProperty("iso");
        expect(locale).toHaveProperty("name");
        expect(locale).toHaveProperty("name-e");
        expect(locale).toHaveProperty("flag");
        expect(locale).toHaveProperty("site-flag");
      }
    });

    it("every locale code is a non-empty array", () => {
      for (const locale of i18n) {
        expect(Array.isArray(locale.code)).toBe(true);
        expect(locale.code.length).toBeGreaterThan(0);
      }
    });

    it("iso codes are unique", () => {
      const isos = i18n.map((l) => l.iso);
      expect(new Set(isos).size).toBe(isos.length);
    });

    it("no duplicate code aliases across locales", () => {
      const allCodes = i18n.flatMap((l) => l.code);
      const dupes = allCodes.filter((c, i) => allCodes.indexOf(c) !== i);
      expect(dupes).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────────────
  //  Known locales
  // ────────────────────────────────────────────────────────
  describe("known locales", () => {
    it("contains English", () => {
      const en = i18n.find((l) => l.iso === "en");
      expect(en).toBeDefined();
      expect(en.code).toContain("en");
      expect(en["name-e"]).toBe("english");
    });

    it("contains Portuguese (BR and PT)", () => {
      const ptBR = i18n.find((l) => l.iso === "pt-BR");
      const ptPT = i18n.find((l) => l.iso === "pt");
      expect(ptBR).toBeDefined();
      expect(ptPT).toBeDefined();
      expect(ptBR.code).toContain("pt-br");
    });

    it("contains CJK languages", () => {
      const ja = i18n.find((l) => l.iso === "ja");
      const ko = i18n.find((l) => l.iso === "ko");
      const zhTW = i18n.find((l) => l.iso === "zh-TW");
      expect(ja).toBeDefined();
      expect(ko).toBeDefined();
      expect(zhTW).toBeDefined();
    });

    it("contains OwO meme locale", () => {
      const owo = i18n.find((l) => l.iso === "owo");
      expect(owo).toBeDefined();
      expect(owo.code).toContain("uwu");
    });
  });

  // ────────────────────────────────────────────────────────
  //  langlist
  // ────────────────────────────────────────────────────────
  describe("langlist", () => {
    it("has same length as i18n", () => {
      expect(langlist.length).toBe(i18n.length);
    });

    it("each entry includes the ISO code", () => {
      for (let idx = 0; idx < i18n.length; idx++) {
        expect(langlist[idx]).toContain(i18n[idx].iso);
      }
    });
  });
});
