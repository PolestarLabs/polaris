const { EventEmitter } = require("events");
// we'll require the subroutine inside each test so we can mock Gearbox.randomize

describe("boxDrops server config cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invalidates cached server config on Redis pubsub", async () => {
    const guildId = "123456";
    const channelId = "999";
    const serverData = {
      switches: { chLootboxOff: [channelId] },
      event: { enabled: false },
    };

    global.DB.servers.findOne = jest.fn(() => ({
      lean: () => ({
        exec: () => Promise.resolve(serverData),
      }),
    }));

    const guild = {
      id: guildId,
      memberCount: 20,
      members: [{ bot: false }, { bot: false }],
      switches: undefined,
      event: undefined,
    };

    const channel = {
      id: channelId,
      nsfw: false,
      natural: false,
      client: {},
      send: jest.fn(),
    };

    const trigger = {
      author: { id: "user-1", bot: false },
      content: "hello world",
      channel,
      guild,
      lang: "en",
      prefix: "+",
    };

    let subscriber = null;
    global.PLX.redis = {
      duplicate: () => {
        subscriber = new EventEmitter();
        subscriber.subscribe = jest.fn();
        subscriber.on = subscriber.on.bind(subscriber);
        return subscriber;
      },
    };
    global.PLX.guilds = new Map([[guildId, guild]]);

    const { lootbox } = require("../../core/subroutines/boxDrops");
    await lootbox(trigger);
    await lootbox(trigger);

    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(1);

    subscriber.emit("message", "pollux:server-config-updated", guildId);

    await lootbox(trigger);

    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(2);
  });

  it("returns early when channel object has no client reference", async () => {
    const guild = { id: "g1", memberCount: 20, members: [{ bot: false }, { bot: false }] };
    const channel = { id: "c1" /* missing client intentionally */ };
    const trigger = {
      author: { id: "u1", bot: false },
      content: "hello",
      channel,
      guild,
      lang: "en",
      prefix: "+",
    };

    // monkey-patch randomize so we don't accidentally hit other branches
    const gearbox = require("../../core/utilities/Gearbox").Global;
    jest.spyOn(gearbox, "randomize").mockReturnValue(1);

    const { lootbox } = require("../../core/subroutines/boxDrops");
    const result = await lootbox(trigger);
    expect(result).toBe(false);
  });

  it("handles a deleted channel gracefully when collecting picks", async () => {
    const guild = { id: "g2", memberCount: 20, members: [{ bot: false }, { bot: false }] };
    const channel = {
      id: "c2",
      client: {},
      send: jest.fn().mockResolvedValue({
        channel: {}, // simulate the channel being stripped down (no awaitMessages)
      }),
      deleteMessages: jest.fn().mockResolvedValue(true),
      natural: false,
    };
    const trigger = {
      author: { id: "u2", bot: false },
      content: "hello", // not "pick" so we don't hit the exp penalty early
      channel,
      guild,
      lang: "en",
      prefix: "+",
    };

    // stub server config lookup so we bypass database logic
    global.DB.servers.findOne = jest.fn(() => ({
      lean: () => ({
        exec: () => Promise.resolve({ switches: {}, event: {} }),
      }),
    }));

    // force a drop so we go through the awaitMessages section
    const gearbox = require("../../core/utilities/Gearbox").Global;
    jest.spyOn(gearbox, "randomize").mockReturnValue(777);

    const { lootbox } = require("../../core/subroutines/boxDrops");

    // stub the DB calls used after the collector
    global.DB.users = { set: jest.fn().mockResolvedValue(true), getFull: jest.fn().mockResolvedValue({ addItem: jest.fn() }) };

    // the call shouldn't reject even though the collector channel is malformed
    await expect(lootbox(trigger)).resolves.toBeDefined();
  });
});
