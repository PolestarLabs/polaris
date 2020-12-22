//@ts-check
// const DB = require('../database/db_ops');

// const CURRENCIES = {
//   RBN: "rubines",
//   JDE: "jades",
//   SPH: "sapphires",
//   LCL: false,
//   AMY: "amethysts",
//   EMD: "emeralds",
//   TPZ: "topazes",
//   PSM: "prisms"
// };

// NOTE don't touch this thnx

const toCurrencies = {
  RUBINE: "RBN", JADE: "JDE", SAPPHIRE: "SPH",
  AMETHYST: "AMY", EMERALD: "EMD", TOPAZE: "TPZ", PRISM: "PSM",
}
const currencies = [
  "RBN", "JDE", "SPH",
  "AMY", "EMD", "TPZ", "PSM"
]

/**
 * Checks if currency or currencies are valid, otherwise throws error.
 *
 * @param {string|Array<string>} curr the currency or currency array to parse
 * @return {string|string[]} returns the correct formats ; string/array dependent on input
 * @throws {Error} Unknown currency
 */
function parseCurrencies(curr) {
  // Argument parsing
  const type = typeof curr;
  if (typeof curr === "string") curr = [curr.toUpperCase()];
  else curr = curr.map(c => c.toUpperCase());

  // convert currencies to XXX format. eg. rubines/rubine → RBN.
  if (curr) curr = curr.map(c => toCurrencies[c] ? toCurrencies[c] : toCurrencies[c.slice(0, c.length-1)] ? c.slice(0, c.length-1) : c);
  
  // NOTE: changing the way this returns has implications down the line.
  if (!curr || curr.some(curr => !currencies.includes(curr))) throw new Error(`Unknown ${!curr ? "object" : typeof curr === "string" ? "currency" : "currencies"}: ${curr}`);
  return (type === "string" ? curr[0] : curr);
}

/**
 * Checks whether the user's funds are equal to or exceed amt.
 *
 * @param {string|{id: string}} user user(ID)
 * @param {number|Array<number>} amount The amount necessary.
 * @param {string|Array<string>} [currency="RBN"] Currency to check against :: default "RBN".
 * @return {Promise<boolean>} True iff enough funds.
 * @throws {Error} Invalid arguments.
 */
function checkFunds(user, amount, currency = "RBN") {
  if (amount === 0) return Promise.resolve(true);
  if (!(user && amount)) throw new Error(`Missing arguments. User: ${user} amount: ${amount}`);

  let curr = parseCurrencies(currency);

  // Argument validation
  // NOTE: comparing currency first and then curr might result in error if parseCurrencies doesn't return a string/array as it should.
  if (typeof amount === "number" || typeof currency === "string") {
    if (!(typeof amount === "number" && typeof curr === "string")) throw new Error("amt & curr need to be a single number & string or equal length arrays.");
    amount = [amount];
    curr = [curr];
  } else if (amount.length !== currency.length) throw new Error("amt & curr arrays need to be equal length");

  const uID = user["id"] || user;
  if (uID === PLX.user.id) return Promise.resolve(true);

  return DB.users.get(uID).then((userData) => {
    if (!userData) return false;
    return curr.every((c, i) => {
      if (amount[i] === 0) return true;
      if (!userData.modules[c]) return false;
      return (userData.modules[c] >= amount[i]);
    });
  });
}

/**
 * Generates a PayLoad
 * Depending on amt's value (pos, neg) directs the type of payment (receive, pay, respectively)
 *
 * @param {string|{id: string}} userFrom user(ID) (from)
 * @param {string|{id: string}} userTo userTo(ID) for tranfer etc :: default "271394014358405121" (pollux).
 * @param {string} type Description of the payment.
 * @param {number} amt If pos/zero: receive, if neg: pay | or an array of currencies with their amt
 * @param {string} curr The currency in 3 letter descriptor.
 * @param {string} subtype Subtype of this transaction.
 * @param {string} symbol Transaction symbol.
 * @return {object} The payload generated.
 */
function generatePayload(userFrom,userTo, amt, type, curr, subtype, symbol) {
  if (!(userFrom && amt && type && curr && subtype && symbol && userTo)) throw new Error("Missing arguments");
  if (userFrom["id"]) userFrom = userFrom["id"];
  if (userTo["id"]) userTo = userTo["id"];
  const now = Date.now();
  const payload = {
    subtype: subtype,
    type: type,
    currency: curr,
    transaction: symbol,
    from: userFrom,
    to: userTo,
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
 * @param {number|Array<number>} amt amt user will receive
 * @param {string} [type="OTHER"] transaction type :: default OTHER
 * @param {string|Array<string>} [currency="RBN"] currency in any letter format :: default "RBN"
 * @return {Promise<Array<object>|object|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
function pay(user, amt, type = "OTHER", currency = "RBN",) {
  return transfer(user, PLX.user.id, amt, type, currency, "PAYMENT", "-");
}

/**
 * Method for a user to receive x gems.
 *
 * @param {{id: string}|string} user user object or ID
 * @param {number|Array<number>} amt amt user will receive
 * @param {string} [type="OTHER"] transaction type :: default OTHER
 * @param {string|Array<string>} [currency="RBN"] currency in any letter format :: default "RBN"
 * @return {Promise<Array<object>|object|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
function receive(user, amt, type = "OTHER", currency = "RBN") {
  return transfer(PLX.user.id, user, amt, type, currency, "INCOME", "+");
}

/**
 * A money transfer between users.
 * 
 * @param {string|{id: string}} userFrom user(ID) from
 * @param {string|{id: string}} userTo user(ID) to
 * @param {number|Array.<number>} amt The amounts to transfer, or an array of.
 * @param {string} [type="SEND"] The type of transaction :: default "SEND"
 * @param {string|Array.<string>} [curr="RBN"] The currenc(y)(ies) to transfer :: default "RBN"
 * @param {string} [subtype="TRANSFER"] The sub-type of the transaction :: default "TRANSFER"
 * @param {string} [symbol=">"] The transaction symbol :: default ">"
 * @return {Promise<Array<object>|object|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
function transfer(userFrom, userTo, amt, type = "SEND", curr = "RBN", subtype = "TRANSFER", symbol = ">") {
  if (!(userFrom && userTo)) throw new Error("Missing arguments");
  if (amt === 0) return Promise.resolve(null);
  if (!amt || (typeof amt !== "number" && !amt.length)) return Promise.resolve(null);

  // Argument parsing
  if (userFrom["id"]) userFrom = userFrom["id"];
  if (userTo["id"]) userTo = userTo["id"];

  // Checks
  curr = parseCurrencies(curr);
  return checkFunds(userFrom, amt, curr).then(hasFunds => {
    if (!hasFunds) return Promise.reject({reason: "NO FUNDS"}); //throw new Error("User doesn't have the funds necessary.");

    // Argument validation
    if (typeof amt === "number" || typeof curr === "string") {
      if (!(typeof amt === "number" && typeof curr === "string")) throw new Error("amt & curr need to be a single number & string or equal length arrays.");
      amt = [amt];
      curr = [curr];
    } else if (amt.length !== curr.length) throw new Error("amt & curr arrays need to be equal length");

    // Setup v1.0
    const fromUpdate = {};
    const toUpdate = {};
    const payloads = [];

    // Fill DB calls
    for (let i in curr) {
      let absAmount = Math.abs(amt[i]);
      if (!absAmount) continue; // stop if AMT = 0 or not present
      fromUpdate[`modules.${curr[i]}`] = -absAmount;
      toUpdate[`modules.${curr[i]}`] = absAmount;
      payloads.push(generatePayload(userFrom, userTo, amt[i], type, curr[i], subtype, symbol));
    }

    // If every amt was zero
    if (!payloads.length) return Promise.resolve(null);

    // Setup v2.0
    const toWrite = [
      { updateOne: { filter: { id: userFrom }, update: { $inc: fromUpdate } } },
      { updateOne: { filter: { id: userTo }, update: { $inc: toUpdate } } },
    ];

    // Finish with DB updates & inserts.
    return DB.users.bulkWrite(toWrite)
      .then(() => DB.audits.collection.insertMany(payloads))
      .then(() => {
        console.table(payloads); // log transactions
        return payloads.length === 1 ? payloads[0] : payloads;
      });
  });
}

/**
 * Creates a new audit. 
 * NOTE: this will immediately end up in DB.
 *
 * @param {string|{id: string}} from user(ID) from
 * @param {string|{id: string}} to user(ID) to
 * @param {number} [amt=1] The amount :: default 1
 * @param {string} type The type of audit :: default "ARBITRARY"
 * @param {string} [tag="OTH"] The tag (usually currency) :: default "OTH"
 * @param {string} [symbol="!!"] The transaction symbol :: default "!!"
 * @return {Promise<object>|null} The payload or null if missing args.
 */
async function arbitraryAudit(from, to, amt = 1, type = "ARBITRARY", tag = "OTH", symbol = "!!") {
  if (!from || !to) return null;
  const payload = generatePayload(from, to, amt, type, tag, type, symbol);
  await DB.audits.new(payload);
  return payload;
}

module.exports = {
  currencies,
  arbitraryAudit,
  checkFunds,
  generatePayload,
  parseCurrencies,
  pay,
  receive,
  transfer,
};
