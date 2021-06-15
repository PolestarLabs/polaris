const yesNo = require("../structures/YesNo");

module.exports = class Redeem {
  constructor(code, userID) {
    this.user = userID;
    this.code = code;
    this.prize = null;
  }

  async verify() {
    const code = this.code;
    const data = await DB.promocodes.findOne({ code })
      .lean();
    if (!data) return "invalid";
    if (data.locked) return "locked";
    if (data.usedBy === this.user || data.usedBy?.includes(this.user)) return "already_exists";
    if (data.used) return "nonredeemable";
    this.prize = data.prize;
    return false;
  }

  async prompt(message, command) {
    const code = this.code;
    const data = await DB.promocodes.findOne({ code })
      .lean();

    if (!data.maxUses || data.maxUses === 1) { // single-redeem: lock code, otherwise just prompt
      await DB.promocodes.collection.updateOne({ code }, {
        $set: { locked: true }
      });
    }
    return yesNo(message, command);
  }

  async redeem(userID, prize) {
    const code = this.code;
    let data = await DB.promocodes.findOne({ code })
      .lean();

    if (!data.maxUses || data.maxUses === 1) { // single-redeem (only if maxUses is missing or == 1): unlock code, set used and usedBy
      await DB.promocodes.collection.updateOne({ code }, {
        $set: {
          locked: false,
          used: true,
          usedBy: this.user
        }
      });
    }

    if (data?.maxUses > 1) { // multi-redeem (only if maxUses is present and >1: increment uses, add redeemedUser to array
      await DB.promocodes.collection.updateOne({ code }, {
        $inc: { uses: 1 },
        $push: { usedBy: this.user }
      });

      data = await DB.promocodes.findOne({ code })
        .lean();

      if (data.maxUses === data.uses) { // limit reached: set used
        await DB.promocodes.collection.updateOne({ code }, {
          $set: { used: true }
        });
      }
    }

    // no needed "else", this is executed both in single and multi redeem
    const userData = await DB.users.getFull(this.user);
    if (!userData) return "User Not Found";

    const sPrize = prize.split(" ");
    await userData.addItem(`${sPrize[1]}_${sPrize[2]}_O`, Number(sPrize[0]));
    return this.audit()
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
