// @ts-nocheck
const RUNNING_YEAR = new Date().getUTCFullYear();
const RUNNING_MONTH = new Date().getUTCMonth();
const RUNNING_MONTH_SHORT = new Date().toLocaleString('en', { month: 'short' }).toLowerCase();
const TURNING_DAY = 5; // when Prime starts
const GRACE_WARNING_DAY = 10; // when Prime starts yelling
const GRACE_TURNING_DAY = 15; // when Prime shuts down

const PREMIUM_INFO = {
    neutrino: {
        $:  1000,
        roleID: "532987435680923648",
        daily_bonus: 1500,
        monthly_sph: 100,
        immediate_sph: 150,
        box_bonus: [{n:15,t:'UR'}],
        monthly_jde: 10000,
        monthly_event_tkn: 2500,
        booster_bonus_box: [{n:10,t:'SR'}],
        booster_bonus_psm: 500,
        sticker_prize: {
            LAST: 2,
            RANDOM: 5,
            PACK: 8
        },
        prime_servers: 25,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    antimatter: {
        $:  500,
        roleID: "466737702772015144",
        daily_bonus: 1000,
        monthly_sph: 100,
        immediate_sph: 150,
        box_bonus: [{n:15,t:'UR'}],
        monthly_jde: 10000,
        monthly_event_tkn: 2500,
        booster_bonus_box: [{n:10,t:'SR'}],
        booster_bonus_psm: 500,
        sticker_prize: {
            LAST: 2,
            RANDOM: 5,
            PACK: 5
        },
        prime_servers: 8,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    astatine: {
        $:  100,
        roleID: "467032160763772948",
        daily_bonus: 500,
        monthly_sph: 50,
        immediate_sph: 100,
        box_bonus: [{n:10,t:'UR'}],
        monthly_jde: 5000,
        monthly_event_tkn: 1000,
        booster_bonus_box: [{n:5,t:'R'}],
        booster_bonus_psm: 200,
        sticker_prize: {
            LAST: 2,
            RANDOM: 3,
            PACK: 3
        },
        prime_servers: 8,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    uranium: {
        $:  75,
        roleID: "544620092478980111",
        daily_bonus: 400,
        monthly_sph: 50,
        immediate_sph: 30,
        box_bonus: [{n:8,t:'UR'}],
        monthly_jde: 2000,
        monthly_event_tkn: 700,
        booster_bonus_box: [{n:1,t:'C'}],
        booster_bonus_psm: 100,
        sticker_prize: {
            LAST: 2,
            RANDOM: 2,
            PACK: 3
        },
        prime_servers: 5,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    zircon: {
        $:  50,
        roleID: "467100376777228298",
        daily_bonus: 300,
        monthly_sph: 30,
        immediate_sph: 25,
        box_bonus: [{n:5,t:'UR'}],
        monthly_jde: 2000,
        monthly_event_tkn: 700,
        booster_bonus_box: [{n:1,t:'UR'}],
        booster_bonus_psm: 100,
        sticker_prize: {
            LAST: 2,
            RANDOM: 2,
            PACK: 2
        },
        prime_servers: 5,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    palladium: {
        $:  25,
        roleID: "532987443117424640",
        daily_bonus: 200,
        monthly_sph: 20,
        immediate_sph: 15,
        box_bonus: [{n:5,t:'SR'}],
        monthly_jde: 1000,
        monthly_event_tkn: 500,
        booster_bonus_box: [{n:1,t:'SR'}],
        booster_bonus_psm: 75,
        sticker_prize: {
            LAST: 1,
            RANDOM: 2,
            PACK: 1
        },
        prime_servers: 3,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    lithium: {
        $:  15,
        roleID: "467100151161290762",
        daily_bonus: 150,
        monthly_sph: 12,
        immediate_sph: 10,
        box_bonus: [{n:5,t:'SR'}],
        monthly_jde: 1000,
        monthly_event_tkn: 500,
        booster_bonus_box: [{n:1,t:'SR'}],
        booster_bonus_psm: 50,
        sticker_prize: {
            LAST: 1,
            RANDOM: 1,
            PACK: 1
        },
        prime_servers: 2,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    //DEPRECATE
    iridium: {
        $:  15,
        roleID: "532987440831660072",
        daily_bonus: 150,
        monthly_sph: 12,
        immediate_sph: 10,
        box_bonus: [{n:5,t:'SR'}],
        monthly_jde: 1000,
        monthly_event_tkn: 500,
        booster_bonus_box: [{n:1,t:'C'}],
        booster_bonus_psm: 50,
        sticker_prize: {
            LAST: 1,
            RANDOM: 1,
            PACK: 1
        },
        prime_servers: 2,
        prime_reallocation: true,
        custom_background: true,
        custom_handle: true,
        custom_shop: false,

    },
    //=====================
    carbon: {
        $:  10,
        roleID: "467100086330195998",
        daily_bonus: 100,
        monthly_sph: 5,
        immediate_sph: 5,
        box_bonus: [{n:5,t:'U'}],
        monthly_jde: 1000,
        monthly_event_tkn: 500,
        booster_bonus_box: [{n:1,t:'SR'}],
        booster_bonus_psm: 30,
        sticker_prize: {
            LAST: 1,
            RANDOM: 1,
            PACK: 1
        },
        prime_servers: 1,
        prime_reallocation: true,
        custom_background: false,
        custom_handle: true,
        custom_shop: false,
    },
    iron: {
        $:  10,
        roleID: "532987438700822529",
        daily_bonus: 100,
        monthly_sph: 2,
        immediate_sph: 10,
        box_bonus: [{n:5,t:'R'}],
        monthly_jde: 1000,
        monthly_event_tkn: 500,
        booster_bonus_box: [{n:1,t:'SR'}],
        booster_bonus_psm: 30,
        sticker_prize: {
            LAST: 1,
            RANDOM: 1,
            PACK: 0
        },
        prime_servers: 1,
        prime_reallocation: true,
        custom_background: false,
        custom_handle: true,
        custom_shop: false,
    },
    aluminium: {
        $:  5,
        roleID: "532993206040920065",
        daily_bonus: 50,
        monthly_sph: 3,
        immediate_sph: 3,
        box_bonus: [{n:5,t:'U'}],
        monthly_jde: 250,
        monthly_event_tkn: 150,
        booster_bonus_box: [{n:1,t:'R'}],
        booster_bonus_psm: 15,
        sticker_prize: {
            LAST: 0,
            RANDOM: 1,
            PACK: 0
        },
        prime_servers: 1,
        prime_reallocation: true,
        custom_background: false,
        custom_handle: false,
        custom_shop: false,

    },
    plastic: {
        $:  2,
        roleID: "544620335115534349",
        daily_bonus: 10,
        monthly_sph: 1,
        immediate_sph: 1,
        box_bonus: [],
        monthly_jde: 100,
        monthly_event_tkn: 50,
        booster_bonus_box: [{n:1,t:'C'}],
        booster_bonus_psm: 5,
        sticker_prize: false,
        prime_servers: 0,
        prime_reallocation: false,
        custom_background: false,
        custom_handle: false,
        custom_shop: false,

    },
}

const PREMIUM_STICKERS = DB.cosmetics.find({public: true, GROUP:"plx_collection"}).noCache().lean();
const PREMIUM_PACKS = DB.items.find({type: "boosterpack", GROUP:"plx_collection"}).noCache().lean();


async function processRewards( userID, {mansionMember, dry_run= false} ){
    const userData = await DB.users.findOne({id:userID}).noCache();

    const currentTier = userData.donator;
    const tierPrizes = getTierBonus(currentTier);

    const tierStreak = userData.counters?.prime_streak?.[currentTier] || 1;
    if (tierStreak === 1)  await DB.users.set(userID,{$set: {[`counters.prime_streak.${currentTier}`]: 1}});
    const totalStreak = userData.counters?.prime_streak?.total || 1;
    if (totalStreak === 1)  await DB.users.set(userID,{$set: {"counters.prime_streak.total": 1}});
    
    const bulkWriteQuery = [];

    const isBooster = true; //FIXME


    const regularQuery = {
        $inc: {
            "modules.JDE": tierPrizes.monthly_jde,
            "modules.SPH": tierPrizes.monthly_sph + (tierStreak == 1 ? tierPrizes.immediate_sph : 0),
            "eventGoodie": tierPrizes.monthly_event_tkn,            
        },
        $addToSet: {
            "modules.flairsInventory": currentTier
        }
    };
    
    tierPrizes?.box_bonus?.forEach(boostBox=> bulkWriteQuery.push(createAddItemQuery(`lootbox_${boostBox.t}_O`,boostBox.n)));

    const stickersReport = [];
    const packsReport = [];
    if (tierPrizes.sticker_prize){

        const ownedStickers = userData.modules.stickerInventory;
        const [stickerList,packsList] = await Promise.all([PREMIUM_STICKERS,PREMIUM_PACKS]);
        
        const availableStickerList = stickerList.filter(stk=> !ownedStickers.includes(stk.id) );
        const availablePacks = packsList.filter(pkg=> !pkg.name.includes(RUNNING_YEAR) );

        const lasts = []
        if (tierPrizes.sticker_prize.LAST > 0){
            let adds = tierPrizes.sticker_prize.LAST;
            while (adds-- > 0){
                let toPush = availableStickerList.pop();
                stickersReport.push(toPush);
                lasts.push(toPush.id);
            }
        }

        const randoms = []
        if (tierPrizes.sticker_prize.RANDOM > 0){
            let adds = tierPrizes.sticker_prize.LAST;
            let availableRandomStickers = shuffle(availableStickerList);
            while (adds-- > 0){
                availableRandomStickers = shuffle(availableRandomStickers);
                let toPush = availableRandomStickers.pop();
                stickersReport.push(toPush);
                randoms.push(toPush.id);
            }
        }

        const packQueries = [];
        if (tierPrizes.sticker_prize.PACK > 0){
            let adds = tierPrizes.sticker_prize.PACK;
            while (adds-- > 0){
                const toAdd = shuffle(availablePacks)[0];
                packsReport.push(toAdd);
                let query = createAddItemQuery(toAdd.id);
                packQueries.push(query);
            }
        }
        bulkWriteQuery.push(...[
            {updateOne: { 
                filter: {id: userID},
                update: {                   
                    $addToSet: {
                        "modules.stickerInventory": {$each: [...lasts,...randoms] }
                    }
                }
            }},
            ...packQueries
        ]);
        console.log(bulkWriteQuery)
    }

    if (isBooster){
        regularQuery.$inc["modules.PSM"] = tierPrizes.booster_bonus_psm;
        let boxes = tierPrizes.booster_bonus_box || []; // [{n:10,t:'SR'}]
        boxes.forEach(boostBox=> bulkWriteQuery.push(createAddItemQuery(`lootbox_${boostBox.t}_O`,boostBox.n)));
    };

    if (tierStreak >= 3){
        regularQuery.$addToSet["modules.medalInventory"] =  currentTier;
    }
    
    const report = {
        SPH: regularQuery.$inc["modules.SPH"],
        JDE: regularQuery.$inc["modules.JDE"],
        BOX: tierPrizes.box_bonus,

        EVT: regularQuery.$inc.eventGoodie,

        //Booster
        BPSM: tierPrizes.booster_bonus_psm,
        BBOX: tierPrizes.booster_bonus_box,

        STICKERS: stickersReport,
        PACKS: packsReport,
        FEAT_STICKER: stickersReport[0],

        STREAK: totalStreak,
        ASTIER: tierStreak,

        PRIME_COUNT: tierPrizes.prime_servers
        
    }

    if (dry_run){
        let data = {
            tier: userData.donator,
            info: tierPrizes,
            tierStreak,
            totalStreak,
            immediate: tierStreak == 1
        }
        if (dry_run===2) return (report);
        return {data,bulkWriteQuery,regularQuery};
    }
    
    //await DB.users.bulkWrite(bulkWriteQuery);
    
    //await DB.users.set(userID,regularQuery);

    

    function createAddItemQuery(toAdd,count=1) {
        return userData.modules.inventory.find(it => it.id === toAdd)
            ? {
                updateOne: {
                    filter: { id: userID, "modules.inventory.id": toAdd },
                    update: { $inc: { "modules.inventory.$.count": count } }
                }
            } : {
                updateOne: {
                    filter: { id: userID },
                    update: { $addToSet: { "modules.inventory": { id: toAdd, count: count } } }
                }
            };
    }

};


const baseline = 125;

const DAILY = {
    antimatter:500,
    astatine:  100,
    uranium:   75,
    zirconium: 50,
    palladium: 25,
    lithium:   15,
    carbon:    10,
    iridium:   10,
    aluminium: 5,
    plastic:   1,
}

const DAILY_GETS = {
    antimatter:1000,
    astatine:  800,
    uranium:   500,
    zirconium: 300,
    palladium: 200,
    lithium:   150,
    carbon:    150,
    iridium:   100,
    aluminium: 50,
    plastic:   10,
}

async function getTier(userID) {
    const usr = await DB.users.get(userID);
    const tier = usr.donator;
    return tier?.toLowerCase() || null;
    // return false;
}

async function getDailyBonus(user){
    const tier = await getTier(user.id || user);
    return tier ? DAILY_GETS[tier] : 0;
}

function getTierBonus(tier){
    if (!tier) return null;
    return PREMIUM_INFO[tier.toLowerCase()] || null;
}

module.exports = {
    getDailyBonus, getTier, tierInfo: PREMIUM_INFO, processRewards
}