const { ensureTestGlobals } = require("./globals");

beforeEach(() => {
  ensureTestGlobals();
  Object.defineProperty(globalThis, "DB", {
    value: global.DB,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "PLX", {
    value: global.PLX,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "Progression", {
    value: global.Progression,
    writable: true,
    configurable: true,
  });
});
