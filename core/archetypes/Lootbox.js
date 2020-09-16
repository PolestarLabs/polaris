/* eslint max-classes-per-file: ["error", 2] */
/** *********************** */
//          ODDS          //
/** *********************** */

const { LootRates: RATES } = require("../../GlobalNumbers.js");

const itmODDS = RATES.itemType;
const rarODDS = RATES.rarity;
const gemRATES = RATES.gems;
const COLORS = {
  C: "#928fa8",
  U: "#63b361",
  R: "#3646bf",
  SR: "#8827ce",
  UR: "#dc5c50",
  XR: "#981f1f",
};

const POPULATE = (pile, no, pushee) => { while ((no -= 1)) shuffle(pile).push(pushee); return shuffle(pile); };

const itmPILE = [];
Object.keys(itmODDS).forEach((i) => POPULATE(itmPILE, itmODDS[i], i));
const rarPILE = [];
Object.keys(rarODDS).forEach((i) => POPULATE(rarPILE, rarODDS[i], i));

//= ================================================================

function legacyEmblem(ct, mini) {
  if (ct.type === "medal") return "MEDAL";
  if (ct.type === "background") return "BG";
  if (ct.type === "boosterpack") return mini ? "BOOSTER" : "STAMP";
  if (ct.currency === "RBN") return mini ? "RUBINES" : `RUBINE_${ct.rarity}`;
  if (ct.currency === "JDE") return mini ? "JADES" : `JADE_${ct.rarity}`;
  if (ct.currency === "SPH") return mini ? "SAPPHIRE" : `SAPPHIRE_${ct.rarity}`;
  return null;
}

class LootboxItem {
  #filter;

  #bypass;

  constructor(t, r, p) {
    this.type = t === "BKG" ? "background"
      : t === "MDL" ? "medal"
        : t === "BPK" ? (this.collection = "items", "boosterpack")
          : t === "ITM" ? (this.collection = "items", p.itemType)
            : ["RBN", "JDE", "SPH"].includes(t) ? "gems" : null;

    this.rarity = r || "C";
    this.exclusive = p.exclusive;
    this.event = p.event;
    this.#filter = p.filter;
    this.#bypass = p.bypass || [];
  }

  fetchFrom(collection) {
    collection = collection || this.collection || "cosmetics";
    this.loaded = new Promise((resolve) => {
      const query = { rarity: this.rarity };
      query.event = this.event;
      query.filter = this.#filter;

      query.droppable = !this.#bypass.includes("droppable");
      if (this.type !== "boosterpack") query.public = !this.#bypass.includes("public");

      // ITEM DB FORMAT QUERY ISSUES
      if (this.collection === "items") {
        delete query.event;
        delete query.filter;
        delete query.public;
      }

      query.type = this.type;
      const queries = [query];
      if (this.exclusive) queries.push({ exclusive: this.exclusive });
      DB[collection].aggregate([
        { $match: { $or: queries } },
        { $sample: { size: 1 } },
      ]).then((res) => {
        [res] = res;
        if (!res) {
          this.type = "gems";
          this.calculateGems("RBN");
          this.query = query;
          resolve(this);
          return (this.loaded = true);
        }
        this.objectId = res._id;
        this.id = res.id;
        this.name = res.name;
        this.code = res.code;
        this.event = res.event;
        this.icon = res.icon;
        this.release_pack = res.BUNDLE;
        this.isPublic = res.public;
        resolve(this);
        return (this.loaded = true);
      });
    });
    return this.loaded;
  }

  calculateGems(gem) {
    const noise = randomize(-30, 100);
    this.amount = gem === "SPH" ? 1 : Math.floor((gemRATES[this.rarity] + noise) * (gem === "JDE" ? 8 : 1));
    this.currency = gem;
    return this.amount;
  }

  getOne(col) {
    [this.item] = shuffle(shuffle(col));
  }
}

class Lootbox {
  #size;

  #filter;

  constructor(rar, options = {}) {
    this.rarity = rar;
    this.content = [];
    this.timestamp = Date.now();
    this.color = COLORS[this.rarity];
    this.id = options.id || "unknown";
    this.event = options.event || false;
    this.#size = options.size || 3;
    this.#filter = options.filter || false;

    const rarArray = Lootbox._shuffle(rarPILE).slice(0, this.#size - 1).concat(rar);
    const eveArray = Lootbox._shuffle(([...new Array(this.#size - 1)]).concat(this.event));
    const fltArray = Lootbox._shuffle(([...new Array(this.#size - 1)]).concat(this.#filter));
    const itmArray = Lootbox._shuffle(itmPILE).slice(0, this.#size);

    let contentBlueprint = [];
    for (let i = 0; i < this.#size; i++) {
      const itemTypeArray = Lootbox._shuffle(["junk", "junk", "junk", "material", "material", "junk"]);
      contentBlueprint.push({
        rarity: rarArray[i], event: eveArray[i], item: itmArray[i], itemType: itemTypeArray[0], filter: fltArray[i],
      });
    }

    contentBlueprint = Lootbox._shuffle(contentBlueprint);

    this.content = contentBlueprint.map((cbl) => {
      const Item = new LootboxItem(cbl.item, cbl.rarity, cbl);
      if (Item.collection) Item.fetchFrom(Item.collection);
      else if (Item.type !== "gems") Item.fetchFrom();
      else Item.calculateGems(cbl.item);
      return Item;
    });

    this.compileVisuals = new Promise((resolve) => {
      this.visuals = new Array(3);
      let completed = 0;
      this.content.forEach(async (ct, i, a) => {
        await ct.loaded;
        if (ct.type === "background") this.visuals[i] = (`${paths.CDN}/backdrops/${ct.code || ct.id}.png`);
        if (ct.type === "medal") this.visuals[i] = (`${paths.CDN}/medals/${ct.icon}.png`);
        if (ct.collection === "items") this.visuals[i] = (`${paths.CDN}/build/items/${ct.icon || ct.id}.png`);
        if (ct.type === "boosterpack") this.visuals[i] = (`${paths.CDN}/boosters/showcase/${ct.icon}.png`);
        if (ct.type === "gems") this.visuals[i] = (`${paths.CDN}/build/LOOT/${ct.currency}_${ct.rarity}.png`);

        if ((completed += 1) === a.length) {
          resolve(null);
          delete this.compileVisuals;
        }
      });
    });

    this.legacyfy = new Promise((resolve) => {
      this.legacy = [];
      let completed = 0;
      this.content.forEach(async (ct, i, a) => {
        await ct.loaded;
        this.legacy.push({
          item: ct.type === "boosterpack" ? ct.id : ct.code || ct.icon || ct.id || ct.amount,
          rarity: ct.rarity,
          emblem: legacyEmblem(ct),
          type: legacyEmblem(ct, true),
          name: ct.name || ct.amount || ct.icon || ct.code || ct.id,
        });
        if ((completed += 1) === a.length) {
          resolve(this.legacy);
          delete this.legacyfy;
        }
      });
    });
  }

  static _shuffle(arr) {
    const newArr = arr.slice();
    arr.forEach((_, i) => {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newArr[i];
      newArr[i] = newArr[j];
      newArr[j] = temp;
    });
    return newArr;
  }
}

module.exports = { Lootbox, LootboxItem, rates: RATES };
