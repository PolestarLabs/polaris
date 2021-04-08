const gemRATES = (require("../../resources/lists/GlobalNumbers.js")).LootRates.gems;

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
      let query = { rarity: this.rarity };
      query.event = this.event || "none";
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
      Object.keys(query).forEach((ky) => query[ky] ?? delete query[ky]);

      if (this.exclusive) query = [query, { exclusive: this.exclusive }]; // FIXME Is query an object or array of objects? Check where this is handled

      DB[collection].aggregate([
        { $match: query },
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
    this.amount = gem === "SPH" ? Math.ceil((gemRATES[this.rarity]) / 100) : Math.floor((gemRATES[this.rarity] + noise) * (gem === "JDE" ? 5 : 1));
    this.currency = gem;
    return this.amount;
  }

  /* NOTE this doesn't get used anywhere, also this.item doesn't exist
  getOne(col) {
    [this.item] = shuffle(shuffle(col));
  }
  */
}

module.exports = LootboxItem;
