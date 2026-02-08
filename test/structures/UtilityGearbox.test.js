const UtilityGearbox = require("../../core/structures/UtilityGearbox");

describe("UtilityGearbox", () => {
  it("exports an object with Embed and RichEmbed keys", () => {
    expect(UtilityGearbox).toHaveProperty("Embed");
    expect(UtilityGearbox).toHaveProperty("RichEmbed");
  });

  it("Embed and RichEmbed refer to the same value", () => {
    expect(UtilityGearbox.Embed).toBe(UtilityGearbox.RichEmbed);
  });
});
