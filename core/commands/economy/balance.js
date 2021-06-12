const moment = require("moment");

const init = async (msg) => {
  const Target = msg.author;
  const emb = new Embed();

  const P = { lngs: msg.lang };

  const bal = $t("responses.$.balance", P);
  /*
    const put =  $t('$.lewdery',P);
    const jog =  $t('$.gambling',P);
    const dro =  $t('$.drops',P);
    const tra =  $t('$.trades',P);
    const gas =  $t('$.expenses',P);
    const gan =  $t('$.earnings',P);
    const tot =  $t('$.total',P);
    const exg =  $t('$.exchange',P);
    const don =  $t('$.donation',P);
    const cra =  $t('$.crafts',P);
    const nope = $t('CMD.noDM',P);
    */

  moment.locale(msg.lang[0]);

  const TARGETDATA = (await DB.users.get({ id: Target.id })) || (await DB.users.new(msg.author)) ;
  
  emb.color("#ffc156");
  emb.title(bal);

  async function lastTransBuild(x) {
    if (!x) return "";

    const POLid = PLX.user.id;

    const ts = moment(x.timestamp).format("hh:mma | DD/MMM").padStart(16, "\u200b ");
    if (x.type === "SEND") x.type = "TRANSFER";
    if (x.to === POLid || x.to === 'DASHBOARD' ) return `🔴 \`${ts}\` ${_emoji(x.currency,x.currency)} **${x.amt}**\n\u200b ╰ |   *${x.type}*`;
    if (x.from === POLid || x.from === 'DASHBOARD' ) return `🟢 \`${ts}\` ${_emoji(x.currency,x.currency)} **${x.amt}**\n\u200b ╰ |   *${x.type}*`;

    if ( x.from && (x.to === TARGETDATA.id && x.from !== POLid) ) {
      othPart = (await PLX.getTarget(x.from, null, true)) || { tag: x.from };
      if (!othPart) return ` \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *\`${x.type}\`* from ${x.to}`;
      return `↔ \`${ts}\` ${_emoji(x.currency,x.currency)} **${x.amt}**\n\u200b ╰ |   `
        + `*\`${x.type}\`* from [${othPart?.tag}](${paths.DASH}/p/${othPart?.id})   `;
    }
    if ( x.to && (x.from === TARGETDATA.id && x.to !== POLid) ) {
      othPart = (await PLX.getTarget(x.to, null, true)) || { tag: x.to };
      if (!othPart) return ` \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *\`${x.type}\`* to ${x.to}`;
      return `↔  \`${ts}\` ${_emoji(x.currency,x.currency)} **${x.amt}**\n\u200b ╰ |   `
        + `*\`${x.type}\`* to [${othPart?.tag}](${paths.DASH}/p/${othPart?.id})  `;
    }

    return "";
  }

  if (TARGETDATA) {
    emb.field("\u200bClassic Gems", "\u200b"
      + `\u2003${_emoji("RBN")} ${$t("keywords.RBN_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.RBN, true)}**`
      + `\n\u2003${_emoji("SPH")} ${$t("keywords.SPH_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.SPH, true)}**`
      + `\n\u2003${_emoji("JDE")} ${$t("keywords.JDE_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.JDE, true)}**`,
      true);

    emb.field("\u200bPolaris Gems", "\u200b"
      + `\u2003${_emoji("COS")} ${$t("keywords.COS_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.inventory.find((i) => i.id === "cosmo_fragment")?.count || 0, true)}**`
      + `\n\u2003${_emoji("PSM")} ${$t("keywords.PSM_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.PSM ?? 0, true)}**`
      + `\n\u2003${_emoji("EVT")} ${"Event Tokens"}: **${miliarize(TARGETDATA.eventGoodie || 0, true)}**`
      + `\n${invisibar}`,
      true);

    lastTrans = await DB.audits.find({ $or: [{ from: TARGETDATA.id }, { to: TARGETDATA.id }] }).sort({ timestamp: -1 }).limit(5);
    emb.field("Last Transactions",
      `${await lastTransBuild(lastTrans[0])}
${await lastTransBuild(lastTrans[1])}
${await lastTransBuild(lastTrans[2])}
${await lastTransBuild(lastTrans[3])}
${await lastTransBuild(lastTrans[4])}
`.trim() || "\u200b", false);
  } else {
    emb.description(`User \`${Target.id}\` not found in Pollux Database`);
  }
  if (Target) {
    emb.footer(Target.tag, Target.avatarURL);
  } else {
    emb.description = `User \`${Target.id}\` not found anywhere`;
    emb.fields = [];
    emb.fields = [];
  }
  emb.thumbnail(`${paths.CDN}/build/coins/befli_t_s.png`);
  
  
  return { embed: emb };
};
module.exports = {
  pub: true,
  slashable: true,
  slashOptions: {
    options: [
      {
        name: "private",
        description: "Show this only to yourself",
        type: 5,
        required: false,
      }
    ],
    guilds: ["789382326680551455"],
    //global: true,
  },
  botPerms: ["embedLinks"],
  aliases: ["bal", "sapphires", "jades"],
  cmd: "balance",
  perms: 3,
  init,
  cat: "economy",
};
