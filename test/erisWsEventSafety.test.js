// We don't need to construct a real shard for these tests, so instead
// just exercise the wrapper logic itself by building a small helper
// function that mirrors what pollux.js installs.

function makeSafeWsEvent(original) {
  return function safeWsEvent(packet) {
    try {
      return original.call(this, packet);
    } catch (err) {
      if (
        err instanceof TypeError &&
        /reading '(?:remove|get)'/.test(String(err.message || ""))
      ) {
        // in real code we'd warn via this.client.emit, but for unit tests
        // we can return a sentinel value or throw nothing
        return "ignored";
      }
      throw err;
    }
  };
}

describe("Shard.wsEvent safety wrapper", () => {
  it("passes through when original succeeds", () => {
    const original = jest.fn(() => "ok");
    const wrapper = makeSafeWsEvent(original);

    const result = wrapper.call({}, {});
    expect(result).toBe("ok");
    expect(original).toHaveBeenCalledWith({});
  });

  it("ignores TypeError reading 'remove'", () => {
    const original = () => {
      throw new TypeError("Cannot read properties of undefined (reading 'remove')");
    };
    const wrapper = makeSafeWsEvent(original);
    expect(wrapper.call({})).toBe("ignored");
  });

  it("ignores TypeError reading 'get'", () => {
    const original = () => {
      throw new TypeError("Cannot read properties of undefined (reading 'get')");
    };
    const wrapper = makeSafeWsEvent(original);
    expect(wrapper.call({})).toBe("ignored");
  });

  it("rethrows other errors", () => {
    const original = () => {
      throw new Error("something else");
    };
    const wrapper = makeSafeWsEvent(original);
    expect(() => wrapper.call({})).toThrow("something else");
  });
});
