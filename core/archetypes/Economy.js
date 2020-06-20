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

  return new Promise(async (resolve, reject) => {
    const userData = await DB.users.get(uID, { [`modules.${CURRENCIES[currency]}`]: 1 });
    console.log(userData.modules[CURRENCIES[currency]]);
    if (userData.modules[CURRENCIES[currency]] < amt) return resolve(false);
    resolve(true);
  });
}

function pay(user, amt, type = "OTHER", currency = "RBN") {
  if (amt == 0) return;
  const uID = user.id || user;
  return new Promise(async (resolve, reject) => {
    if (typeof amt !== "number") resolve("Amount informed is not a Number");
    amt = parseInt(amt);

    checkFunds(user, amt, currency).then(async (ok) => {
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
      resolve(payload);
    }).catch((err) => {
      reject("No Funds");
    });
  });
}

function receive(user, amt, type = "OTHER", currency = "RBN") {
  if (amt == 0) return;
  const uID = user.id || user;
  return new Promise(async (resolve, reject) => {
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
    await Promise.all([
      DB.users.set("271394014358405121", { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
      DB.users.set(uID, { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
      DB.audits.new(payload),
    ]);
    resolve(payload);
  });
}

function transfer(userFrom, userTo, amt, type = "SEND", currency = "RBN") {
  if (amt == 0) return;
  const fromID = userFrom.id || userFrom;
  const toID = userTo.id || userTo;
  return new Promise(async (resolve, reject) => {
    if (typeof amt !== "number") reject("Amount informed is not a Number");
    amt = Math.abs(parseInt(amt));

    checkFunds(userFrom, amt, currency).then(async (ok) => {
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
      await Promise.all([
        DB.users.set(fromID, { $inc: { [`modules.${CURRENCIES[currency]}`]: -amt } }),
        DB.users.set(toID, { $inc: { [`modules.${CURRENCIES[currency]}`]: +amt } }),
        DB.audits.new(payload),
      ]);
      resolve(payload);
    }).catch((err) => {
      reject("No Funds");
    });
  });
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
