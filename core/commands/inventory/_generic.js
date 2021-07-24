const ComponentPaginator = require("../../structures/ComponentPaginator.js");

const INVENTORY = require("../../archetypes/Inventory");
 

const ATTR = (i) => `${
  i.buyable ? _emoji("market_ready").no_space : _emoji("__").no_space
}\
                    ${
                      i.tradeable
                        ? _emoji("can_trade").no_space
                        : _emoji("__").no_space
                    }\
                    ${
                      i.destroyable
                        ? _emoji("can_destroy").no_space
                        : _emoji("__").no_space
                    }`;

const displayItem = (invItm, embed, P) => {
  embed.field(
    `${invItm.emoji||_emoji(invItm.type,"📦")}  **${$t(
      [`items:${invItm.id}.name`, invItm.name],
      P
    )}** × \`${invItm.count}\``,
    `
        \u2003 *${$t([`items:${invItm.id}.description`, "---"], P)}* 
        \u2003 ${ATTR(invItm)}\
        `,
    false
  );
};

class GenericItemInventory {
  constructor(type, aliases, pub, img, color) {
    this.invIdentifier = type || "junk";
    this.browsingTag = type.toUpperCase() || optionals.browsingTag;
    this.emoji = type.toUpperCase() || optionals.emoji;
    this.cmd = type || optionals.cmd;
    this.aliases = aliases || [];
    this.img = img || "";
    this.color = color || 0xebbeff; // numColor(_UI.colors.lilac_lite)
    this.pub = pub || true;

    this.init = async (msg, args, reactionMember, originalPolluxMessage) => {
      const reactionUserID = reactionMember?.id || reactionMember;

      if (
        reactionUserID &&
        args[10]?.id != reactionUserID &&
        reactionUserID !== msg.author.id
      )
        return "Only the owner can see inside";
      msg.lang = msg.lang || [msg.channel.LANG || "en", "dev"];

      const P = { lngs: msg.lang.concat("dev") };

      const userInventory = new INVENTORY(
        reactionUserID || msg.author.id,
        this.invIdentifier
      );
      const Inventory = await userInventory.listItems(args[10]);
      const response = {
        content: `${_emoji(this.emoji)} ${$t(
          `responses.inventory.browsing${this.browsingTag}`,
          P
        )} `,
      };
      if (Inventory.length === 0) {
        response.embed = {
          description: `*${rand$t("responses.inventory.emptyJokes", P)}*`,
          color: this.color,
        };
        return response;
      }
      const itemsPerPage = 50;
      const procedure = function (...args) {
        if (originalPolluxMessage?.updateMessage)
          return originalPolluxMessage.updateMessage(...args);
        if (originalPolluxMessage?.edit)
          return originalPolluxMessage.edit(...args);
        return msg.channel.send(...args);
      };

      const generateItemPage = async (PAGE, IPP, TOT, FIRST) => {

        const pace = IPP * ((PAGE || 1) - 1);
        const pagecontent = Inventory.slice(pace, pace + IPP);
        const embed = new Embed();
        embed.thumbnail(this.img);
        embed.color = 0xebbeff;
        embed.footer(
          `${(args[12] || msg).author.tag}  |  [${PAGE}/${Math.ceil(TOT/IPP)}]`,
          (args[12] || msg).author.avatarURL
        );

        if (TOT > 0 && TOT < 2) {
          Inventory.forEach((itm) => displayItem(itm, embed, P));
          response.embed = embed;
          return response;
        }
        if (TOT == 0) {
          // soft comp to match false
          embed.description = `*${rand$t(
            "responses.inventory.emptyJokes",
            P
          )}*`;
          return { embed };
        }
        let i = 0;
        embed.fields = [];
        while (i++ < IPP) {
          const invItm = pagecontent[i - 1];
          if (!invItm) {
            embed.field("\u200b", "\u200b", true);
            continue;
          }
          displayItem(invItm, embed, P);
        }

        return  procedure( { content: response.content, embed });  
      }
      
      return generateItemPage(1, itemsPerPage, Inventory.length, 1).then(
         (initialMessage) => {

          const pagi = new ComponentPaginator(
            initialMessage,
            1,
            Inventory.length,
            itemsPerPage,
            { userMessage: msg }
          );

          pagi.on("page", async (m, pag, rpp, tot, inter) => {
            originalPolluxMessage = m;
            await generateItemPage(pag, rpp, tot);
            
          });
           
          return  pagi.ready;
        }
      );
      //return mes;
    };

    this.cat = "inventory";
    this.botPerms = ["attachFiles", "embedLinks"];
    this.noCMD = false;
    this.scope = "inventory";
    this.related = [
      "boosterpack",
      "junk",
      "consumable",
      "key",
      "material",
      "lootbox",
    ].filter((i) => i != this.cmd);

    
  }
}

GenericItemInventory.noCMD = true;

module.exports = GenericItemInventory;
