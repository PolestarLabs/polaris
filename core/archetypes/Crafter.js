// @ts-check
const diff = require("fast-diff");
const { EventEmitter } = require("events");
const { inspect } = require("util");
const { checkFunds, pay, generatePayload } = require("./Economy");

let allItems = new Map();
let allItemsName = new Map();
let craftedItems = new Map();

function init() { // @ts-ignore
    return DB.items.find({}).lean().exec().then(ALLITEMS => {
        for (const item of ALLITEMS) {
            // Add all items by ID & name iff different.
            allItems.set(item.id, item);
            if (item.id !== item.name) allItemsName.set(item.name, item.id);

            // Also add item to craftedItems if craftable.
            if (item.crafted) craftedItems.set(item.id, item);
        }
    });
}
init().then(() => setTimeout(() => init(), 6e5));


/****************\
* *  SETTINGS  * *
\****************/

const baselineBonus = {
    C:1,
    U:2,
    R:5,
    SR:10,
    UR:25,
    XR:50,
}

// A penalty < 1 will be interpreted as a %. Penalties have to be positive.
// Can also define every currency for itself.
// Note that'll exclude it from the general 'gems'.
const autoPenalties = {
    xp: 0.2,
    gems: 0.5,
    SPH: 0,
}

/***********\
 * *  END  * *
 \***********/

class Crafter extends EventEmitter {
    _count = 1;
    _item;
    _userID;
    _modules;

    _gemsTotal = {};
    _itemsCrafting = {};
    _itemsInventory = {};
    _itemsMissing = {};

    _penalty_gems = {};

    _mode = 0;
    _report;

    constructor(userid, item, count) {
        super();
        // try finding the item.
        let id = item["id"] || item;
        this._item = allItems.get(id);
        if (!this._item) throw new Error(`Couldn't find item. Got: ${item}`);

        // set count
        this._userID = userid;
        if (count) this._count = count;

        // Set user data
        Promise.all([
            DB.users.getFull({ id: userid }),
            DB.users.get(userid)
        ]).then(([dataFull, data]) => {
            if (!data) throw new Error(`Couldn't find user by ID: ${userid}`);
            this._modules = data.modules;
            Object.assign(this._modules, dataFull);
            this._init();
        });
        DB.users.getFull({ id: userid }).then(data => {
            
        });
    }

    get _inventory() { return this._modules.inventory }

    /**
     * Returns an array of arrays with: name, amount needed (+penalty), amount available, penalty amount.
     * @returns {[string, number, number, number][]}
     */
    get gemsTotal() {
        const toret = [];
        const gemsTotal = this._gemsTotal;
        for (const gem of Object.keys(gemsTotal)) {
            toret.push([
                gem,
                gemsTotal[gem] + (this._penalty_gems[gem] || 0),
                this._modules[gem],
                (this._penalty_gems[gem] || 0),
            ]);
        } // @ts-ignore
        return toret;
    }
    /**
     * Returns an array of arrays as [gem, missing, penalty (included in missing)].
     * @returns {[string, number, number][]}
     */
    get gemsMissing() { 
        const toret = [];
        for (const a of this.gemsTotal) {
            const missing = -(a[2] - a[1]);
            if (missing > 0) toret.push([a[0], missing, a[3]]);
        } // @ts-ignore
        return toret;
     }
    get isMissingGems() { return this.gemsTotal.some(arr => arr[2] < arr[1]) }


    /**
     * Returns an array of arrays as [gem, need, have]. 
     * @returns {[string, number, number][]}
     */
    get itemsTotal() {
        const toret = [];
        const itemsTotal = {};

        for (const item of Object.keys(this._itemsCrafting)) itemsTotal[item] = (itemsTotal[item] || 0) + this._itemsCrafting[item]
        for (const item of Object.keys(this._itemsInventory)) itemsTotal[item] = (itemsTotal[item] || 0) + this._itemsInventory[item]
        for (const item of Object.keys(this._itemsMissing)) itemsTotal[item] = (itemsTotal[item] || 0) + this._itemsMissing[item]

        for (const item of Object.keys(itemsTotal)) {
            toret.push([
                item,
                itemsTotal[item],
                this._getFromInventory(item)?.count || 0
            ]);
        } // @ts-ignore
        return toret;
    }
    /**
     * Returns an array of arrays as [item, missing].
     * @returns {[string, number][]}
     */
    get itemsMissing() { return Object.keys(this._itemsMissing).map(itm => [itm, this._itemsMissing[itm]]) }
    get itemsCrafted() { return Object.keys(this._itemsCrafting).map(itm => [itm, this._itemsCrafting[itm]]) }
    get itemsInventory() { return Object.keys(this._itemsInventory).map(itm => [itm, this._itemsInventory[itm], this._getFromInventory(itm)?.count || 0]) }
    get isMissingItems() { return !!this.itemsMissing.length }

    get xp() { return this._xp() - this.penalty_xp }
    get penalty_xp() { return autoPenalties.xp >= 1 ? autoPenalties.xp : this._xp() * autoPenalties.xp; }
    _xp() {
        return Object.keys(this._itemsCrafting)
              .map(toCraft => baselineBonus[Crafter.getItem(toCraft).rarity] * this._itemsCrafting[toCraft])
              .reduce((a,b) => a + b, 0)
              + this.mode === 2 ? 0 : (baselineBonus[this._item.rarity] * this._count);
    }


    get hasCrafted() { return !!this._getFromInventory(this._item.id)?.crafted }

    _getFromInventory(id) { return this._inventory.find(itm => itm.id === id) }

    /**
     * Sets the mode of this crafter.
     * 0: item.
     * 1: autocraft.
     * 2: autocraft dependencies.
     *
     * @param {0|1|2} int
     * @memberof Crafter
     */
    setMode(int) {
        this._mode = int;
        this._clear();
        if (int === 1) this.autoGen(false);
        if (int === 2) this.autoGen(true);
    }

    confirm() {
        /**
        * Handling all the DB stuff in one query:
        * 1. User pays all the gem(s).
        * 2. User pays all the item(s).
        * 3. User gets crafted item(s) added.
        * 4. User receives XP for ALL the (intermediate) crafted item(s).
        * 5. Amount crafted is updated for ALL (intermediate) crafted item(s).
        * THEN payloads get inserted & returned.=
        */
        const user = {}, plx = {}, arrayFilters = [];

        let i = 0;
        const itemsCrafted = this.itemsCrafted;
        itemsCrafted.push([this._item.id, this._count]);
        for(;i < itemsCrafted.length; i++) {
            const [itemID, amount] = itemsCrafted[i];
            arrayFilters.push({ [`i${i}.id`]: itemID });
            user[`modules.inventory.$[i${i}].crafted`] = amount;
            if (itemID === this._item.id) user[`modules.inventory.$[i${i}].count`] = amount;
        }
        const itemsInventory = this.itemsInventory;
        for(let j = 0; j < itemsInventory.length; j++) {
            const [itemID, amount] = itemsInventory[j];
            arrayFilters.push({ [`i${i}.id`]: itemID });
            user[`modules.inventory.$[i${i}].count`] = -amount;
            i++;
        }
        for (const gemArr of this.gemsTotal) {
            user[`modules.${gemArr[0]}`] = -gemArr[1];
            plx[`modules.${gemArr[0]}`] = gemArr[1];
        }
        if (this.xp) user["progression.craftingXP"] = this.xp;

        const toWrite = [{ updateOne: { filter: { id: this._userID }, update: { $inc: user }, arrayFilters  } }]; 
        if (Object.keys(plx).length) toWrite.push({ updateOne: { filter: { id: PLX.user.id }, update: { $inc: plx } } });

        return DB.users.bulkWrite(toWrite).then(() => {
            const payloads = this.gemsTotal
                .map(gem => generatePayload(this._userID, PLX.user.id, -gem[1], "crafting", gem[0], "PAYMENT", "-"));
            console.table(payloads);
            return DB.audits.collection.insertMany(payloads)
                .then(() => payloads);
        });
    }

    _init() {
        if (this._item.materials) {
            const countList = this._sumMaterials(this._item.materials, this._count);
            for (const item of Object.keys(countList)) {
                const have = this._getFromInventory(item)?.count || 0;
                const need = countList[item];
                if (have) this._itemsInventory[item] = have > need ? need : have;
                if (have < need) this._itemsMissing[item] = need - have;
            }
        }
        const gems = this._item.gemcraft;
        for (const gem of Object.keys(gems))
            if (gems[gem] && typeof gems[gem] === "number") this._gemsTotal[gem] = gems[gem];
        this.emit("ready");
    }

    _clear() {
        this._gemsTotal = {};
        this._itemsTotal = {};
        this._itemsCrafting = {};
        this._itemsInventory = {};
        this._itemsMissing = {};
    }

    /**
     * Sets this Crafter's values to the necessary value for autocrafting.
     *
     * @param {boolean} onlyDependencies if true the item itself will be ignored in the cost.
     * @memberof Crafter
     */
    autoGen(onlyDependencies) {
        this._report = this._autoGenHelper(this._item, this._count, onlyDependencies);
        this._setPenalties();
    }

    /**
     * Private helper function for autoGen
     *
     * @param {*} item the item to be auto crafted
     * @param {number} [count=1] the amount of the item to be auto crafted
     * @param {boolean} [ignore=false] if true, only dependency costs will be added.
     * @return {{craft: boolean?, id: string, count: number, gems: {}, items: object[]}} gems in format of { XXX: number }.
     * @memberof Crafter
     */
    _autoGenHelper(item, count = 1, ignore = false) {
        if (!item) throw new Error(`autoGen did not receive an item: ${item}`);
        if (!item.crafted) throw new Error(`Item ${item} not craftable`);

        // Some initialization
        let toRet = { craft: !ignore, id: item.id, count: count, gems: {}, items: [] };

        // add gem cost
        if (!ignore) {
            for (const gem of Object.keys(item.gemcraft)) {
                if (item.gemcraft[gem]) toRet.gems[gem] = (toRet.gems[gem] || 0) + (item.gemcraft[gem] * count);
                if (toRet.gems[gem]) this._gemsTotal[gem] = (this._gemsTotal[gem] || 0) + toRet.gems[gem];
            }
        }

        if (item.materials?.length) {
            // First merge all duplicate material entries
            // Materials can be strings or an object with/without count.
            const countList = this._sumMaterials(item.materials, count);

            // Loop through all materials
            for (let materialID of Object.keys(countList)) {
                const material = allItems.get(materialID);
                if (!material) throw new Error(`materialID [${materialID}] of item [${item.id}] did not match any itemID`);
                if (!material) continue;

                // Check inventory if we have any or even enough left.
                const need = countList[materialID];
                const inInventory = this._getFromInventory(materialID)?.count || 0;
                const amountLeft = (inInventory - (this._itemsInventory[materialID] || 0)) || 0;
                const haveEnough = amountLeft >= countList[materialID];

                // The item can't be crafted, or we have some left.
                if (!material.crafted || amountLeft) {
                    toRet.items.push({ id: materialID, count: material.crafted ? amountLeft : need });
                    if (amountLeft) this._itemsInventory[materialID] = (this._itemsInventory[materialID] || 0) + amountLeft;
                    if (!material.crafted) this._itemsMissing[materialID] = (this._itemsMissing[materialID] || 0) + (need - amountLeft);
                }

                // Not enough items and it's craftable... generate auto report for the material and add it.
                if (material.crafted && !haveEnough) {
                    const toCraft = need - amountLeft;
                    this._itemsCrafting[materialID] = (this._itemsCrafting[materialID] || 0) + count;
                    const materialReport = this._autoGenHelper(material, toCraft);
                    toRet.items.push({ ...materialReport, count: toCraft });
                }
            }
        }
        return toRet;
    }

    _setPenalties() {
        const penalties = Object.keys(autoPenalties);
        const gemsTotal = this.gemsTotal;
        for (let gem of penalties) {
            switch (gem) {
                case "xp": break;
                case "gems": 
                    for (const gemArr of gemsTotal) {
                        if (penalties.includes(gemArr[0])) continue;
                        let penaltyAmount;
                        if (autoPenalties["gems"] >= 1) penaltyAmount = autoPenalties["gems"];
                        else if(autoPenalties["gems"] >= 0) penaltyAmount = Math.floor(gemArr[1] * autoPenalties["gems"]);
                        if (penaltyAmount > 0) this._penalty_gems[gemArr[0]] = penaltyAmount;
                    }
                    break;
                default:
                    let penaltyAmount;
                    if (autoPenalties[gem] >= 1) penaltyAmount = autoPenalties[gem];
                    else if (autoPenalties[gem] >= 0) penaltyAmount = Math.floor(gemsTotal.find(a => a[0] === gem)?.[1] * autoPenalties[gem]);
                    if (penaltyAmount > 0) this._penalty_gems[gem] = penaltyAmount; 
                    break;
            }
        }
        console.log("PENALTIES:")
        console.log(inspect(this._penalty_gems));
    }

    /**
     * Private method don't touch.
     *
     * @param {object[]} materialList array of material strings or objects with(out) count
     * @param {number} count the base amt needed
     * @return {object} Object as { material: number } 
     * @memberof Crafter
     */
    _sumMaterials(materialList, count) {
        const countList = {};
        for (let material of materialList) {
            let n = (material.count * count) || count;
            let materialID = material.id || material;
            if (countList[materialID]) countList[materialID] += n;
            else countList[materialID] = n;
        }
        return countList;
    }

    /**
     * Finds and returns an item by name or undefined.
     *
     * @static
     * @param {string} name The name (id) of item to find.
     * @return {object|null} Returns the item object or undefined.
     * @memberof Crafter
     */
    static getItem(name) {
        return (allItems.get(name) || allItems.get(allItemsName.get(name)) || null);
    }

    /**
     * Returns an array of item(s)  matches to the string.
     * Max 5 elemnts, filtered with a diff < 5.
     *
     * @param {string} search A string to search against.
     * @returns {object[]} Sorted array of items that (partially) matched search.
     * @memberof Crafter
     */
    static searchItems(search) {
        if (!search) throw new Error("Need a string to search for");
        const entries = allItems.entries();
        const items = [];

        // calc diff and add if <5
        for (const entry of entries) {
            let itm = entry[1];
            if (!itm.name) throw new Error(`Item without name... ID: ${itm.id}`)
            itm.diff = diff(search, itm.name.toLowerCase());
            itm.diffs = {};
            itm.diffs.E = itm.diff.filter((x) => x[0] === 0).length;
            itm.diffs.I = itm.diff.filter((x) => x[0] === 1).length;
            itm.diffs.D = itm.diff.filter((x) => x[0] === -1).length;
            itm.diffScore = itm.diff.filter((x) => x[1].length > search.length / 2 && x[0] !== 0).length
              + itm.diff.filter((x) => x[1].length > search.length / 2 && x[0] === -1).length * 4
              + itm.diff.filter((x) => x[1].length > search.length / 2 && x[0] === 1).length * 0.8
              + itm.diff.length * 1.35
              + itm.diffs.D * 1.6
              + itm.diffs.I * 1.2
              - itm.diffs.E * 3
              - itm.diff.filter((x) => x[1].length > search.length / 2 && x[0] === 0).length * 2.6;
            
            if (itm.diffScore < 5) items.push(itm);
        }
        // sort and return
        items.sort((a, b) => a.diffScore - b.diffScore);
        return items;
    }
}
const yep = _emoji("yep"),
    nope = _emoji("nope");
class Visualizer {
    crafter;
    report;
    P;
    depth = 2;
    


    constructor(crafter, P, opt) {
        if (!crafter || !P) throw new Error("Gotten too few arguments");
        if (!(crafter instanceof Crafter)) throw new Error("crafter not instance of Crafter");
        this.crafter = crafter;
        this.report = crafter._report;
        this.P = P;
        Object.assign(this, opt);
    }

    visualize() {
        let toret = "";
        if (this.crafter.isMissingGems || this.crafter.isMissingItems) toret = this._genFail();
        else toret = this._genSuccess();
        return toret + "\n\n" + this._genRecursive(this.report, JSON.parse(JSON.stringify(this.crafter._itemsInventory)));
    }

    _genFail() {
        let toret = "";
      
        const gemsMissing = this.crafter.gemsMissing;
        const itemsMissing = this.crafter.itemsMissing;

        for (const gemArr of gemsMissing)
          toret += `\n${nope} | ${_emoji(gemArr[0])}**${miliarize(gemArr[1], true)}** ${$t(`keywords.${gemArr[0]}_plural`, this.P)}${gemArr[2] ? ` (+${miliarize(gemArr[2])})` : ""}`;
        for (const itemArr of itemsMissing) {
          const item = Crafter.getItem(itemArr[0]);
          toret += `\n${nope} | ${item.emoji || '📦'} ${item.name} ${miliarize(itemArr[1])}${itemArr[1]>=10000?"":"x"}`;
        }
      
        return toret;
    }


    _genSuccess() {
        let toret = "Total cost:";

        const gemsTotal = this.crafter.gemsTotal;
        const itemsInventory = this.crafter.itemsInventory;

        for (const gemArr of gemsTotal)
            toret += `\n${yep} | ${_emoji(gemArr[0])}**${miliarize(gemArr[1], true)}** ${$t(`keywords.${gemArr[0]}_plural`, this.P)}${gemArr[3] ? ` (+${miliarize(gemArr[3])})` : ""}`;
        for (const itemArr of itemsInventory) {
            const item = Crafter.getItem(itemArr[0]);
            toret += `\n${yep} | ${item.emoji || '📦'} ${item.name} ${miliarize(itemArr[1])}${itemArr[1]>=10000?"":"x"}`;
        }

        return toret;
    }

    _genRecursive(item, inventory, depth = 0) {
        let str = "";
        let depthstr = "";
        let it = "---"
        for (let i = 0; i < depth; i++) depthstr += it;
      
        const items = item.items;
        const emote = item.craft ? "🛠️" : 
            (inventory[item.id] >= item.count && ((inventory[item.id] -= item.count) || true)) ? _emoji("yep") :
            _emoji("nope");


        str += `${depthstr} ${emote} **${item.id}** ${miliarize(item.count) || 1}${item.count>=10000?"":"x"}`
        if (item.craft) str += Object.keys(item.gems).map((gem, i) => `${i === 0 ? " ::":""}${_emoji(gem).trim()}${miliarize(item.gems[gem])}`).join(" ");
        str += "\n";
      
        if (item.craft && items?.length) {
          if (depth == this.depth) str += `${depthstr}${it} and more...\n`;
          else for (const itm of items) str += this._genRecursive(itm, inventory, depth+1);
        }
      
        return str;
    }
}

module.exports = {
    Crafter,
    Visualizer,
    allItems,
    craftedItems,
};