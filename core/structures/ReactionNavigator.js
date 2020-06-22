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

  if (!reas?.length !== 0) return null;
  m.removeReactions().catch();

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
