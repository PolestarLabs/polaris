// TODO[epic=translations] local$

const ECO = require("../../archetypes/Economy");

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return null;

  msg.author.customCurr = msg.author.customCurr || {};
  msg.author.customCurr[msg.guild.id] = msg.author.customCurr[msg.guild.id] || 0;

  const [subcommand] = msg.args;

  /* ADM */
  // create
  if (subcommand === "create") {
    msg.channel.send("`[WARNING]` This subcommand will error. Feel free to ignore it. We'll come back to it later");
    msg.channel.send("Choose name");
    let responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id
            && msg2.content.length < 16,
    { maxMatches: 1, time: 30e3 });

    const pName = responses[0].content;
    if (!responses) return msg.reply("timeout");

    msg.channel.send("Choose 4-letter code");
    responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id,
      { maxMatches: 1, time: 30e3 });

    if (!responses) return msg.reply("timeout");
    const pCode = responses[0].content.substr(0, 4).toUpperCase();

    msg.channel.send("Choose LOCAL Emoji");
    responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id,
      { maxMatches: 1, time: 30e3 });

    if (!responses) return msg.reply("timeout");
    const [pIcon] = responses[0].content.split(" ");

    msg.channel.send("Initial Investment (RBN)");
    responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id
            && !Number.isNaN(parseInt(msg2.content)),
    { maxMatches: 1, time: 30e3 });
    if (!responses) return msg.reply("timeout");
    const pInvest = parseInt(responses[0].content) || 0;

    msg.channel.send(`Maximum Pool (${pCode})`);
    responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id
            && !Number.isNaN(parseInt(msg2.content)),
    { maxMatches: 1, time: 30e3 });
    if (!responses) return msg.reply("timeout");
    const pPool = parseInt(responses[0].content) || 0;


    msg.channel.send(`Your Initial balance (${pCode})`);
    responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id
            && !Number.isNaN(parseInt(msg2.content)),
    { maxMatches: 1, time: 30e3 });
    if (!responses) return msg.reply("timeout");
    const pVolume = parseInt(responses[0].content) || 0;

    msg.reply(`
        Name: **${pName}**
        Code: \`${pCode}\`
        Icon: ${pIcon}
        Investment: ${pInvest}
        Pool: ${pPool}
        **Rate:** ${pIcon}1\`${pCode}\` = ${_emoji("RBN")}${pInvest / pVolume}\`RBN\`
        
        `);

    msg.guild.economy = {
      volume: 0,
      pool: pPool,
      treasure: pInvest,
      code: pCode,
      icon: pIcon,
      get rateIn() {
        return this.treasure / this.volume;
      },
      get rateOut() {
        return this.volume / this.treasure;
      },
      set incPool(amt) {
        this.pool += amt;
        return this.pool;
      },
      set incVol(amt) {
        this.volume += amt;
        return this.volume;
      },
      set incTrea(amt) {
        this.treasure += amt;
        return this.treasure;
      },
    };
  }

  // invest
  // printmoney
  // give
  // take

  /* USR */
  // buy
  if (subcommand === "bal") {
    const eco = msg.guild.economy;
    return msg.reply(msg.author.customCurr[msg.guild.id] || `${0} x ${eco.code}${eco.icon}`);
  }
  if (subcommand === "buy") {
    const amt = msg.args[1];

    const eco = msg.guild.economy;

    if (amt + eco.volume > eco.pool) return msg.reply("Denied. Pool exceeded");
    eco.incVol = (amt * eco.rateIn);
    eco.incTrea = (amt * 0.65);
    await ECO.pay(msg.author, amt, "Local$>", "RBN");
    await DB.audits.new(msg.author, amt, "Local$>", eco.code);
    msg.author.customCurr[msg.guild.id] += amt * eco.rateIn;

    msg.reply(`OK (${amt * eco.rateIn})`);

    msg.guild.economy = eco;
  }
  // sell
  if (subcommand === "sell") {
    const amt = msg.args[1];

    const eco = msg.guild.economy;

    eco.incVol = (-(amt));
    eco.incTrea = (-(amt * eco.rateOut));
    await ECO.receive(msg.author, Math.floor(amt * eco.rateOut * 0.8), "Local$<", "RBN");
    await DB.audits.new(msg.author, -amt, "Local$<", eco.code);
    msg.author.customCurr[msg.guild.id] -= amt;

    msg.reply(`OK (${amt * eco.rateOut})`);

    msg.guild.economy = eco;
  }
  return null;
};
module.exports = {
  init,
  pub: true,
  cmd: "local$",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  argsRequired: true,
};
