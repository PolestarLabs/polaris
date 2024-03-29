//STUB Transaction Types Table



// type = "<type>[.specifics]" 
//or
// type + options.details[.specifics]  (user_id, loot_id, servr_id etc.)

const TRANSACTION_TYPES = {

  daily: "Daily Rewards"
  , webdaily: "Daily Rewards [Dashboard]"
  , daily_10streak_website: "Daily 10 Streak Bonus [Dashboard]"
  , daily_3streak_website: "Daily 3 Streak Bonus [Dashboard]"
  , daily_250streak_website: "Daily 250 Streak Bonus [Dashboard]"
  , daily_365streak_website: "Daily 365 Streak Bonus [Dashboard]"
  , upvote_daily_boost_website: "Daily Upvote Bonus [Dashboard]"
  , special_daily_boost_website: "Daily Special Bonus [Dashboard]"


  , lootbox_drop: "Lootbox Drop: {{loot_id}}"
  , lootbox_transfer: "Lootbox Transfer: {{user_id}}"

  , lootbox_rewards: "Lootbox Rewards"
  , lootbox_reroll: "Lootbox Reroll"
  , lootbox_transfer_tax: "Lootbox Transfer Tax"

  , rubine_transfer: "Rubine Transfer Fee"

  , gambling_betflip: "Betflip"
  , gambling_blackjack: "Blackjack"
  , gambling_roulette: "Casino Roulette"
  , gambling_russroll: "Russian Roulette"

  , role_purchase: "Role Purchase at {{server_id}}"

  , bgshop_bot: "Background Quickbuy"
  , bgshop_dash: "Background Shop Classic"
  , background_shop_dash: "Background Shop Classic"
  , medalshop_dash: "Medal Shop Classic"
  , medal_shop_dash: "Medal Shop Classic"

  , bgshop_dash_bundle: "Background Shop Bundle"
  , medalshop_dash_bundle: "Medal Shop Bundle"

  , crafting_dash: "Crafting: [Dashboard]"
  , crafting_bot: "Crafting: [Bot]"
  , crafting_discovery: "Crafting: [Discovery]"

  , crafting_service: "Crafting: {{player}} Service"
  , crafting_advanced: "Adv.Crafting: Material Costs"

  , expand_gallery_slots: "Expand Gallery Slots"
  , sell_gallery_slots: "Sell Gallery Slots"
  , expand_wife_slots: "Expand Marriage Slots"
  , webshop_custom: "Webshop(?) - {{type}}"

  , storefront_bundle: "Storefront: Bundle"
  , storefront_background: "Storefront: Background"
  , storefront_medal: "Storefront: Medal"
  , storefront_other: "Storefront: Other"

  , marketplace_buy: "Marketplace: BUY"
  , marketplace_sell: "Marketplace: SELL"
  , marketplace_post: "Marketplace: POST Fee"

  , event_action: "Event: [{{action}}]"

  , airlines: "Airlines: {{???}}"
  , discoin_out: "Discoin: >> [{{currency}}]"
  , discoin_in: "Discoin: << [{{currency}}]"
  , local$: "Custom Currency Trade [{{currency}}]"
  , local$_convert: "Trade for Rubines"
  , local$_trade: "Trade with {{user_id}}"
  , local$_treasury: "Custom Currency Treasury"
  , local$_invest: "Custom Currency Invest"

  , venture_event: "Adventure Journey Event"
  , venture_insurance: "Adventure Insurance"

  , adm_awarded: "Admin Awarded"
  , dono_rewards: "{{tier}} Rewards: {{month}}/{{year}}"
  , dono_rewards_1st: "{{tier}} Rewards: {{month}}/{{year}} (First Month Bonus)"

};


/**
 * @typedef Transaction
 * @property {string} transactionId
 * @property {string} from
 * @property {string} to
 * @property {number} amt
 * @property {string} currency
 * @property {string} type
 * @property {string} subtype
 * @property {string} transaction
 * @property {number} timestamp
 */

/**
 * @typedef TransactionOptions
 * @property {boolean} [allowZero] false :: whether to allow transactions with amt=0 to go through.
 * @property {boolean} [disableFundsCheck] false :: if true payments will go through with insufficient balance.
 * @property {object} [fields] {} :: custom fields to add to the audit
 * @property {object} [progressionOptions] {} :: options passed onto Progression
 */

// NOTE don't touch this thnx

/*
 * TODO[epic=mitchell,priority=low] Refactor to be more option oriented instead of infinite params.
*/

/** 
 * @typedef CurrencyMap
 * @property {"RBN"} RUBINE
 * @property {"JDE"} JADE
 * @property {"SPH"} SAPPHIRE
 * @property {"AMY"} AMETHYST
 * @property {"EMD"} EMERALD
 * @property {"TPZ"} TOPAZE
 * @property {"PSM"} PRISM
 * @property {"EVT"} EVENT_TOKEN
 */
/** @type {CurrencyMap} */
const toCurrencies = {
  RUBINE: "RBN", JADE: "JDE", SAPPHIRE: "SPH",
  AMETHYST: "AMY", EMERALD: "EMD", TOPAZE: "TPZ", PRISM: "PSM",
};
/** @typedef {"RBN" | "JDE" | "SPH" | "AMY" | "EMD" | "TPZ" | "PSM" | "EVT"} Currency */
/** @typedef {Currency[]} CurrencyArray*/
/** @type {CurrencyArray} */
const currencies = [
  "RBN", "JDE", "SPH",
  "AMY", "EMD", "TPZ", "PSM",
  "EVT"
];


/** @typedef {keyof CurrencyMap | Currency} curr */
/**
 * parseCurrencies Checks if currency or currencies are valid, otherwise throws error.
 * 
 * @param {Currency} curr
 * @returns {Currency}
 * @throws {Error} 
 */ /**
* parseCurrencies Checks if currency or currencies are valid, otherwise throws error.
* 
* @param {Currency[]} curr
* @returns {Currency[]}
* @throws {Error} 
*/
function parseCurrencies(curr) {
  // Argument parsing
  const type = typeof curr;

  // @ts-expect-error non-strict checks in other files
  if (typeof curr === "string") curr = [curr.toUpperCase()]; // @ts-expect-error non-strict checks in other files
  else currarr = curr.map(c => c.toUpperCase());

  // convert currencies to XXX format. eg. rubines/rubine → RBN.
  // @ts-expect-error can't handle this...
  if (curr) curr = (/** @type {Currency[]} */(curr)).map(c => toCurrencies[c] ? (toCurrencies[(/** @type {keyof CurrencyMap} */(c))]) : toCurrencies[c.slice(0, c.length - 1)] ? c.slice(0, c.length - 1) : c);

  // NOTE: changing the way this returns has implications down the line.
  if ((/** @type {Currency[]} */(curr)).some(curr => !currencies.includes(curr))) throw new Error(`Unknown ${!curr ? "object" : typeof curr === "string" ? "currency" : "currencies"}: ${curr}`); // @ts-expect-error
  return (type === "string" ? curr[0] : curr);
}

/**
 * Checks whether the user's funds are equal to or exceed amt.
 *
 * @param {string|{id: string}} user user(ID)
 * @param {number|number[]} amount The amount necessary.
 * @param {Currency|Currency[]} [currency="RBN"] Currency to check against :: default "RBN".
 * @return {Promise<boolean>} True iff enough funds.
 * @throws {Error} Invalid arguments.
 */
function checkFunds(user, amount, currency = "RBN") {
  if (amount === 0) return Promise.resolve(true);
  if (!user) throw new Error(`Missing user: ${user}`);

  if (typeof amount !== "number") {
    if (amount.length) {
      for (let amt of amount)
        if (typeof amt !== "number") throw new TypeError("Amounts should of type number.");
    } else throw new TypeError("Amount should be of type number.");
  }

  let curr = parseCurrencies(currency);

  // Argument validation
  // NOTE: comparing currency first and then curr might result in error if parseCurrencies isn't typesafe.
  if (typeof amount === "number" || typeof currency === "string") {
    if (!(typeof amount === "number" && typeof curr === "string")) throw new TypeError("amt & curr need to be a single number & string or equal length arrays.");
    amount = [amount];
    curr = [curr];
  } else if (amount.length !== currency.length) throw new TypeError("amt & curr arrays need to be equal length");

  const uID = (typeof user === "object") ? user.id : user;
  if (uID === PLX.user.id) return Promise.resolve(true);

  return DB.users.get(uID).then((  /** @type { { modules: {[K in Currency]:number} } | null } */ userData) => {
    if (!userData) return false;
    return (/** @type {Currency[]} */(curr)).every((c, i) => {
      if ((/** @type {number[]} */(amount))[i] === 0) return true;
      if (!userData.modules[c]) return false;
      return (userData.modules[c] >= (/** @type {number[]} */(amount))[i]);
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
 * @param {object} [fields={}] Custom fields added to the Payload
 * @return {Transaction} The payload generated.
 */
let arbitraryIncrementer = 0;
function generatePayload(userFrom, userTo, amt, type, curr, subtype, symbol, fields = {}) {
  if (!(userFrom && type && curr && subtype && symbol && userTo)) throw new Error("Missing arguments");
  if (typeof amt !== "number") throw new TypeError("Type of amount should be number.");

  if (typeof userFrom === "object") userFrom = userFrom["id"];
  if (typeof userTo === "object") userTo = userTo["id"];

  const now = Date.now();
  const payload = {
    subtype: subtype,
    type: type,
    currency: curr,
    transaction: symbol,
    from: userFrom,
    to: userTo,
    timestamp: now,
    transactionId: `${curr}${(now + randomize(-1000, 1000) + arbitraryIncrementer++).toString(32).toUpperCase()}`,
    amt: amt < 0 ? -amt : amt,
  };

  return { ...fields, ...payload };
}

/**
 * Method for a user to pay x gems.
 *
 * @param {{id: string}|string} user user(ID)
 * @param {number|Array<number>} amt amt user will receive
 * @param {string} [type="OTHER"] transaction type :: default OTHER
 * @param {Currency|Array<Currency>} [currency="RBN"] currency in any letter format :: default "RBN"
 * @param {TransactionOptions} [options={}] The transaction options
 * @return {Promise<Array<Transaction>|Transaction|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
function pay(user, amt, type = "OTHER", currency = "RBN", options = {}) {
  return transfer(user, PLX.user.id, amt, type, currency, "PAYMENT", "-", options);
}

/**
 * Method for a user to receive x gems.
 *
 * @param {{id: string}|string} user user object or ID
 * @param {number|Array<number>} amt amt user will receive
 * @param {string} [type="OTHER"] transaction type :: default OTHER
 * @param {Currency|Array<Currency>} [currency="RBN"] currency in any letter format :: default "RBN"
 * @param {TransactionOptions} options The transaction options
 * @return {Promise<Array<Transaction>|Transaction|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
function receive(user, amt, type = "OTHER", currency = "RBN", options = {}) {
  return transfer(PLX.user.id, user, amt, type, currency, "INCOME", "+", options);
}

/**
 * A money transfer between users.
 * 
 * @param {string|{id: string}} userFrom user(ID) from
 * @param {string|{id: string}} userTo user(ID) to
 * @param {number|number[]} amt The amounts to transfer, or an array of.
 * @param {string} [type="SEND"] The type of transaction :: default "SEND"
 * @param {Currency|Currency[]} [curr="RBN"] The currenc(y)(ies) to transfer :: default "RBN"
 * @param {string} [subtype="TRANSFER"] The sub-type of the transaction :: default "TRANSFER"
 * @param {string} [symbol=">"] The transaction symbol :: default ">"
 * @param {TransactionOptions} [options] The transaction options
 * @return {Promise<Transaction[]|Transaction|null>} The payload(s) or null if [amt === 0].
 * @throws {Error} Invalid arguments.
 * @throws {Error} Not enough funds.
 */
async function transfer(userFrom, userTo, amt, type = "SEND", curr = "RBN", subtype = "TRANSFER", symbol = ">", { allowZero = false, disableFundsCheck = false, fields = {}, progressionOptions = {} } = {}) {
  if (!(userFrom && userTo)) throw new Error("Missing arguments");
  if (typeof amt !== "number" && !amt?.length) throw new TypeError("Type of amount should be number.");

  // Argument parsing
  if (typeof userFrom === "object") userFrom = userFrom.id;
  if (typeof userTo === "object") userTo = userTo.id;

  // Checks
  const hasFunds = await checkFunds(userFrom, amt, curr);
  if (!hasFunds && !disableFundsCheck) {
    INSTR.inc("eco.transactions",{ status: "error", currency: curr, type, description:"no-funds" });
    return Promise.reject(new Error({ reason: "NO FUNDS" }));
  }

  // Argument validation
  curr = parseCurrencies(curr);
  if (typeof amt === "number" || typeof curr === "string") {
    if (!(typeof amt === "number" && typeof curr === "string")) return Promise.reject("amt & curr need to be a single number & string or equal length arrays.");
    amt = [amt];
    curr = [curr];
  } else if (amt.length !== curr.length) return Promise.reject("amt & curr arrays need to be equal length");

  /** @type {number} */

  let incomeType;
  if ((incomeType = ["INCOME", "PAYMENT"].indexOf(subtype)) > -1) {
    
    curr.forEach((CURR, i) => {
      INSTR.inc("eco.transactions",{
        status: "ok",
        currency: CURR,
        type,
        subtype,
        amount: amt[i],
        from: userFrom,
        to: userTo,
      });

      Progression.emit(`${["earn", "spend"][incomeType]}.${CURR}.${type}`, { value: amt[i], userID: ([userTo, userFrom][incomeType]), options: progressionOptions });
    });
  }

  // Setup v1.0
  /** @type {{[index: string]: number}} */
  const fromUpdate = {};
  /** @type {{[index: string]: number}} */
  const toUpdate = {};
  /** @type {Transaction[]} */
  const payloads = [];

  // Fill DB calls
  for (let i in curr) {
    let absAmount = Math.abs(amt[i]);
    if (typeof absAmount !== "number") return Promise.reject(new TypeError("Amounts should be of type number."));
    if (absAmount === 0 && !allowZero) continue; // stop if AMT = 0 && !allowZero
    fromUpdate[`modules.${curr[i]}`] = -absAmount;
    toUpdate[`modules.${curr[i]}`] = absAmount;
    payloads.push(generatePayload(userFrom, userTo, amt[i], type, curr[i], subtype, symbol, fields));
  }

  // If every amt was zero
  if (!payloads.length) return Promise.resolve(true); // Return true signaling success even if zero

  // Setup v2.0
  const toWrite = [
    { updateOne: { filter: { id: userFrom }, update: { $inc: fromUpdate } } },
    { updateOne: { filter: { id: userTo }, update: { $inc: toUpdate } } },
  ];

  // Finish with DB updates & inserts.
  await DB.users.bulkWrite(toWrite);
  await DB.audits.collection.insertMany(payloads);
  payloads.forEach(logTransaction)

  return payloads.length === 1 ? payloads[0] : payloads;

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
 * @param {object} [fields={}] Custom fields added to the Audit
 * @returns {Promise<Transaction>} The payload or null if missing args.
 */
async function arbitraryAudit(from, to, amt = 1, type = "ARBITRARY", tag = "OTH", symbol = "!!", fields = {}) {
  if (!from || !to) throw new Error("Missing arguments");
  if (typeof amt !== "number") throw new TypeError("Type of amt should be number.");
  const payload = generatePayload(from, to, amt, type, tag, type, symbol, fields);
  await DB.audits.new({ ...fields, ...payload });
  return { ...fields, ...payload };
}

module.exports = {
  TRANSACTION_TYPES,
  currencies,
  arbitraryAudit,
  checkFunds,
  generatePayload,
  parseCurrencies,
  pay,
  receive,
  transfer,
};


function logTransaction(t) {
  //if()
  let cleanString = `-------${t.amt}---${t.currency}-${t.type}-${t.from}----${t.to}--${t.transactionId}--`
  let fullString = `${t.subtype === "PAYMENT" ? " [-] ".red : t.subtype === "TRANSFER" ? " [>] ".yellow : " [+] ".green
    } ${(" " + t.amt + " ").inverse}${t.currency == "RBN"
      ? " RBN ".bgRed
      : t.currency == "JDE"
        ? " JDE ".bgCyan
        : t.currency == "SPH"
          ? " SPH ".bgBlue
          : t.currency.yellow

    } ${t.type.cyan} ${t.from[t.from == PLX.user.id ? 'white' : 'magenta']} ${"->".gray} ${t.to[t.to == PLX.user.id ? 'white' : 'magenta']} [${t.transactionId.gray}]`;

  let line = "┌" + cleanString.replace(/./g, "─") + "┐\n"
  let line2 = "\n└" + cleanString.replace(/./g, "─") + "┘"
  console.log(line + "│" + fullString + " │" + line2);
}