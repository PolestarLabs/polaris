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

  DROPMAX: 1000, // Maximum dice face for Lootbox Drops


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
      ITM: 100,
      // SAPPHIRE
      SPH: 1,
    },
  },

};
