jest.mock("../../core/structures/UsageHelper.js", () => ({
  run: jest.fn(),
}));

const Gearbox = require("../../core/utilities/Gearbox").Client;
const UsageHelper = require("../../core/structures/UsageHelper.js");
const { createMessage } = require("../helpers/factories");

describe("Gearbox autoHelper/usage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("autoHelper triggers UsageHelper when help is requested", () => {
    const message = createMessage({ content: "+foo help" });
    const didHandle = Gearbox.autoHelper(["help"], {
      message,
      cmd: "foo",
      scope: "misc",
      aliases: [],
    });

    expect(didHandle).toBe(true);
    expect(UsageHelper.run).toHaveBeenCalledWith("foo", message, undefined, expect.any(Object));
  });

  it("usage delegates to UsageHelper.run", () => {
    const message = createMessage({ content: "+bar" });
    Gearbox.usage("bar", message, "misc", { scope: "misc" });

    expect(UsageHelper.run).toHaveBeenCalledWith("bar", message, "misc", { scope: "misc" });
  });
});
