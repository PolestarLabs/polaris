const { EventEmitter } = require("events");
const { lootbox } = require("../../core/subroutines/boxDrops");

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

    await lootbox(trigger);
    await lootbox(trigger);

    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(1);

    subscriber.emit("message", "pollux:server-config-updated", guildId);

    await lootbox(trigger);

    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(2);
  });
});
