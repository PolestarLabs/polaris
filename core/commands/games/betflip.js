// TRANSLATE[epic=translations] betflip
const ECO = require("../../archetypes/Economy");

const A = `${paths.CDN}/build/coins/befli_heads.gif`;
const A1 = `${paths.CDN}/build/coins/befli_h_s.png`;
const B = `${paths.CDN}/build/coins/befli_tails.gif`;
const B1 = `${paths.CDN}/build/coins/befli_t_s.png`;

const init = async (msg) => {
  const userData = await DB.users.get(msg.author.id);

  const P = { lngs: msg.lang, prefix: msg.prefix };

  const bet = Math.abs(parseInt(msg.args[0]));
  let call = msg.args[1] ? msg.args[1].toUpperCase() : null;
  let currency = msg.args[2] ? msg.args[2].toUpperCase() : "RBN";

  if (!["HEADS", "TAILS", $t("terms.coinHeads", P).toUpperCase(), $t("terms.coinTails", P).toUpperCase()].includes(call)) {
    return msg.channel.send("invalid face called");
  }

  call = ["HEADS", $t("terms.coinHeads", P).toUpperCase()].includes(call) ? "HEADS" : "TAILS";

  if (currency && currency !== "RBN" && !(await userData).donator) {
    msg.channel.send("Betting different currencies is a donators-only feature. Type `+donate` for info.");
    currency = "RBN";
  }

  const rand = randomize(1, 99);
  const countercall = call === "HEADS" ? "TAILS" : "HEADS";
  const R = bet > 2500
    ? rand > 60 + (bet / 100 > 30 ? 30 : bet / 100)
      ? call
      : countercall
    : bet < 2000
      ? rand % 2 === 0
        ? call
        : countercall
      : rand > 60
        ? call
        : countercall;

  const win = R === call;

  let noFunds;
  await ECO.pay(msg.author, bet, "gambling_betflip", currency)
    .then(() => (win ? ECO.receive(msg.author, Math.ceil(bet * 1.5), "gambling_betflip", currency) : null))
    .catch(async ({ reason }) => (reason === "NO FUNDS" ? (noFunds = true) && msg.channel.send(`Cannot afford. ${await userData.modules[currency]}/${bet}`) : null));
  // TRANSLATE: No funds text

  if (noFunds) return;

  const res = R === "HEADS" ? A : B;
  const res2 = R === "HEADS" ? A1 : B1;
  const face = R === "HEADS" ? $t("terms.coinHeads", P) : $t("terms.coinTails", P);

  const embed = new Embed();
  embed.author(`${msg.author.tag} flips a coin...`, msg.author.avatarURL);
  embed.color("#eec60c");
  embed.thumbnail(res);
  embed.description = `... calling for **${call}**
    betting **${bet} ${currency}**
    \u200b`;

  return msg.channel.send({ embed }).then(async (x) => {
    embed.setColor(win ? "#0cc6ee" : "#ee0c2c");
    embed.description = `... calling for **${call}**\nbetting **${bet} ${currency}**\nand landed **${face}**!`;
    embed.thumbnail.url = res2;
    await wait(5.5);
    P.prize = Math.ceil(bet * 1.5);
    P.currency = currency;
    P.interjection = win ? rand$t("responses.verbose.interjections.yatta", P) : rand$t("responses.verbose.interjections.ohmy_negative", P);
    x.edit({ content: win ? $t("games.coinflip.coinVictory", P) : $t("games.coinflip.coinDefeat", P), embed });

    if(win){
      Progression.emit("play.betflip.win",{msg, userID:msg.author.id});
      Progression.emit("streak.betflip.win",{value: 1, msg, userID:msg.author.id});
    }else{
      Progression.emit("streak.betflip.win",{valueSet: 0, msg, userID:msg.author.id});
    }
    if(win){
      Progression.emit("play.betflip.win",{msg, userID:msg.author.id});
      Progression.emit("streak.betflip.win",{value: 1, msg, userID:msg.author.id});
    }else{
      Progression.emit("streak.betflip.win",{valueSet: 0, msg, userID:msg.author.id});
    }

  });
};
module.exports = {
  init,
  pub: true,
  cmd: "betflip",
  argsRequired: true,
  perms: 3,
  cat: "gambling",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  ratelimit: { times: 30, hours: 1 },
};
