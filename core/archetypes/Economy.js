//@ts-check
// const DB = require('../database/db_ops');

const CURRENCIES = {
  RBN: "rubines",
  JDE: "jades",
  SPH: "sapphires",
  LCL: false,
  AMY: "amethysts",
  EMD: "emeralds",
  TPZ: "topazes",
  PSM: "prisms"
};

/**
 * Checks whether the user's funds are equal to or exceed amt.
 *
 * @param {string|{id: string}} user user(ID)
 * @param {number} amt The amount necessary.
 * @param {string} [currency="RBN"] Currency to check against :: default "RBN".
 * @return {Promise<boolean>|boolean} 
 */
function checkFunds(user, amt, currency = "RBN") {
  const uID = user.id || user;

  amt = parseInt(amt);
  if (typeof amt !== "number") return false;

  return DB.users.get(uID, { [`modules.${CURRENCIES[currency]}`]: 1 }).then((userData) => {
    console.log(userData.modules[CURRENCIES[currency]]);
    if (userData.modules[CURRENCIES[currency]] < amt) return false;
    return true;
  });
}

/**
 * Generates a PayLoad
 * Depending on amt's value (pos, neg) directs the type of payment (receive, pay, respectively)
 *
 * @param {string|{id: string}} uID user(ID) (from)
 * @param {number} amt If pos/zero: receive, if neg: pay | or an array of currencies with their amt
 * @param {string} type Description of the payment.
 * @param {string} curr The currency in 3 letter descriptor.
 * @param {string} transaction Transaction symbol.
 * @param {string|{id: string}} [userTo=271394014358405121] userTo(ID) for tranfer etc :: default "271394014358405121" (pollux).
 * @return {object} The payload generated .
 */
function generatePayload(uID, amt, type, curr, subtype, transaction, userTo) {
  uID = uID["id"] || uID;
  if (userTo) userTo = userTo["id"] || userTo;
  const now = Date.now();
  const payload = {
    subtype: subtype,
    type: type,
    currency: curr,
    transaction: transaction,
    from: amt < 0 ? uID : "271394014358405121",
    to: userTo ? userTo : amt < 0 ? "271394014358405121" : uID,
    timestamp: now,
    transactionId: `${curr}${now.toString(32).toUpperCase()}`,
    amt: amt < 0 ? -amt : amt,
  };
  return payload;
}

/**
 * Method for a user to pay x gems.
 *
 * @param {{id: string}|string} user user(ID)
 * @param {number|Array.<{ amt: number, currency: string }>} amt The amount to pay, or an array of currencies with their amt.
 * @param {string} [type="OTHER"] The transaction type :: default OTHER
 * @param {string} [currency="RBN"] The currency in 3 letter format :: default RBN
 * @return {object|object[]|null} The payload(s) or null if no amt.
 */
function pay(user, amt, type = "OTHER", currency = "RBN") {
  let uID = user["id"] || user;
  if (!amt || !uID) return null;

  if (typeof amt !== "number" && amt.length) {    
    return Promise.all([
      ...amt.map(obj => {
        return checkFunds(user, obj.amt, obj.currency).then(() => {
          const amount = parseInt(obj.amt.toString());
          if (amount === 0 || !obj.currency) return;
          const toret = [];
          toret.push(generatePayload(uID, -obj.amt, type, obj.currency, amt < 0 ? "INCOME" : "PAYMENT", amt < 0 ? "+" : "-"));
          toret.push({ [`modules.${obj.currency}`]: -amount });
          toret.push({ [`modules.${obj.currency}`]: amount });
          return toret;
        }).catch(() => new Error("No Funds"));
      }),
    ]).then(info => {
        const userInc = {};
        const plxInc = {};
        const payloads = [];
        let fromID = "271394014358405121";
        info.forEach(infoarr => {
          if (!infoarr || !infoarr.length) return;
          payloads.push(infoarr[0]);
          Object.keys(infoarr[1]).map(key => {
            userInc[key] = infoarr[1][key];
            if (infoarr[1][key] > 0) { fromID = uID; uID = "271394014358405121" }
          });
          Object.keys(infoarr[2]).map(key => plxInc[key] = infoarr[2][key]);
        });
        return DB.users.bulkWrite([
          { updateOne: { filter: { id: uID }, update: { $inc: userInc } } },
          { updateOne: { filter: { id: fromID }, update: { $inc: plxInc } } },
        ]).then(() => DB.audits.collection.insertMany(payloads).then(() => payloads));
    });    
  } else if (typeof amt === "number") {
    // @ts-ignore
    amt = parseInt(amt);
    if (amt === 0) return null;

    let fromID;
    if (amt < 0) {
      let fromID = uID;
      uID = "271394014358405121";
    } else fromID = "271394014358405121";
    
    return checkFunds(user, amt, currency).then(() => {
      // @ts-ignore
      const payload = generatePayload(uID, -amt, type, currency, amt < 0 ? "INCOME" : "PAYMENT", amt < 0 ? "+" : "-");
      return DB.users.bulkWrite([
        { updateOne: { filter: { id: uID }, update: { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } } } },
        { updateOne: { filter: { id: fromID }, update: { $inc: { [`modules.${CURRENCIES[currency]}`]: amt } } } },
      ]).then(() => DB.audits.new(payload).then(() => payload));
    }).catch(() => new Error("No Funds"));
  } else return null;
}

/**
 * Method for a user to pay x gems.
 *
 * @param {{id: string}|string} user user object or ID
 * @param {number|Array.<{ amt: number, currency: string }>} amt amt user will receive
 * @param {string} [type="OTHER"] transaction type :: default OTHER
 * @param {string} [currency="RBN"] currency in 3 letter format :: default RBN
 * @return {object|object[]|null} the payload or null if no amt 
 */
function receive(user, amt, type = "OTHER", currency = "RBN") {
  if (!user || !amt) return null; // @ts-ignore
  if (typeof amt === typeof Array && amt.length) {
    for (let i in amt) amt[i].amt = -amt[i].amt;
  } else amt = -amt;
  return pay(user, amt, type, currency);
}

/**
 * A money transfer between users.
 * 
 * @param {number|{id: string}} userFrom user(ID) from
 * @param {number|{id: string}} userTo user(ID) to
 * @param {number} amt The amount to transfer.
 * @param {string} [type="SEND"] The type of transaction :: default "SEND"
 * @param {string} [currency="RBN"] The currency to transfer :: default "RBN"
 * @return {object|null} The payload or null if !amt/!user(s).
 */
function transfer(userFrom, userTo, amt, type = "SEND", currency = "RBN") {
  if (!amt || !userFrom || !userTo) return null; // @ts-ignore
  const fromID = userFrom.id || userFrom; // @ts-ignore
  const toID = userTo.id || userTo; 
  if (typeof amt !== "number") throw new Error("Amount informed is not a Number"); // @ts-ignore
  amt = Math.abs(parseInt(amt));

  return checkFunds(userFrom, amt, currency).then(async () => {
    const payload = generatePayload(fromID, amt, type, currency, "TRANSFER", ">", toID);
    return DB.users.bulkWrite([
      { updateOne: { filter: { id: fromID }, update: { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } } } },
      { updateOne: { filter: { id: toID }, update: { $inc: { [`modules.${CURRENCIES[currency]}`]: amt } } } },
    ]).then(() => DB.audits.new(payload).then(() => payload));
  }).catch(() => new Error("No Funds"));
}

/**
 * Creates a new audit. 
 * NOTE: this will immediately end up in DB.
 *
 * @param {string|{id: string}} from user(ID) from
 * @param {string|{id: string}} to user(ID) to
 * @param {string} type The type of audit.
 * @param {string} [tag="OTH"] The tag (usually currency) :: default "OTH"
 * @param {string} [trans="!!"] The transaction symbol :: default "!!"
 * @param {number} [amt=1] The amount :: default 1
 * @return {Promise<object>|null} The payload or null if missing args.
 */
async function arbitraryAudit(from, to, type, tag = "OTH", trans = "!!", amt = 1) {
  if (!from || !to || !type) return null;
  const payload = generatePayload(from, amt, type, tag, "ARBITRARY", trans, to);
  await DB.audits.new(payload);
  return payload;
}

module.exports = {
  checkFunds,
  pay,
  receive,
  transfer,
  arbitraryAudit,
  generatePayload,
  CURRENCIES,
};
