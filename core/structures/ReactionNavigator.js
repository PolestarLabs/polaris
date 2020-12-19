/**
 *
 * @param {object} m Message that will receive the reactions
 * @param {object} msg Original command messages
 * @param {function} pagefun Pagination function
 * @param {object} options
 * @param {number|10e3} options.time Timeout timer
 * @param {string} options.content ???
 * @param {object} options.embed Message embed or embed template
 * @param {boolean|false} options.avoidEdit Avoid automatic edit
 * @param {object} options.strings
 * @param {string} options.strings.timeout Timeout text
 * @param {number|1} options.page Starting Page
 * @param {number|1} options.tot_pages  Total pages
 * @param {number|30} rec Maximum recursion, never larger than 30
 */

module.exports = async function ReactionNavigator(m, msg, pagefun, options = {}, rec) {
  if (rec > 30) return msg.reply("`Navigation Limit Reached`");

  const time = options.time || 10000;
  const content = options.content || m.content?.[0] || "";
  const embed = options.embed || m.embeds?.[0] || false;
  const avoidEdit = options.avoidEdit || true;
  const strings = options.strings || {};
  strings.timeout = strings.timeout || "TIMEOUT";

  const page = options.page || 1;
  const totPages = options.tot_pages || 1;

  const isFirst = page === 1;
  const isLast = page === totPages;

  if (!isFirst) m.addReaction("◀");
  if (!isLast) m.addReaction("▶");

  const reas = await m.awaitReactions({
    maxMatches: 1,
    authorOnly: msg.author.id,
    time,
  }).catch(() => {
    m.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 16499716;
      embed.footer = { text: strings.timeout };
      m.edit({ content, embed });
    }
  });

  if (!reas || reas.length === 0) return null;
  m.removeReactions().catch(console.error);

  if (!isFirst && reas.length === 1 && reas[0].emoji.name === "◀") {
    options = null;
    pagefun(page - 1, m, rec += 1);
    m = null;
    msg = null;
  }

  if (!isLast && reas.length === 1 && reas[0].emoji.name === "▶") {
    pagefun(page + 1, m, rec += 1);
    options = null;
    m = null;
    msg = null;
  }
};
