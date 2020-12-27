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

    if (!data.maxUses || data.maxUses === 1) { // single-redeem
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

    if (!data.maxUses || data.maxUses === 1) { // single-redeem
      await DB.promocodes.collection.updateOne({ code }, {
        $set: {
          locked: false,
          used: true,
          usedBy: this.user
        }
      });
    }

    if (data?.maxUses > 1) { // multi-redeem
      await DB.promocodes.collection.updateOne({ code }, {
        $inc: { uses: 1 },
        $push: { usedBy: this.user }
      });

      data = await DB.promocodes.findOne({ code })
        .lean();

      if (data.maxUses === data.uses) { // limit reached
        await DB.promocodes.collection.updateOne({ code }, {
          $set: { used: true }
        });
      }
    }

    const userData = await DB.users.getFull(this.user);
    const sPrize = prize.split(" ");
    return userData.addItem(`${sPrize[1]}_${sPrize[2]}_O`, Number(sPrize[0]));
  }

};
