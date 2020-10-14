// const gear = require("../../utilities/Gearbox");
// const DB = require("../../database/db_ops");
const moment = require("moment");

const cmd = "balance";

// const locale = require(appRoot+'/utils/i18node');
// const $t = locale.getT();

const init = async (msg) => {
  const Target = msg.author;
  const emb = new Embed();

  const P = { lngs: msg.lang };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd, msg, opt: this.cat })) return;

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

  const TARGETDATA = await DB.users.get({ id: Target.id });
  emb.color("#ffc156");
  emb.title(bal);

  async function lastTransBuild(x) {
    if (!x) return "\u200b";

    const POLid = "271394014358405121";

    const ts = moment(x.timestamp).format("hh:mma | DD/MMM").padStart(16, "\u200b ");
    if (x.type === "SEND") x.type = "TRANSFER";
    if (x.to === TARGETDATA.id && x.from !== POLid) {
      othPart = (await PLX.getTarget(x.from, null, true)) || { tag: "Unknown#0000" };
      if (!othPart) return ` \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *\`${x.type}\`* from ${x.to}`;
      return `↔ \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   `
        + `*\`${x.type}\`* from [${othPart?.tag}](http://pollux.fun/p/${othPart?.id}) \`${othPart.id}\` `;
    }
    if (x.from === TARGETDATA.id && x.to !== POLid) {
      othPart = (await PLX.getTarget(x.to, null, true)) || { tag: "Unknown#0000" };
      if (!othPart) return ` \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *\`${x.type}\`* to ${x.to}`;
      return `↔  \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   `
        + `*\`${x.type}\`* to [${othPart?.tag}](http://pollux.fun/p/${othPart?.id}) \`${othPart.id}\` `;
    }
    if (x.to === POLid) return `📤  \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *${x.type}*`;
    if (x.from === POLid) return `📥  \`${ts}\` **${x.amt}** ${x.currency}\n\u200b\u2003\u2003|   *${x.type}*`;

    return "\u200b";
  }

  if (TARGETDATA) {

    
    emb.field("\u200bClassic Gems",`\u200b`
    + `\u2003${_emoji("RBN")} ${$t("keywords.RBN_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.rubines, true)}**`
    + `\n\u2003${_emoji("SPH")} ${$t("keywords.SPH_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.sapphires, true)}**`
    + `\n\u2003${_emoji("JDE")} ${$t("keywords.JDE_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.jades, true)}**`,
    true)
    
    emb.field("\u200bPolaris Gems",`\u200b`
    + `\u2003${_emoji("COS")} ${$t("keywords.COS_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.inventory.find(i=>i.id==='cosmo_fragment')?.count||0, true)}**`
    + `\n\u2003${_emoji("PSM")} ${$t("keywords.PSM_plural", { lngs: msg.lang })}: **${miliarize(TARGETDATA.modules.prisms, true)}**`
    + `\n\u2003${_emoji("EVT")} ${"Event Tokens"}: **${miliarize(TARGETDATA.eventGoodie || 0, true)}**`
    + `\n${invisibar}`,
    true)

    lastTrans = await DB.audits.find({ $or: [{ from: TARGETDATA.id }, { to: TARGETDATA.id }] }).sort({ timestamp: -1 }).limit(5);
    emb.field("Last Transactions",
      `${await lastTransBuild(lastTrans[0])}
${await lastTransBuild(lastTrans[1])}
${await lastTransBuild(lastTrans[2])}
${await lastTransBuild(lastTrans[3])}
${await lastTransBuild(lastTrans[4])}
`, false);
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
  emb.thumbnail(`${paths.CDN}/build/coins/befli_t_s.png`)
  msg.channel.send({ embed: emb });
};
module.exports = {
  pub: true,
  botPerms: ["embedLinks"],
  aliases: ["bal", "sapphires", "jades"],
  cmd,
  perms: 3,
  init,
  cat: "cash",
};
