class Choice {
  constructor(string, index) {
    this.index = index;
    const regex = /<?(a?:([A-z,0-9]+):([0-9]{10,25}))>?/;
    const emoji = string && typeof string === "string" ? string.match(regex) : null;
    if (emoji) {
      [this.output, this.reaction, this.name, this.id] = emoji;
      this.output = `<${emoji[0]}>`;
    } else if (typeof string === "object") {
      this.name = string.name;
      this.id = string.id;
      this.reaction = `${string.name}:${string.id}`;
      this.output = `<${string.animated ? "a:" : ":"}${string.name}:${string.id}>`;
    } else {
      this.name = string;
      this.reaction = string;
      this.output = string;
    }
  }
}

const ReactionMenu = function ReactionMenu(menu, msg, choices, options = {}) {
  return new Promise((resolve) => {
    const time = options.time || 10000;
    const embed = options.embed || menu.embeds?.[0] || false;
    const avoidEdit = options.avoidEdit || true;
    const strings = options.strings || {};
    strings.timeout = strings.timeout || "TIMEOUT";

    async function startChosing(m) {
      const reas = await m.awaitReactions({
        maxMatches: 1,
        authorOnly: msg.author.id,
        time,
      }).catch(() => {
        m.removeReactions().catch(() => null);
        if (embed && !avoidEdit) {
          embed.color = 16499716;
          embed.footer = { text: strings.timeout };
          m.edit({ embed });
        }
      });

      if (!reas?.length !== 0) return resolve(null);
      m.removeReactions().catch(() => null);
      if (reas.length === 1 && choices.find((c) => reas[0].emoji.name === c.name)) {
        const res = choices.find((c) => reas[0].emoji.name === c.name);
        return resolve(res);
      }
      return resolve(null);
    }

    let proc = 0;
    choices = choices.map((v, i) => new Choice(v, i));
    choices.forEach((chc, i, all) => {
      wait((1 + i) * 0.055).then(() => menu.addReaction(chc.reaction).then(() => {
        proc += 1;
        if (proc === all.length) startChosing(menu);
      }));
    });
  });
};

ReactionMenu.choice = Choice;

module.exports = ReactionMenu;
