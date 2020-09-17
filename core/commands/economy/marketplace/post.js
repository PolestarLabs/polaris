// const DB = require('../../../database/db_ops');
// const gear = require('../../../utilities/Gearbox');
const YesNo = require("../../../structures/YesNo");

const init = async (msg, args) => {
  // buy type id

  let operation = (args[0] || "").toLowerCase(); //  BUY / SELL
  if (operation && !["buy", "sell", "info"].includes(operation.toLowerCase())) {
    msg.args.unshift(" ");
    operation = "sell";
  } // defaults to SELL
  const itemType = msg.args[2]; //  BG / MEDAL / STICKER / etc.
  const itemID = msg.args[3]; //  Item ID / Code / Icon
  const price = Math.abs(parseInt(msg.args[4])); //  #
  let currency = msg.args[5] || "RBN"; //  RBN / SPH
  if (currency & !["RBN", "SPH"].includes(currency.toUpperCase())) currency = "RBN";

  /*
  const Helpers = {
    background: "`+market post [sell/buy] background [ID] [PRICE] [SPH/RBN]` - IDs can be found at BG Shop and BG Inventory (Website)",
    medal: "`+market post [sell/buy] medal [ID] [PRICE] [SPH/RBN]` - IDs can be found at Medal Shop and Medal Inventory (Website)",
    sticker: "`+market post [sell/buy] sticker [ID] [PRICE] [SPH/RBN]` - IDs can be found at Sticker Collections and Stickers Inventory (Website)",
    boosterpack: "`+market post [sell/buy] booster [ID] [PRICE] [SPH/RBN]` - IDs can be found at Boosterpack Collection (`+boosterpack`)",
    item: "`+market post [sell/buy] item [ID] [PRICE] [SPH/RBN]` - IDs can be found at Inventory (`+inventory`)",
  };
  */

  const embed = new Embed();
  embed.title = "Marketplace Listing information";
  embed.description = `
        ${_emoji("RBN")} **Rubine** Listings cost 300 RBN upfront
        ${_emoji("SPH")} **Sapphire** Listings cost 2 SPH upfront
        To sell for Sapphires you need a [Sapphire License](${`${paths.CDN}/crafting/#sph-license`}) that must be crafted 
        (Code: \`sph-license\`). It expires after 10 uses.
        There's a 5% cut from the selling price after it is completed.
        *You cannot sell items currently on sale at the storefront for more than their retail price.*
        `;

  async function AllChecks() {
    const userData = DB.users.getFull({ id: msg.author.id });

    const checkItem = (uD, type, id, transaction) => {
      pass = true;
      reason = "";
      prequery = false;
      query = false;

      if (type === "background") {
        if (!uD.modules.bgInventory.includes(id)) {
          pass = false;
          reason = "Background not in Inventory";
        } else {
          query = { $pull: { "modules.bgInventory": id } };
        }
      }
      if (type === "medal") {
        if (!uD.modules.medalInventory.includes(id)) {
          pass = false;
          reason = "Medal not in Inventory";
        } else {
          query = { $pull: { "modules.medalInventory": id } };
        }
      }
      if (type === "boosterpack") {
        if (!uD.modules.inventory.filter((itm) => itm.id === `${id}_booster` && itm.count > 0)) {
          pass = false;
          reason = "Booster not in Inventory";
        } else {
          prequery = { id: uD.id, "modules.inventory.id": id };
          query = { $inc: { "modules.inventory.$.count": -1 } };
        }
      }
      if (transaction === "buy") {
        pass = true;
      }

      return {
        pass, reason, prequery, query,
      };
    };
    const checkSales = (uD) => {
      let forRBN = true;
      let forSPH = true;
      if (uD.modules.rubines < 300) forRBN = false;
      if (uD.amtItem("sph-license") < 1) forSPH = false;
      if (uD.modules.sapphires < 2) forSPH = false;

      return { forRBN, forSPH };
    };

    const saleStatus = checkSales(await userData, itemType, itemID);
    const itemStatus = checkItem(await userData, itemType, itemID, operation);

    embed.field(
      `${_emoji("RBN")}Rubine Listing Eligibility`,
      saleStatus.forRBN ? itemStatus.pass ? _emoji("yep") : itemStatus.reason : _emoji("nope"), true,
    );
    embed.field(
      `${_emoji("SPH")}Sapphire Listing Eligibility`,
      saleStatus.forSPH ? itemStatus.pass ? _emoji("yep") : itemStatus.reason : _emoji("nope"), true,
    );

    if (operation === "info" || operation === "") {
      return msg.channel.send({ embed });
    }

    const validOperation = ["sell", "buy"].includes(operation);
    const validType = ["background", "medal", "boosterpack", "sticker", "skin", "key", "consumable", "junk"].includes(itemType);
    const validCurrency = ["RBN", "SPH"].includes(currency);
    const validItem = await DB.items.findOne({ type: itemType, $or: [{ id: itemID }, { icon: itemID }] });
    const checkCosmetic = await DB.cosmetics.findOne({
      type: itemType,
      $or: [
        { id: itemID },
        { icon: itemID },
        { code: itemID },
        { localizer: itemID },
      ],
    });

    return {
      validOperation, validType, item_id: itemID, validItem, checkCosmetic, price, validCurrency, itemStatus, saleStatus,
    };
  }

  const {
    validOperation, validType, validItem, checkCosmetic, validCurrency, itemStatus, saleStatus,
  } = await AllChecks();

  function FULLCHECKS(complete = false) {
    if (complete) {
      console.log(complete);
      return complete.validOperation && complete.validType && complete.item_id && (complete.validItem || complete.checkCosmetic)
      && complete.price && complete.validCurrency && complete.itemStatus.pass && complete.saleStatus[`for${currency}`];
    }
    return validOperation && validType && itemID && (validItem || checkCosmetic)
    && price && validCurrency && itemStatus.pass && saleStatus[`for${currency}`];
  }

  const abort = () => {
    embed.title = "";
    embed.description = `
            **Operation:** ${operation} ${validOperation ? _emoji("yep") : _emoji("nope")}
            **Item Type:** ${itemType} ${validType ? _emoji("yep") : _emoji("nope")}
            **Item ID:** ${itemID} ${(checkCosmetic || validItem) ? _emoji("yep") : _emoji("nope")}
            **Price:** ${price} ${price && price > 0 ? _emoji("yep") : _emoji("nope")}
            **Currency:** ${currency} ${validCurrency ? _emoji("yep") : _emoji("nope")}
            `;
    msg.channel.send({
      content: ` **Invalid Listing Command**
            `,
      embed,
    });
  };

  const confirm = async (cancellation) => {
    payload = await AllChecks();
    if (!payload.pass) return;
    if (FULLCHECKS(payload)) {
      payload.LISTING = {
        item_id: itemID,
        item_type: itemType,
        price,
        currency,
        author: msg.author.id,
        type: operation,
      };
      payload.pollux = MARKET_TOKEN;

      axios.post(`${paths.CDN}/api/marketplace`, payload).then((res) => {
        if (res.data.status === "OK") {
          entryId = res.data.payload.id;
          msg.channel.send(`
${_emoji("yep")} **Done!** You can find your entry here:
${`${paths.CDN}/shop/marketplace/entry/${entryId}`}
Use it to share your listing elsewhere! 
                        `);
        } else {
          cancellation();
        }
      });
    } else {
      msg.channel.send("Listing Invalidated");
      abort();
      cancellation();
    }
  };

  if (FULLCHECKS()) {
    if (checkCosmetic || validItem) {
      msg.channel.send({
        embed: {
          description: `${operation === "sell" ? "Selling" : "Buying"}: \`${itemType}\``
          + `**${(checkCosmetic || validItem).name}** for **${price}** ${_emoji(currency)}`,
        },
      }).then((ms) => {
        YesNo(ms, msg, confirm);
      });
    }
  } else {
    if (operation === "info" || operation === "") return;
    abort();
  }
};

module.exports = {
  init,
  argsRequired: false,
  caseInsensitive: true,
  cooldown: 8000,
  hooks: {
    preCommand: (msg) => (msg.author.marketplacing = true),
    postExecution: (msg) => (msg.author.marketplacing = false),
  },
};
