// const DB = require('../database/db_ops');

const CURRENCIES = {
  RBN: "rubines",
  JDE: "jades",
  SPH: "sapphires",
  LCL: false,
  AMY: "amethysts",
  EMD: "emeralds",
  TPZ: "topazes",
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

function pay(user, amt, type = "OTHER", currency = "RBN") {
  if (amt === 0) return null;
  const uID = user.id || user;
  if (typeof amt !== "number") return "Amount informed is not a Number";
  amt = parseInt(amt);

  return checkFunds(user, amt, currency).then(async () => {
    const now = Date.now();
    const payload = {
      subtype: "PAYMENT",
      type,
      currency,
      transaction: "-",
      from: uID,
      to: "271394014358405121",
      timestamp: now,
      transactionId: `${currency}${now.toString(32).toUpperCase()}`,
      amt,
    };
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
  if (typeof amt !== "number") reject("Amount informed is not a Number");
  amt = parseInt(amt);

  const now = Date.now();
  const payload = {
    subtype: "INCOME",
    type,
    currency,
    transaction: "+",
    from: "271394014358405121",
    to: uID,
    timestamp: now,
    transactionId: `${currency}${now.toString(32).toUpperCase()}`,
    amt,
  };
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
    const now = Date.now();
    const payload = {
      subtype: "TRANSFER",
      type,
      currency,
      transaction: ">",
      from: fromID,
      to: toID,
      timestamp: now,
      transactionId: `${currency}${now.toString(32).toUpperCase()}`,
      amt,
    };
    return Promise.all([
      DB.users.set(fromID, { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
      DB.users.set(toID, { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
      DB.audits.new(payload),
    ]).then(() => payload);
  }).catch(() => new Error("No Funds"));
}

async function arbitraryAudit(from, to, type, tag = "OTH", trans, amt = 1) {
  const now = Date.now();
  const payload = {
    subtype: "ARBITRARY",
    type,
    currency: tag,
    transaction: trans || "!!",
    from: from.id || from,
    to: to.id || to,
    timestamp: now,
    transactionId: `${tag}${now.toString(32).toUpperCase()}`,
    amt,
  };
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
