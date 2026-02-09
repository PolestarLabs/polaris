/**
 * Global Mock Harness
 * -------------------
 * Sets up lightweight stubs for every global that the bot runtime
 * normally injects via pollux.js / prime.js / Gearbox.
 *
 * Loaded automatically by Jest via `setupFiles` in jest.config.js.
 * Individual tests can override any of these with jest.fn() / jest.spyOn().
 */

// ── Randomization ────────────────────────────────────────────────
global.randomize = (min = 0, max = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

global.shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Discord / Eris stubs ─────────────────────────────────────────
class MockEmbed {
  constructor(data = {}) { Object.assign(this, data); }
  setColor(c) { this.color = c; return this; }
  setTitle(t) { this.title = t; return this; }
  setDescription(d) { this.description = d; return this; }
  setFooter(f) { this.footer = f; return this; }
  setThumbnail(t) { this.thumbnail = t; return this; }
  setImage(i) { this.image = i; return this; }
  setAuthor(a) { this.author = a; return this; }
  addField(n, v, inline) { 
    if (!this.fields) this.fields = [];
    this.fields.push({ name: n, value: v, inline }); 
    return this; 
  }
}

global.Embed = MockEmbed;
global.RichEmbed = MockEmbed;

global._emoji = (name, fallback) => fallback || `:${name}:`;
global.$t = (key, _opts) => key;
global.$p = (key, _opts) => key;
global.wait = (seconds) => new Promise((r) => setTimeout(r, (seconds || 0) * 1000));

// ── Paths ────────────────────────────────────────────────────────
global.paths = {
  CDN: "https://cdn.test.local",
  ASSETS: "/mock/assets",
  BUILD: "https://cdn.test.local/build",
  PROFILE: "https://cdn.test.local/profile",
};

// ── Instrumentation (DataDog stubs) ──────────────────────────────
global.INSTR = {
  inc: jest.fn(),
  dec: jest.fn(),
  gauge: jest.fn(),
  event: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  success: jest.fn(),
  top_inc: jest.fn(),
};

// ── Database stubs ───────────────────────────────────────────────
const createMockCollection = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  new: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  updateOne: jest.fn().mockResolvedValue({}),
  bulkWrite: jest.fn().mockResolvedValue({}),
  aggregate: jest.fn().mockResolvedValue([]),
  collection: {
    insertMany: jest.fn().mockResolvedValue({}),
  },
});

const ensureTestGlobals = () => {
  if (!global.DB) {
    const mockCollection = createMockCollection();
    global.DB = {
      users: { ...mockCollection },
      servers: { ...mockCollection },
      cosmetics: { ...mockCollection },
      items: { ...mockCollection },
      audits: { ...mockCollection },
    };
  } else if (!global.DB.servers) {
    global.DB.servers = createMockCollection();
  }

  if (!global.REDIS) {
    const redisStore = new Map();
    global.REDIS = {
      get: jest.fn((k) => redisStore.get(k) || null),
      set: jest.fn((k, v) => redisStore.set(k, v)),
      del: jest.fn((k) => redisStore.delete(k)),
      aget: jest.fn(async (k) => redisStore.get(k) || null),
      expire: jest.fn(),
    };
    global.__testRedisStore = redisStore;
  }

  if (!global.PLX) {
    global.PLX = {
      user: { id: "000000000000000000", username: "TestBot" },
      cluster: { id: 0, name: "test-cluster" },
      redis: { ...global.REDIS },
      on: jest.fn(),
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue(undefined),
      timerBypass: [],
    };
  } else if (!global.PLX.redis) {
    global.PLX.redis = { ...global.REDIS };
  }

  globalThis.DB = global.DB;
  globalThis.REDIS = global.REDIS;
  globalThis.PLX = global.PLX;
};

ensureTestGlobals();

// ── Redis stub ───────────────────────────────────────────────────
// (provided via ensureTestGlobals)

// ── PLX (bot client) stub ────────────────────────────────────────
// (provided via ensureTestGlobals)

// ── Progression stub ─────────────────────────────────────────────
global.Progression = {
  emit: jest.fn(),
};

// ── Misc globals ─────────────────────────────────────────────────
global.appRoot = __dirname.replace(/test[\\/]helpers$/, "");
global.clusterNames = {};
global.MARKET_TOKEN = "test-token";
global.errorsHook = null;

// ── Expose redisStore for cleanup in afterEach setup ─────────
// (provided via ensureTestGlobals)

module.exports = {
  ensureTestGlobals,
};
