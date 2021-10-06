const ECO = require('./Economy.js');
module.exports = class Redeem {
  constructor(code, userID) {
    this.user = userID;
    this.code = code;
    this.prize = null;
    this.hydrated = false;
  }

  async hydrate() {
    this.data = await DB.promocodes.findOne({ code: this.code }).lean();
    this.hydrated = true;
  }

  async lock(){
    return DB.promocodes.updateOne({ code: this.code}, {locked: true});
  }
  async unlock(){
    return DB.promocodes.updateOne({ code: this.code}, {locked: false});
  }
  async consume(){
    let query = {};

    if (!this.data.maxUses || this.data.maxUses === 1) { 
      query = {
        $set: {
          locked: false,
          consumed : true,
          usedBy : this.user,
          redeemedAt: Date.now()
        }
      }      
    }else{
      query = {
        $set: {     
          locked: false,   
          redeemedAt: Date.now()
        },
        $addToSet: {usedBy: this.user},
        $inc: { uses:1 }
      }
    }

    console.log({query,code:this.code})
    let res = await DB.promocodes.updateOne({ code: this.code }, query);
    console.log({res});
    return res;
  }

  verify() {
    if (!this.hydrated) throw new Error("Promocode must be hydrated before use.");

    const data = this.data;
    if (!data) return "invalid";
    if (data.expirationDate && data.expirationDate < Date.now()) return "expired";
    if (data.maxUses <= data.uses) return "exhausted";
    if (data.usedBy === this.user || data.usedBy?.includes(this.user)) return "already_redeemed";
    if (data.consumed) return "nonredeemable";
    if (data.locked) return "locked";
    this.prize = data.prize;
    return false;
  }

  parsePrize() {

    this.lock();
    const [_amount, _subject, _filter, _extra] = this.data.prize.split(' ');
    let filter = _filter;
    let subject = _subject;
    let amount = Number(_amount);
    let type = null;
    let keyword = null;
    let inventory = null;
    
    if (!amount) {
      amount = 1;
      subject = _amount;
      filter = _subject;
    }

    const rarity = ['C','U','R','SR','UR','XR'].includes(filter) ? filter : undefined;

    switch (subject){
      case "rubines":
      case "RBN":
        subject = "RBN";
        type = "currency";
        break;
      case "sapphires":
      case "SPH":
        subject = "SPH";
        type = "currency";
        break;
      case "jades":
      case "JDE":
        subject = "JDE";
        type = "currency";
        break;
      case "lootbox":
      case "LBX":
        subject = `lootbox_${rarity}_${_extra||"O"}`; // type filter
        keyword = `$t(keywords.lootbox) $t(keywords.${rarity})`;
        type = "item";
        break;
      case "boosterpack":
      case "booster":
        subject = "boosterpack"; // type filter
        type = "booster";
        break;
      case "sticker":
        type = "sticker";
        inventory = "stickerInventory";
        break;
      case "background":
        type = "background";
        inventory = "bgInventory";
        break;
      case "medal":
        type = "medal";
        inventory = "medalInventory";
        break;
      case "token":
      case "TKN":
      case "EVT":
        type = "currency";
        subject = "EVT";
        keyword = "keywords.evToken"
        break;
    }

    if (!keyword) keyword = keyword = `keywords.${subject}`;

    
    let mergeQuery = {rarity};
    if (!rarity && !!filter) {
      if (filter === 'event') mergeQuery.event = {$exists: true};
      if (filter.includes('event:')) mergeQuery.event = filter.split(':')[1];
      if (filter.includes('filter:')) mergeQuery.filter = filter.split(':')[1];
    }

    const prizeParams = {
      type,
      amount,
      inventory,
      subject,            
      mergeQuery,
      keyword,
    }
    this.prize = prizeParams;
    return prizeParams;
  }



  async redeem() {
    const code = this.code;
    let data = this.data;

    await this.consume();

    if (data?.maxUses > 1) { // multi-redeem (only if maxUses is present and >1: increment uses, add redeemedUser to array
      let redata = await DB.promocodes.findOne({ code }).lean();
      if (redata.maxUses <= data.uses) { // limit reached: set used
        await DB.promocodes.updateOne({ code }, {
          $set: { consumed: true, locked: true }
        });
      }
    }

    // no needed "else", this is executed both in single and multi redeem
    const userData = await DB.users.getFull(this.user);
    if (!userData) return "User Not Found";

    const sPrize = this.prize;

    if (sPrize.type === 'item') await userData.addItem(sPrize.subject,sPrize.amount);
    if (sPrize.type === 'currency') await ECO.receive( this.user, sPrize.amount,"PROMO CODE", sPrize.subject );
    if (sPrize.inventory){
      const prizeItem = DB.cosmetics.get( Object.assign({
        public: true, 
        droppable: true,
        type: sPrize.type,
        rarity: sPrize.rarity
      },sPrize.mergeQuery));
      await DB.users.set(this.user, {$addToSet: {[`modules.${sPrize.inventory}`]: prizeItem.code||prizeItem.icon||prizeItem.id } } );
      return prizeItem;
    }
    return null;
  }

  async audit() {
    const c = this.prize.split(" ")[1].toUpperCase();
    const currency = c === "LOOTBOX" ? "LBX" : "?"; //TODO add more types

    return DB.audits.new({
      from: PLX.user.id,
      to: this.user,
      type: "Code Redeemed",
      currency: currency,
      transaction: "+",
      amt: Number(this.prize.split(" ")[0]),
      timestamp: Date.now(),
      transactionId: Date.now()
        .toString(36)
        .toUpperCase(),
      details: {
        code: this.code
      }
    });
  }

};
