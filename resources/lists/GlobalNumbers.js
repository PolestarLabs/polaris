const BASELINE = 128;
const FIBONACCI = function(start,pos){
  let res =start;
  let pre =0;
  while (pos--){
    let t = res;
    res += pre;
    pre = t;
  }
  return res;
}

const mdP    = (S) => ~~(FIBONACCI(BASELINE,S))
const bgP    = (S) => ~~( mdP(S) * FIBONACCI(BASELINE*2.5,1) * S / BASELINE );

module.exports = {

  colors:{
    rarity:  {
      C: "#928fa8",
      U: "#63b361",
      R: "#3646bf",
      SR: "#8827ce",
      UR: "#dc5c50",
      XR: "#981f1f",
    }
  },
  timers:{

    daily: {
      DAY:  22 * 60 * 60e3,  // 22 HOURS
      EXPIRE: this.timers.daily.day * 2.5, // 55 HOURS / 2.5x CDWN
    },
    boxTrade: 2 * 60 * 60e3,  // 2 HOURS
    transfer: 4 * 60 * 60e3,  // 4 hours
    thanks:   1 * 3.6e+6,     // (no idea)
    commend:  1 * 3.6e+6      // (no idea)


  },

  DROPMAX: 1000, // Maximum dice face for Lootbox Drops
  
  sapphireModifier: 0.000794912559618442, // ÷1258
  jadeModifier: 2250, // (legacy)
  tokenModifier: 0.5,

  bgPrices: {
    UR: bgP(6), SR: bgP(5), R: bgP(4), U: bgP(3), C: bgP(2),
  },
  medalPrices: {
    UR: mdP(6), SR: mdP(5), R: mdP(4), U: mdP(3), C: mdP(2),
  },
  LootRates: {
    rarity: {
      C: 1000, U: 400, R: 250, SR: 150, UR: 70, XR: 0,
    },
    gems: {
      C: 100, U: 200, R: 400, SR: 650, UR: 1000, XR: 2500,
    },
    itemType: {
      // JADES
      JDE: 400,
      // RUBINES
      RBN: 250,
      // MEDALS
      MDL: 200,
      // BACKGROUNDS
      BKG: 150,
      // BOOSTERS
      BPK: 200,
      // ITEMS
      ITM: 0,
      // SAPPHIRE
      SPH: 1,
    },
  },

};
