const ECO = require("./Economy");
// @ts-nocheck

const RUNNING_MONTH = new Date().getUTCMonth();
const RUNNING_MONTH_SHORT = new Date().toLocaleString("en", { month: "short" })
  .toLowerCase();
const RUNNING_MONTH_LONG = new Date().toLocaleString("en", { month: "long" })
  .toLowerCase();
const RUNNING_YEAR = new Date().getUTCFullYear();

const CURRENT_VALID_MONTH = 11;// JANUARY = 0; (10 NOV

const TURNING_DAY = 5; // when Prime starts
const GRACE_WARNING_DAY = 10; // when Prime starts yelling
const GRACE_TURNING_DAY = 15; // when Prime shuts down

// const THIS_MONTH_STICKER_CODE = `plx${RUNNING_MONTH_SHORT}${RUNNING_YEAR.slice(2)}`

const VERIFICATION_ROLE = "421181998439333901";
const LEGACY_ROLE = "663439502571732992";

const STAFF_II = [ "397086924319227914", "615972092860432385" ];
const STAFF_I = [ "397091492356685824", "278985289605578752" ];
const OFFICIAL_GUILD = "277391723322408960";

const REMAINING_8 = "556245821599776802";
const REMAINING_7 = "556245809876959264";
const REMAINING_6 = "418887056262037505";
const REMAINING_5 = "418887120896393217";
const REMAINING_4 = "418887153662164996";
const REMAINING_3 = "418887192790958090";
const REMAINING_2 = "418887224642502668";
const REMAINING_1 = "418887258699988992";
const EXPIRED_0 = "544641663348506673";
const PREMIUM_COUNTDOWN = [ REMAINING_8, REMAINING_7, REMAINING_6, REMAINING_5, REMAINING_4, REMAINING_3, REMAINING_2, REMAINING_1, EXPIRED_0 ];

const PREMIUM_INFO = {
  neutrino: {
    $: 1000,
    roleID: "532987435680923648",
    daily_bonus: 1500,
    monthly_sph: 100,
    immediate_sph: 150,
    box_bonus: [{ n: 15, t: "UR" }],
    monthly_jde: 10000,
    monthly_event_tkn: 2500,
    booster_bonus_box: [{ n: 10, t: "SR" }],
    booster_bonus_psm: 500,
    sticker_prize: {
      //LAST: 2,
      RANDOM: 5,
      PACK: 8,
    },
    prime_servers: 25,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  antimatter: {
    $: 500,
    roleID: "466737702772015144",
    daily_bonus: 1000,
    monthly_sph: 100,
    immediate_sph: 150,
    box_bonus: [{ n: 15, t: "UR" }],
    monthly_jde: 10000,
    monthly_event_tkn: 2500,
    booster_bonus_box: [{ n: 10, t: "SR" }],
    booster_bonus_psm: 500,
    sticker_prize: {
      //LAST: 2,
      RANDOM: 5,
      PACK: 5,
    },
    prime_servers: 8,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  astatine: {
    $: 100,
    roleID: "467032160763772948",
    daily_bonus: 500,
    monthly_sph: 50,
    immediate_sph: 100,
    box_bonus: [{ n: 10, t: "UR" }],
    monthly_jde: 5000,
    monthly_event_tkn: 1000,
    booster_bonus_box: [{ n: 5, t: "R" }],
    booster_bonus_psm: 200,
    sticker_prize: {
      //LAST: 2,
      RANDOM: 3,
      PACK: 3,
    },
    prime_servers: 8,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  uranium: {
    $: 75,
    roleID: "544620092478980111",
    daily_bonus: 400,
    monthly_sph: 50,
    immediate_sph: 30,
    box_bonus: [{ n: 8, t: "UR" }],
    monthly_jde: 2000,
    monthly_event_tkn: 700,
    booster_bonus_box: [{ n: 1, t: "C" }],
    booster_bonus_psm: 100,
    sticker_prize: {
      //LAST: 2,
      RANDOM: 2,
      PACK: 3,
    },
    prime_servers: 5,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  zircon: {
    $: 50,
    roleID: "467100376777228298",
    daily_bonus: 300,
    monthly_sph: 30,
    immediate_sph: 25,
    box_bonus: [{ n: 5, t: "UR" }],
    monthly_jde: 2000,
    monthly_event_tkn: 700,
    booster_bonus_box: [{ n: 1, t: "UR" }],
    booster_bonus_psm: 100,
    sticker_prize: {
      //LAST: 2,
      RANDOM: 2,
      PACK: 2,
    },
    prime_servers: 5,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  palladium: {
    $: 25,
    roleID: "532987443117424640",
    daily_bonus: 200,
    monthly_sph: 20,
    immediate_sph: 15,
    box_bonus: [{ n: 5, t: "SR" }],
    monthly_jde: 1000,
    monthly_event_tkn: 500,
    booster_bonus_box: [{ n: 1, t: "SR" }],
    booster_bonus_psm: 75,
    sticker_prize: {
      //LAST: 1,
      RANDOM: 2,
      PACK: 1,
    },
    prime_servers: 3,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  lithium: {
    $: 15,
    roleID: "467100151161290762",
    daily_bonus: 150,
    monthly_sph: 12,
    immediate_sph: 10,
    box_bonus: [{ n: 5, t: "SR" }],
    monthly_jde: 1000,
    monthly_event_tkn: 500,
    booster_bonus_box: [{ n: 1, t: "SR" }],
    booster_bonus_psm: 50,
    sticker_prize: {
      //LAST: 1,
      RANDOM: 1,
      PACK: 0,
    },
    prime_servers: 2,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  // DEPRECATE
  iridium: {
    $: 15,
    roleID: "532987440831660072",
    daily_bonus: 150,
    monthly_sph: 12,
    immediate_sph: 10,
    box_bonus: [{ n: 5, t: "SR" }],
    monthly_jde: 1000,
    monthly_event_tkn: 500,
    booster_bonus_box: [{ n: 1, t: "C" }],
    booster_bonus_psm: 50,
    sticker_prize: {
      //LAST: 1,
      RANDOM: 1,
      PACK: 0,
    },
    prime_servers: 2,
    prime_reallocation: true,
    custom_background: true,
    custom_handle: true,
    custom_shop: false,

  },
  //= ====================
  carbon: {
    $: 10,
    roleID: "467100086330195998",
    daily_bonus: 100,
    monthly_sph: 5,
    immediate_sph: 5,
    box_bonus: [{ n: 5, t: "U" }],
    monthly_jde: 1000,
    monthly_event_tkn: 500,
    booster_bonus_box: [{ n: 1, t: "SR" }],
    booster_bonus_psm: 30,
    sticker_prize: {
      //LAST: 1,
      RANDOM: 1,
      PACK: 0,
    },
    prime_servers: 1,
    prime_reallocation: true,
    custom_background: false,
    custom_handle: true,
    custom_shop: false,
  },
  iron: {
    $: 10,
    roleID: "532987438700822529",
    daily_bonus: 100,
    monthly_sph: 2,
    immediate_sph: 10,
    box_bonus: [{ n: 5, t: "R" }],
    monthly_jde: 1000,
    monthly_event_tkn: 500,
    booster_bonus_box: [{ n: 1, t: "SR" }],
    booster_bonus_psm: 30,
    sticker_prize: {
      //LAST: 1,
      RANDOM: 1,
      PACK: 0,
    },
    prime_servers: 1,
    prime_reallocation: true,
    custom_background: false,
    custom_handle: true,
    custom_shop: false,
  },
  aluminium: {
    $: 5,
    roleID: "532993206040920065",
    daily_bonus: 50,
    monthly_sph: 3,
    immediate_sph: 3,
    box_bonus: [{ n: 5, t: "U" }],
    monthly_jde: 250,
    monthly_event_tkn: 150,
    booster_bonus_box: [{ n: 1, t: "R" }],
    booster_bonus_psm: 15,
    sticker_prize: {
      LAST: 0,
      RANDOM: 1,
      PACK: 0,
    },
    prime_servers: 1,
    prime_reallocation: true,
    custom_background: false,
    custom_handle: false,
    custom_shop: false,

  },
  plastic: {
    $: 2,
    roleID: "544620335115534349",
    daily_bonus: 10,
    monthly_sph: 1,
    immediate_sph: 1,
    box_bonus: [],
    monthly_jde: 100,
    monthly_event_tkn: 50,
    booster_bonus_box: [{ n: 1, t: "C" }],
    booster_bonus_psm: 5,
    sticker_prize: false,
    prime_servers: 0,
    prime_reallocation: false,
    custom_background: false,
    custom_handle: false,
    custom_shop: false,

  },
};

const PREMIUM_STICKERS = DB.cosmetics.find({ public: true, GROUP: "plx_collection" }).noCache()
  .then((x) => x.sort((a, b) => a._doc.release_number - b._doc.release_number));
const PREMIUM_PACKS = DB.items.find({ type: "boosterpack", filter: "plx_collection" }).noCache()
  .lean();

function REWARDS_ROLLOUT() {
  return new Date(global.PRIME_ROLLOUT_OVERRIDE || `${RUNNING_MONTH + 1}/${TURNING_DAY}/${RUNNING_YEAR}`);
}

async function shiftCountdownRoles(Member) {
  let STATUS = "unknown";
  let i = PREMIUM_COUNTDOWN.length;

  while (--i > 0) {
    const roleID = PREMIUM_COUNTDOWN[i];
    const nextRoleID = PREMIUM_COUNTDOWN[i + 1];

    if (!roleID) break;

    if (Member.roles.includes(roleID)) {
      if (!nextRoleID) {
        STATUS = "expired";
        continue;
      }
      await PLX.addGuildMemberRole(Member.guild.id, Member.id, nextRoleID).timeout(5e3)
        .catchReturn();
      await PLX.removeGuildMemberRole(Member.guild.id, Member.id, roleID).timeout(5e3)
        .catchReturn();

      STATUS = PREMIUM_COUNTDOWN.length - i - 2;
      break;
    }
  }

  return STATUS;
}

function isStaff(member) {
  return member.roles.some((role) => STAFF_II.includes(role)) ? 2 : member.roles.some((role) => STAFF_I.includes(role)) ? 1 : 0;
}
function tierLevel(tier) {
  return Object.keys(PREMIUM_INFO).indexOf(tier);
}
function tierFromLevel(level) {
  return Object.keys(PREMIUM_INFO)[level];
}

function tierDiff(oldTier, newTier) {
  return {
    monthly_sph: Math.max(-oldTier.monthly_sph + newTier.monthly_sph, 0),
    immediate_sph: Math.max(-oldTier.immediate_sph + newTier.immediate_sph, 0),
    box_bonus: [ {
      n: (oldTier.box_bonus[0]?.n || 0) * -1,
      t: oldTier.box_bonus[0]?.t || "C",
    }, {
      n: newTier.box_bonus[0]?.n || 0,
      t: newTier.box_bonus[0]?.t || "C",
    } ],
    monthly_jde: Math.max(-oldTier.monthly_jde - newTier.monthly_jde, 0),
    monthly_event_tkn: Math.max(-oldTier.monthly_event_tkn + newTier.monthly_event_tkn, 0),
    booster_bonus_box: [],
    booster_bonus_psm: Math.max(-oldTier.booster_bonus_psm + newTier.booster_bonus_psm, 0),
    sticker_prize: {
      LAST: Math.max((-oldTier.sticker_prize?.LAST || 0) + (newTier.sticker_prize?.LAST || 0), 0),
      RANDOM: Math.max((-oldTier.sticker_prize?.RANDOM || 0) + (newTier.sticker_prize?.RANDOM || 0), 0),
      PACK: Math.max((-oldTier.sticker_prize?.PACK || 0) + (newTier.sticker_prize?.PACK || 0), 0),
    },
    prime_servers: newTier.prime_servers,
    prime_reallocation: newTier.prime_reallocation,
    custom_background: newTier.custom_background,
    custom_handle: newTier.custom_handle,
    custom_shop: newTier.custom_shop,
  };
}

async function checkPrimeStatus(mansionMember) {
  if (mansionMember.guild.id != OFFICIAL_GUILD) mansionMember = await PLX.resolveMember(OFFICIAL_GUILD, mansionMember.id, { enforceDB: true, softMatch: false });
  if (CURRENT_VALID_MONTH !== RUNNING_MONTH) return Promise.reject("waiting");

  const userData = (await DB.users.findOne({ id: mansionMember.id }).noCache())?._doc;

  const premiumRoles = mansionMember.roles.filter((roleID) => Object.values(PREMIUM_INFO).find((tier) => tier.roleID === roleID));
  const highestPremiumRoleTier = Object.keys(PREMIUM_INFO).find((tier) => premiumRoles.includes(PREMIUM_INFO[tier].roleID));
  const roleVerified = mansionMember.roles.includes(VERIFICATION_ROLE);
  const isLegacy = mansionMember.roles.includes(LEGACY_ROLE);
  const rewardsLastClaimed = userData.prime?.lastClaimed || 0;
  const countdownStatus = await shiftCountdownRoles(mansionMember);

  if (countdownStatus === "expired") return Promise.reject("expired");

  const staffLevel = isStaff(mansionMember);

  if (!roleVerified && !staffLevel) return Promise.reject("unverified");
  let currentTier = userData.prime?.tier || highestPremiumRoleTier;

  let isStaffMember = false;
  if (staffLevel) {
    isStaffMember = true;
    let designatedTier;
    if (staffLevel === 2) designatedTier = "carbon";
    if (staffLevel === 1) designatedTier = "aluminium";
    // if up to palladium, add +1
    if (currentTier && tierLevel(currentTier) > 5) {
      designatedTier = tierFromLevel(tierLevel(currentTier) - 1);
    }
    currentTier = designatedTier;
  }

  // const tierPrizes = getTierBonus(currentTier);
  // const isActiveUnderTier = mansionMember.roles.includes(tierPrizes.roleID);

  let STATUS = "ok";

  let interTier;
  console.log({ highestPremiumRoleTier, currentTier });
  // if claiming after rollout
  if (new Date(rewardsLastClaimed) > REWARDS_ROLLOUT()) {
    if (currentTier && highestPremiumRoleTier && currentTier != highestPremiumRoleTier) {
      interTier = tierDiff(PREMIUM_INFO[currentTier], PREMIUM_INFO[highestPremiumRoleTier]);
      STATUS = tierLevel(currentTier) > tierLevel(highestPremiumRoleTier) ? "upgrade" : "downgrade";
      if (STATUS === "downgrade") return Promise.reject("downgrading");
      interTier.from = currentTier;
      interTier.to = highestPremiumRoleTier;
    } else {
      return Promise.reject("already-claimed");
    }
  }

  currentTier = highestPremiumRoleTier;

  console.log(new Date(rewardsLastClaimed), REWARDS_ROLLOUT(), "new Date(rewardsLastClaimed) > REWARDS_ROLLOUT()");
  console.log(currentTier && highestPremiumRoleTier && currentTier != highestPremiumRoleTier, "currentTier && highestPremiumRoleTier && currentTier != highestPremiumRoleTier");
  //console.log({ interTier, STATUS });

  if (!currentTier || !userData) STATUS = "not-prime";

  return {
    STATUS, interTier, currentTier, isStaff: isStaffMember, isLegacy,
  };
}
async function processRewards(userID, options) {
  const {
    dry_run, interTier, isStaff: isStaffMember, isLegacy,
  } = options || {};
  const mansionMember = await PLX.resolveMember(OFFICIAL_GUILD, userID, { enforceDB: true, softMatch: false }).catch(() => {});

  const userData = await DB.users.findOne({ id: userID }).noCache();

  let currentTier = options?.currentTier; // || userData.prime?.tier || userData.donator;
  const tierPrizes = { ...getTierBonus(currentTier) };

  //console.log({ interTier, options, userID });

  if (interTier) {
    Object.assign(tierPrizes, interTier);
    currentTier = interTier.to;
  }

  if (!currentTier) return Promise.reject("NO TIER REGISTERED");

  const tierStreaks = userData.counters?.prime_streak;
  let currentTierStreak = tierStreaks?.[currentTier] || 0;

  if (!userData.counters?.prime_streak) {
    await DB.users.set(userID, { $set: { "counters.prime_streak": {} } });
  }
  let totalStreak = userData.counters?.prime_streak?.total || 0;

console.log({tierStreaks,totalStreak,currentTierStreak})
  
  if (!tierStreaks || !currentTierStreak)  await DB.users.set(userID, { $set: { [`counters.prime_streak.${currentTier}`]: 1 } });
  else await DB.users.set(userID, { $inc: { [`counters.prime_streak.${currentTier}`]: 1 } });

  if (!totalStreak) await DB.users.set(userID, { $set: { "counters.prime_streak.total": 1 } });
  else await DB.users.set(userID, { $inc: { "counters.prime_streak.total": 1 } });

  totalStreak++;
  currentTierStreak++;
  

  const bulkWriteQuery = [];

  const isBooster = mansionMember?.premiumSince;

  const regularQuery = {
    $set: {
      donator: currentTier, // LEGACY
      "prime.lastClaimed": Date.now(),
      "prime.tier": currentTier,
      "prime.active": true,
      "prime.maxServers": (tierPrizes.prime_servers || (isStaffMember ? 1 : 0)) + (isLegacy ? 1 : 0),
      "prime.canReallocate": tierPrizes.prime_reallocation || isStaffMember || isLegacy,
      "prime.custom_background": tierPrizes.custom_background || isStaffMember || isLegacy,
      "prime.custom_handle": tierPrizes.custom_handle || isStaffMember || isLegacy,
      "prime.custom_shop": tierPrizes.custom_shop,
    },
    $inc: {
      "modules.EVT": tierPrizes.monthly_event_tkn,
    },
    $addToSet: {
      "modules.flairsInventory": currentTier,
    },
  };

  tierPrizes?.box_bonus?.forEach((boostBox) => bulkWriteQuery.push(createAddItemQuery(`lootbox_${boostBox.t}_O`, boostBox.n)));

  const stickersReport = [];
  const packsReport = [];
  if (tierPrizes.sticker_prize) {
    const ownedStickers = userData.modules.stickerInventory;
    const [ stickerList, packsList ] = await Promise.all([ PREMIUM_STICKERS, PREMIUM_PACKS ]);

    const availableStickerList = stickerList.filter((stk) => !ownedStickers.includes(stk.id)); ;

    const availablePacks = packsList.filter((pkg) => !pkg.name.includes(RUNNING_YEAR));

    const lasts = [];
    if (tierPrizes.sticker_prize.LAST > 0) {
      let adds = tierPrizes.sticker_prize.LAST;
      while (adds-- > 0) {
        const toPush = stickerList.pop();
        if (!toPush) {
          lasts.push( toPush.id );
          break;
        }
        stickersReport.push(toPush);
        lasts.push(toPush.id);
      }
      stickersReport.sort((x,y)=> (x?.release_number || 0) - y?.release_number || 0 );
    }

    const randoms = [];
    if (tierPrizes.sticker_prize.RANDOM > 0) {
      let adds = tierPrizes.sticker_prize.RANDOM;
      let availableRandomStickers = shuffle(availableStickerList);
      while (adds-- > 0) {
        availableRandomStickers = shuffle(availableRandomStickers);
        const toPush = availableRandomStickers.pop();
        if (toPush) {
          stickersReport.push(toPush);
          randoms.push(toPush.id);
        }
      }
    }

    const packQueries = [];
    if (tierPrizes.sticker_prize.PACK > 0) {
      let adds = tierPrizes.sticker_prize.PACK;

      while (adds-- > 0) {
        const toAdd = shuffle(availablePacks)[0];
        if (toAdd) {
          packsReport.push(toAdd);
          const query = createAddItemQuery(toAdd.id);
          packQueries.push(query);
        }
      }
    }
    bulkWriteQuery.push(...[
      {
        updateOne: {
          filter: { id: userID },
          update: {
            $addToSet: {
              "modules.stickerInventory": { $each: [ ...lasts, ...randoms ] },
            },
          },
        },
      },
      ...packQueries,
    ]);
  }

  if (isBooster) {
    regularQuery.$inc["modules.PSM"] = tierPrizes.booster_bonus_psm;
    const boxes = tierPrizes.booster_bonus_box || []; // [{n:10,t:'SR'}]
    boxes.forEach((boostBox) => bulkWriteQuery.push(createAddItemQuery(`lootbox_${boostBox.t}_O`, boostBox.n)));
  }

  if (currentTierStreak >= 3) {
    regularQuery.$addToSet["modules.medalInventory"] = currentTier;
  }

  const amts = [ tierPrizes.monthly_jde, tierPrizes.monthly_sph ];
  const currs = [ "JDE", "SPH" ];
  if (currentTierStreak == 1) amts.push(tierPrizes.immediate_sph) && currs.push("SPH");

  const report = {
    SPH: amts[1] + (amts[2] || 0),
    JDE: amts[0],
    BOX: tierPrizes.box_bonus,

    EVT: regularQuery.$inc["modules.EVT"],

    // Booster
    IS_BOOSTER: isBooster,
    BPSM: tierPrizes.booster_bonus_psm,
    BBOX: tierPrizes.booster_bonus_box,

    STICKERS: stickersReport,
    PACKS: packsReport,
    FEAT_STICKER: stickersReport[0],

    STREAK: totalStreak,
    AS_TIER: tierStreaks,
    HAS_FLAIR: userData.modules.flairsInventory.includes(currentTier),
    HAS_MEDAL: userData.modules.medalInventory.includes(currentTier),
    AWARD_MEDAL: currentTierStreak >= 3 && !userData.modules.medalInventory.includes(currentTier),

    PRIME_COUNT: tierPrizes.prime_servers,

  };

  const data = {
    tier: currentTier,
    info: tierPrizes,
    tierStreak: currentTierStreak,
    totalStreak,
    immediate: currentTierStreak == 1,
  };
  if (dry_run) {
    if (dry_run === 2) return report;
    return {
      data, bulkWriteQuery, regularQuery, report,
    };
  }

  //console.log("bulkWriteQuery".bgYellow);
  //console.log(require("util").inspect({ bulkWriteQuery, regularQuery, amts }, 0, 5, 1));

  // FIXME replace this
  if (!userData.modules.EVT) {
    console.log("User has no EVT history");
    //await DB.users.set(userID, { "modules.EVT": 0 }).catch((err) => { console.error(err); return null; });
  }

  const q1 = await DB.users.bulkWrite(bulkWriteQuery).catch((err) => { console.error(err); return null; });
  const q2 = await DB.users.set(userID, regularQuery).catch((err) => { console.error(err); return null; });
  const q3 = await ECO.receive(userID, amts, "dono_rewards", currs, { details: { tier: currentTier, month: RUNNING_MONTH_SHORT, year: RUNNING_YEAR } });

  return {
    data, report, success: !!q1 && !!q2 && !!q3, qBreakdown: { q1, q2, q3 },
  };

  function createAddItemQuery(toAdd, count = 1) {
    return userData.modules.inventory.find((it) => it.id === toAdd)
      ? {
        updateOne: {
          filter: { id: userID, "modules.inventory.id": toAdd },
          update: { $inc: { "modules.inventory.$.count": count } },
        },
      } : {
        updateOne: {
          filter: { id: userID },
          update: { $addToSet: { "modules.inventory": { id: toAdd, count } } },
        },
      };
  }
}

const baseline = 125;

const DAILY = {
  antimatter: 500,
  astatine: 100,
  uranium: 75,
  zirconium: 50,
  palladium: 25,
  lithium: 15,
  carbon: 10,
  iridium: 10,
  aluminium: 5,
  plastic: 1,
};

const DAILY_GETS = {
  antimatter: 1000,
  astatine: 800,
  uranium: 500,
  zirconium: 300,
  palladium: 200,
  lithium: 150,
  carbon: 150,
  iridium: 100,
  aluminium: 50,
  plastic: 10,
};

async function getTier(userID) {
  const usr = await DB.users.get(userID);
  if (!usr) return null;
  const tier = usr.prime?.tier || usr.donator; // LEGACY SUPPORT
  return tier?.toLowerCase() || null;
  // return false;
}

async function getDailyBonus(user) {
  const tier = await getTier(user.id || user);
  return tier ? DAILY_GETS[tier] : 0;
}

function getTierBonus(tier) {
  if (!tier) return null;
  return PREMIUM_INFO[tier.toLowerCase()] || null;
}

module.exports = {
  getDailyBonus,
  getTier,
  tierInfo: PREMIUM_INFO,
  processRewards,
  shiftCountdownRoles,
  checkPrimeStatus,
  PREMIUM_STICKERS,
  GRACE_WARNING_DAY,
  GRACE_TURNING_DAY,
  RUNNING_MONTH_SHORT,
  RUNNING_MONTH_LONG,
  RUNNING_YEAR,
  RUNNING_MONTH,
  TURNING_DAY,
  VERIFICATION_ROLE,
  OFFICIAL_GUILD,
  REWARDS_ROLLOUT,
};
