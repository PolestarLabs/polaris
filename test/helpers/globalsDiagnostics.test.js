describe("test globals diagnostics", () => {
  it("exposes DB and PLX on global", () => {
    expect(global.DB).toBeDefined();
    expect(global.PLX).toBeDefined();
  });

  it("binds DB and PLX identifiers", () => {
    // eslint-disable-next-line no-undef
    expect(DB).toBeDefined();
    // eslint-disable-next-line no-undef
    expect(PLX).toBeDefined();
  });
});
