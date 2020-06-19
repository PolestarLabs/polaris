const Discoin = require("../../archetypes/Discoin");
const ECO = require("../../archetypes/Economy");
const CFG = require("../../../config.json");

const DCN = new Discoin(CFG.dicoin);

const init = async function (msg) {
  const Rates = JSON.parse(await DCN.rates());

  const empty = { name: "\u200b", value: "\u200b", inline: true };

  const embed = { fields: [] };
  console.log({ Rates });
  const RBN = Rates.find((r) => r.id === "RBN");

  embed.description = `${_emoji("RBN")}**1 Rubine \`RBN\` =**`;

  Rates.filter((r) => r.id != "RBN").forEach((curr) => {
    embed.fields.push({ name: curr.name, value: `\`${curr.id}\` ${Math.round(RBN.value / curr.value) || (RBN.value / curr.value).toFixed(2)}`, inline: true });
  });
  while (embed.fields.length % 3) embed.fields.push(empty);

  embed.fields.push({
    name: "\u200b",
    value: "```js\n"
+ `${msg.prefix}exg 100 XYZ\n` + "```*example usage*",
    inline: true,
  });
  embed.fields.push(empty);
  embed.fields.push({
    name: "Tax information:",
    value: "Exchange Tax: **15%**\nIncome Tax: **12%**\nTransfer Tax: **5%**",
    inline: true,
  });
  // embed.thumbnail = {url:"https://cdn.discordapp.com/attachments/488142034776096772/674882674287968266/piechart.gif"}
  embed.thumbnail = { url: "https://cdn.discordapp.com/attachments/488142034776096772/674882599956643840/abacus.gif" };
  embed.color = 0xff3355;
  return { embed };
};

module.exports = {
  init,
  pub: true,
  cmd: "exchange",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["discoin", "convert", "exg"],
};
