/**
 * _legacy_userdb_shim.js
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SUNSET FILE — Delete this entire file when migration is done. ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Fallback shim for migrating from the monolithic "userdb" collection
 * to the new split "users" + satellite collections.
 *
 * RULES:
 *  1. New code NEVER imports this file directly for business logic.
 *  2. This is the ONLY file allowed to reference DB._legacyUserDB.
 *  3. When a legacy user is confirmed in sync, mark with sunset:true.
 *  4. When all users are migrated, delete this file and remove the
 *     DB._legacyUserDB / DB.userDB exports from database_schema.
 *
 * @deprecated ENTIRE FILE — Scheduled for removal.
 * @module _legacy_userdb_shim
 */

// ── Field path mapping: old userdb → new users core ──────────────

const FIELD_MAP = {
  // Currencies: modules.X → currency.X
  "modules.RBN": "currency.RBN",
  "modules.SPH": "currency.SPH",
  "modules.JDE": "currency.JDE",
  "modules.PSM": "currency.PSM",
  "modules.EVT": "currency.EVT",

  // Progression: modules.X → progression.X
  "modules.level": "progression.level",
  "modules.exp": "progression.exp",

  // Profile: modules.X → profile.X
  "modules.bgID": "profile.bgID",
  "modules.flairTop": "profile.flairTop",
  "modules.flairDown": "profile.flairDown",
  "modules.sticker": "profile.sticker",
  "modules.favcolor": "profile.favcolor",
  "modules.persotext": "profile.persotext",
  "modules.tagline": "profile.tagline",
  "modules.medals": "profile.medals",
  "modules.skins": "profile.skins",
  "featuredMarriage": "profile.featuredMarriage",
};

// ── Core helpers ──────────────────────────────────────────────────

/**
 * Get user data, preferring new "users" collection, falling back to
 * legacy "userdb" only as a last resort.
 *
 * @deprecated Use DB.users.get() directly when all users are migrated.
 * @param {string} userId
 * @param {object} [projection]
 * @returns {Promise<object|null>}
 */
async function getUser(userId, projection) {
  if (typeof userId === "object" && userId.id) userId = userId.id;
  userId = String(userId);

  // 1. Try new collection first
  const user = await DB.users.get(userId, projection);
  if (user && user.meta?.migrated) return user;

  // 2. Fallback to legacy
  let legacyUser;
  try {
    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
  } catch (e) {
    // _legacyUserDB may not exist after sunset
    return user;
  }
  if (!legacyUser) return user; // might still be null

  // 3. If both exist, compare timestamps — fresher wins
  if (user && legacyUser) {
    const newTs = user.meta?.lastUpdated ? new Date(user.meta.lastUpdated).getTime() : 0;
    const oldTs = legacyUser.lastUpdated ? new Date(legacyUser.lastUpdated).getTime() : 0;
    if (newTs >= oldTs) {
      _markSunset(userId);
      return user;
    }
  }

  // 4. Adapt legacy document to new shape
  return _adaptLegacyToNew(legacyUser);
}

/**
 * Get a full Mongoose document (with instance methods) from the new
 * collection, with legacy fallback.
 *
 * @deprecated Use DB.users.getFull() directly when all users are migrated.
 * @param {string} userId
 * @returns {Promise<Document|null>}
 */
async function getUserFull(userId) {
  if (typeof userId === "object" && userId.id) userId = userId.id;
  userId = String(userId);

  const user = await DB.users.getFull(userId);
  if (user && user.meta?.migrated) return user;

  // Fallback — return new-collection doc even if not migrated,
  // since it has the instance methods. Legacy doc is schema-less.
  if (user) return user;

  // Last resort: read legacy, create new doc from it
  let legacyUser;
  try {
    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
  } catch (e) {
    return null;
  }
  if (!legacyUser) return null;

  // Create a new-collection entry from legacy data on the fly
  const adapted = _adaptLegacyToNew(legacyUser);
  try {
    await DB.users.updateOne(
      { id: userId },
      { $setOnInsert: adapted },
      { upsert: true }
    );
    _markSunset(userId);
  } catch (e) {
    // Duplicate key or write error — new doc may already exist
  }
  return DB.users.getFull(userId);
}

/**
 * Get user cosmetics, falling back to legacy userdb.modules.* fields.
 *
 * @deprecated Use DB.userCosmetics.get() directly when all users are migrated.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserCosmetics(userId) {
  if (typeof userId === "object" && userId.id) userId = userId.id;
  userId = String(userId);

  const cosmetics = await DB.userCosmetics.get(userId);
  if (cosmetics) return cosmetics;

  // Fallback: read from legacy
  let legacyUser;
  try {
    legacyUser = await DB._legacyUserDB.findOne(
      { id: userId },
      {
        "modules.inventory": 1,
        "modules.bgInventory": 1,
        "modules.skinInventory": 1,
        "modules.flairsInventory": 1,
        "modules.medalInventory": 1,
        "modules.stickerInventory": 1,
        "modules.stickerCollection": 1,
        "modules.fishes": 1,
        "modules.fishCollection": 1,
        "modules.achievements": 1,
      }
    ).lean();
  } catch (e) {
    return null;
  }
  if (!legacyUser?.modules) return null;

  return {
    userId,
    inventory: legacyUser.modules.inventory || [],
    bgInventory: legacyUser.modules.bgInventory || [],
    skinInventory: legacyUser.modules.skinInventory || [],
    flairInventory: legacyUser.modules.flairsInventory || [],
    medalInventory: (legacyUser.modules.medalInventory || []).filter(Boolean),
    stickerInventory: (legacyUser.modules.stickerInventory || []).filter(Boolean),
    stickerShowcase: legacyUser.modules.stickerCollection || [],
    fishes: legacyUser.modules.fishes || [],
    fishShowcase: legacyUser.modules.fishCollection || [],
    achievements: legacyUser.modules.achievements || [],
  };
}

/**
 * Get full cosmetics Mongoose document with legacy fallback.
 *
 * @deprecated Use DB.userCosmetics.getFull() directly when all users are migrated.
 * @param {string} userId
 * @returns {Promise<Document|null>}
 */
async function getUserCosmeticsFull(userId) {
  if (typeof userId === "object" && userId.id) userId = userId.id;
  userId = String(userId);

  let doc = await DB.userCosmetics.getFull(userId);
  if (doc) return doc;

  // Bootstrap from legacy
  const adapted = await getUserCosmetics(userId);
  if (!adapted) return null;

  try {
    await DB.userCosmetics.updateOne(
      { userId },
      { $setOnInsert: adapted },
      { upsert: true }
    );
  } catch (e) {
    // Duplicate key
  }
  return DB.userCosmetics.getFull(userId);
}

/**
 * Get user OAuth data, falling back to legacy userdb.discordData / connections.
 *
 * @deprecated Use DB.userOAuth.get() directly when all users are migrated.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserOAuth(userId) {
  if (typeof userId === "object" && userId.id) userId = userId.id;
  userId = String(userId);

  const oauth = await DB.userOAuth.get(userId);
  if (oauth) return oauth;

  let legacyUser;
  try {
    legacyUser = await DB._legacyUserDB.findOne(
      { id: userId },
      { discordData: 1, connections: 1, personal: 1 }
    ).lean();
  } catch (e) {
    return null;
  }
  if (!legacyUser) return null;

  const dd = legacyUser.discordData || {};
  return {
    userId,
    discordIdentityCache: dd.id ? {
      id: dd.id,
      username: dd.username,
      avatar: dd.avatar,
      discriminator: dd.discriminator,
      global_name: dd.global_name,
      banner: dd.banner,
      flags: dd.flags,
      premium_type: dd.premium_type,
    } : null,
    discord: dd.accessToken ? {
      accessToken: dd.accessToken,
      refreshToken: dd.refreshToken,
      expiresAt: dd.expiresAt,
      scope: dd.scope,
      email: dd.email,
      locale: dd.locale,
      verified: dd.verified,
      mfa_enabled: dd.mfa_enabled,
      premium_type: dd.premium_type,
    } : null,
    patreon: legacyUser.connections?.patreon || null,
    geo: legacyUser.personal || null,
    fetchedAt: new Date(),
  };
}

// ── Update translation ───────────────────────────────────────────

/**
 * Translate a MongoDB update object from old field paths to new.
 * e.g. { $inc: { "modules.RBN": 500 } } → { $inc: { "currency.RBN": 500 } }
 *
 * @deprecated Remove when all update call-sites are migrated.
 * @param {object} update - MongoDB update document
 * @returns {object} Translated update
 */
function translateUpdate(update) {
  const translated = {};
  for (const [op, fields] of Object.entries(update)) {
    if (typeof fields !== "object" || fields === null) {
      translated[op] = fields;
      continue;
    }
    translated[op] = {};
    for (const [path, value] of Object.entries(fields)) {
      translated[op][FIELD_MAP[path] || path] = value;
    }
  }
  return translated;
}

// ── Internal helpers ─────────────────────────────────────────────

/**
 * Adapt a legacy userdb document to the new users_core shape.
 * Consumer code sees new field paths even when reading legacy data.
 *
 * @param {object} doc - Raw legacy userdb lean document
 * @returns {object} Adapted document in new shape
 */
function _adaptLegacyToNew(doc) {
  if (!doc) return null;
  const m = doc.modules || {};
  return {
    id: doc.id,
    name: doc.name || doc.meta?.tag || doc.meta?.username || "",
    tag: doc.tag || doc.meta?.tag || "",
    avatar: doc.meta?.avatar || null,
    personalhandle: doc.personalhandle || undefined,
    currency: {
      RBN: m.RBN ?? 0,
      SPH: m.SPH ?? 0,
      JDE: m.JDE ?? 0,
      PSM: m.PSM ?? 0,
      EVT: m.EVT ?? doc.eventGoodie ?? 0,
    },
    profile: {
      bgID: m.bgID ?? null,
      flairTop: m.flairTop ?? "default",
      flairDown: m.flairDown ?? "default",
      sticker: m.sticker ?? null,
      favcolor: m.favcolor ?? "#eb497b",
      persotext: m.persotext ?? "",
      tagline: m.tagline ?? "A fellow Pollux user",
      medals: m.medals ?? [0, 0, 0, 0, 0, 0, 0, 0, 0],
      skins: m.skins ?? {},
      featuredMarriage: doc.featuredMarriage ?? null,
    },
    progression: {
      level: m.level ?? 0,
      exp: m.exp ?? 0,
      globalLV: doc.progression?.globalLV ?? 0,
      globalXP: doc.progression?.globalXP ?? 0,
      craftingExp: doc.progression?.craftingExp ?? 0,
    },
    meta: {
      createdAt: doc.meta?.createdAt || (doc._id ? new Date(parseInt(doc._id.toString().substring(0, 8), 16) * 1000) : new Date()),
      lastLogin: doc.meta?.lastLogin || null,
      lastUpdated: doc.lastUpdated || null,
      migrated: false,
    },
    prime: doc.prime || null,
    blacklisted: doc.blacklisted || null,
    switches: doc.switches || {},
    counters: doc.counters || {},
    eventData: doc.eventData || {},
    // Legacy bridge (read-only)
    donator: doc.prime?.tier ?? doc.donator ?? null,
    _isLegacy: true,
  };
}

/**
 * Mark a legacy userdb document as sunset (data confirmed synced).
 *
 * @param {string} userId
 */
async function _markSunset(userId) {
  try {
    await DB._legacyUserDB.updateOne(
      { id: userId, sunset: { $ne: true } },
      { $set: { sunset: true, sunsetAt: new Date() } }
    );
  } catch (e) {
    // Swallow — non-critical, best-effort
  }
}

// ── Exports ──────────────────────────────────────────────────────

module.exports = {
  getUser,
  getUserFull,
  getUserCosmetics,
  getUserCosmeticsFull,
  getUserOAuth,
  translateUpdate,
  FIELD_MAP,
  _adaptLegacyToNew,
  _markSunset,
};
