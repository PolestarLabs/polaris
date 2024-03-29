const { Crafter } = require("./Crafter");

const yep = _emoji("yep");
const nope = _emoji("nope");

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
    return `${toret}\n\n${this._genRecursive(
      this.report,
      JSON.parse(JSON.stringify(this.crafter._itemsInventory)), /* 0, this.report?.items?.length */
    )}`;
  }

  _genFail() {
    let toret = "";

    const { gemsMissing } = this.crafter;
    const { itemsMissing } = this.crafter;

    for (const gemArr of gemsMissing) {
      toret += `\n${nope} | ${_emoji(gemArr[0])}**${miliarize(gemArr[1], true)}** `
        + `${$t(`keywords.${gemArr[0]}_plural`, this.P)}${gemArr[2] ? ` (+${miliarize(gemArr[2])})` : ""}`;
    }
    for (const itemArr of itemsMissing) {
      const item = Crafter.getItem(itemArr[0]);
      toret += `\n${nope} | ${item.emoji || "📦"} ${item.name} ${miliarize(itemArr[1])}${itemArr[1] >= 10000 ? "" : "x"}`;
    }

    return toret;
  }

  _genSuccess() {
    let toret = "Total cost:";

    const { gemsTotal } = this.crafter;
    const { itemsInventory } = this.crafter;

    for (const gemArr of gemsTotal) {
      toret += `\n${yep} | ${_emoji(gemArr[0])}**${miliarize(gemArr[1], true)}** `
        + `${$t(`keywords.${gemArr[0]}_plural`, this.P)}${gemArr[3] ? ` (+${miliarize(gemArr[3])})` : ""}`;
    }
    for (const itemArr of itemsInventory) {
      const item = Crafter.getItem(itemArr[0]);
      toret += `\n${yep} | ${item.emoji || "📦"} ${item.name} ${miliarize(itemArr[1])}${itemArr[1] >= 10000 ? "" : "x"}`;
    }

    return toret;
  }

  _genRecursive(item, inventory, depth = 0, length = 1, index = 1, parentIndex = 1, maxDepth = 1) {
    const thisMaxDepth = item.items?.length || 0;
    let str = "";
    const BLANK   = "\u2003\u2002";
    const PIPE    =  "║\u2003";
    const FORK    =  "╠═";
    const DEND    =  "╚═";
    const GS = "🟩";
    const OS = "🟧";
    const BS = "🟫";
    let depthstr = !depth ?  "":BLANK;
    
    console.log({item,depth,length,index,parentIndex})

    for (let i = 0; i < depth; i++) {
      depthstr += ((parentIndex < maxDepth && (maxDepth - (i + 1) === depth || parentIndex + i === maxDepth || depth === i + 1))
        ? PIPE
        : "\u200b"
      )// + it;
    }

    const isLastOfTree = length === index;

    if (isLastOfTree) depthstr += DEND;
    else depthstr += FORK;
    
    const { items } = item;
    const emote = item.craft
      ? "🛠️"
      : item.id === this.crafter._item.id
        ? "<a:polluxloading:845940929625063466>"
        : (inventory[item.id] >= item.count)
          ? ((inventory[item.id] -= item.count) || true) && _emoji("yep")
          : _emoji("nope");

    str += `${depthstr}${emote} **${item.name}** × \`${miliarize(item.count) || 1}\``;
    if (item.craft) {
      str += `\n${
        depthstr.replace(DEND,BLANK).replace(FORK,PIPE)
      }${ thisMaxDepth ? PIPE : BLANK }`+Object.keys(item.gems).map(
        (gem, i) => `${i === 0 
          ? "• " 
          : ""
        }${_emoji(gem).trim()}\`${miliarize(item.gems[gem])}\``,

      ).join(" ");
    }
    str += "\n";

    if ((item.craft || item.id === this.crafter._item.id) && items?.length) {
      if (depth === this.depth) str += `${depthstr}${BLANK} and more...\n`;
      else items.forEach((itm, i, arr) => (str += this._genRecursive(itm, inventory, depth + 1, arr.length, i + 1, index, length)));
    }

    return str;
  }
}

module.exports = Visualizer;
