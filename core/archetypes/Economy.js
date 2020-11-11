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
 * @param {string} uID user ID
 * @param {number} amt if pos/zero: receive, if neg: pay
 * @param {string} type description of payment
 * @param {string} curr the current in 3 letter descriptor
 * @param {string} transaction weird symbol
 * @param {object} [userTo] userTo for tranfer etc
 * @return {object} the payload generated 
 */
function generatePayload(uID, amt, type, curr, subtype, transaction, userTo) {
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
 * @param {object|string} user
 * @param {number} amt
 * @param {string} [type="OTHER"]
 * @param {string} [currency="RBN"]
 * @return {object} the payload or null if no amt 
 */
function pay(user, amt, type = "OTHER", currency = "RBN") {
  if (!amt || typeof amt !== "number") return null;
  const uID = user.id || user;
  amt = parseInt(amt);

  return checkFunds(user, amt, currency).then(async () => {
    const payload = generatePayload(user, -amt, type, currency, "PAYMENT", "-");
    await Promise.all([
      DB.users.set(uID, { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
      DB.users.set("271394014358405121", { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
      DB.audits.new(payload),
    ]);
    return payload;
  }).catch(() => new Error("No Funds"));
}

function receive(user, amt, type = "OTHER", currency = "RBN") {
  if (amt === 0) return null;
  const uID = user.id || user;
  if (typeof amt !== "number") {
    console.error(" Economy ERROR >> ".bgRed + `AMOUNT OF ${currency} (${amt}) IS NOT A NUMBER (${typeof amt})`);
    return Promise.reject("Amount informed is not a Number");
  }
  amt = parseInt(amt);

  const payload = generatePayload(user, amt, type, currency, "INCOME", "+");
  return Promise.all([
    DB.users.set("271394014358405121", { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
    DB.users.set(uID, { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
    DB.audits.new(payload),
  ]).then(() => payload);
}

function transfer(userFrom, userTo, amt, type = "SEND", currency = "RBN") {
  if (amt === 0) return null;
  const fromID = userFrom.id || userFrom;
  const toID = userTo.id || userTo;
  if (typeof amt !== "number") throw new Error("Amount informed is not a Number");
  amt = Math.abs(parseInt(amt));

  return checkFunds(userFrom, amt, currency).then(async () => {
    const payload = generatePayload(userFrom, amt, type, currency, "TRANSFER", ">", userTo);
    return Promise.all([
      DB.users.set(fromID, { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
      DB.users.set(toID, { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
      DB.audits.new(payload),
    ]).then(() => payload);
  }).catch(() => new Error("No Funds"));
}

async function arbitraryAudit(from, to, type, tag = "OTH", trans, amt = 1) {
  const now = Date.now();
  const payload = generatePayload(from, amt, type, tag, "ARBITRARY", trans || "!!", to);
  await DB.audits.new(payload);
  return payload;
}

module.exports = {
  checkFunds,
  pay,
  receive,
  transfer,
  arbitraryAudit,
  CURRENCIES,
};
