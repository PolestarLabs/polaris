const cmd = "synthesize";
const fs = require("fs");
const ECO = require("../../../archetypes/Economy.js");

const Picto = require(`${appRoot}/core/utilities/Picto`);

const init = async function (message, args) {
  const P = { lngs: message.lang };

  const MSG = message.content;
  const helpkey = $t("helpkey", {
    lngs: message.lang,
  });
  if (MSG.split(/ +/)[1] == helpkey || MSG.split(/ +/)[1] == "?" || MSG.split(/ +/)[1] == "help") {
    return PLX.usage(cmd, message, this.cat);
  }

  const YA = {
    r: ":yep:339398829050953728",
    id: "339398829050953728",
  };
  const NA = {
    r: ":nope:339398829088571402",
    id: "339398829088571402",
  };

  const canvas = Picto.new(400, 150);
  const ctx = canvas.getContext("2d");

  const operation = message.args[0] || "bg";
  const target = message.args[1] || "random";
  const userData = await DB.users.getFull({ id: message.author.id });
  const embed = new Embed();
  let hasIt; let affordsIt; let canBuy; let selectedItem; let positive; let obtainable;

  function gemCount(rar) {
    return `${selectedItem.rarity == rar ? " __**" : ""}${_emoji(rar)} ${userData.amtItem(`cosmo_gem_${rar}`)}${selectedItem.rarity == rar ? "**__ " : ""}`;
  }

  if (operation == "bg") {
    ({
      selectedItem, hasIt, canBuy, affordsIt, obtainable, positive,
    } = await (require("./synthBg.js"))(args, userData, embed, P, ctx));
  }

  if (operation == "medal") {
    ({
      selectedItem, hasIt, canBuy, affordsIt, obtainable, positive,
    } = await (require("./synthMedal.js"))(args, userData, embed, P, ctx));
  }

  embed.field(obtainable ? $t("keywords.synthGems", P) : "\u200b", obtainable
    ? `  ${gemCount("C")} ${gemCount("U")} ${gemCount("R")} ${gemCount("SR")} ${gemCount("UR")}`
    : "`Can't be synthesized 😦`", true);
  embed.image("attachment://synth.png");

  const YesNo = require("../../../structures/YesNo");

  message.channel.send({ embed }, file(await canvas.toBuffer(), "synth.png")).then(async (m) => {
    if (!hasIt && affordsIt && canBuy) {
      YesNo(m, message, positive, null, null, {
        embed,
        strings: {
          cancel: "Cancel!",
          confirm: $t("responses.equip.successBG", P),
          timeout: "Timeout!",
        },
      });
    }
  });
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "cosmetics",
  aliases: ["synth"],
};
