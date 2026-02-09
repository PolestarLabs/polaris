const Blackjack = require("../../core/archetypes/Blackjack");
const { createMessage } = require("../helpers/factories");

describe("Blackjack + Redis integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks game lifecycle in redis", () => {
    const msg = createMessage({ guildId: "guild-bj-test", authorId: "player-bj-test" });
    const game = new Blackjack(msg);
    const key = `blackjack-ongoing:${msg.author.id}`;

    expect(PLX.redis.set).toHaveBeenCalledWith(key, true);
    expect(PLX.redis.expire).toHaveBeenCalledWith(key, 30);

    game.endGame();
    expect(PLX.redis.expire).toHaveBeenCalledWith(key, 1);
  });
});
