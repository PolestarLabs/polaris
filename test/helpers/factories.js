/**
 * Test Factories
 * ──────────────
 * Lightweight builders for common Discord objects.
 * Use these to construct the minimal shape that archetypes/structures expect.
 */

let _idCounter = 100000000000000000n;
const nextId = () => String(_idCounter++);

/**
 * Fake Discord message
 */
function createMessage(overrides = {}) {
  const authorId = overrides.authorId || nextId();
  const guildId = overrides.guildId || nextId();
  const channelId = overrides.channelId || nextId();

  return {
    id: nextId(),
    content: overrides.content || "",
    args: overrides.args || [],
    lang: overrides.lang || "en",
    author: {
      id: authorId,
      username: overrides.username || "TestUser",
      discriminator: "0001",
      avatar: null,
      ...(overrides.author || {}),
    },
    member: {
      id: authorId,
      user: { id: authorId },
      nick: null,
      roles: [],
      hasPermission: jest.fn().mockReturnValue(true),
      ...(overrides.member || {}),
    },
    guild: {
      id: guildId,
      name: "Test Guild",
      member: jest.fn().mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
      }),
      ...(overrides.guild || {}),
    },
    channel: {
      id: channelId,
      send: jest.fn().mockResolvedValue({}),
      createMessage: jest.fn().mockResolvedValue({}),
      permissionsOf: jest.fn().mockReturnValue({
        has: jest.fn().mockReturnValue(true),
      }),
      ...(overrides.channel || {}),
    },
    reply: jest.fn().mockResolvedValue({}),
    addReaction: jest.fn().mockResolvedValue({}),
    edit: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    disableButtons: jest.fn().mockResolvedValue({}),
    ...(overrides.message || {}),
  };
}

/**
 * Fake Discord interaction (for component collectors)
 */
function createInteraction(overrides = {}) {
  const userId = overrides.userId || nextId();
  return {
    id: nextId(),
    type: 3,
    data: { custom_id: overrides.customId || "test_button", ...(overrides.data || {}) },
    message: overrides.message || createMessage(),
    member: { user: { id: userId }, ...(overrides.member || {}) },
    user: { id: userId },
    reply: jest.fn().mockResolvedValue({}),
    ack: jest.fn().mockResolvedValue({}),
    ...(overrides.interaction || {}),
  };
}

/**
 * Fake user data (DB shape — new refactored schema: currency.*, not modules.*)
 */
function createUserData(overrides = {}) {
  return {
    id: overrides.id || nextId(),
    currency: {
      RBN: overrides.rubines ?? 10000,
      JDE: overrides.jades ?? 500,
      SPH: overrides.sapphires ?? 100,
      AMY: overrides.amethysts ?? 0,
      EMD: overrides.emeralds ?? 0,
      TPZ: overrides.topazes ?? 0,
      PSM: overrides.prisms ?? 0,
      EVT: overrides.events ?? 0,
      ...(overrides.currency || {}),
    },
    counters: overrides.counters || {},
    ...(overrides.userData || {}),
  };
}

module.exports = { createMessage, createInteraction, createUserData, nextId };
