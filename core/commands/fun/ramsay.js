const DspHook = require("../../structures/DisposableWebhook.js");

const init = async (msg) => {
  const avatars = [
    "https://robbreportedit.files.wordpress.com/2018/04/gordon-ramsay-1-e1523056498302.jpg?w=1008",
    "https://i.ytimg.com/vi/AVMtt2o2KiI/hqdefault.jpg",
    "https://hips.hearstapps.com/esquireuk.cdnds.net/17/14/1600x1010/gallery-1491385818-la-dd-jacques-pepin-gordon-ramsay-20140715.jpg?resize=480:*",
  ];
  const phrases = [
    "My gran can do better... and she's dead!",
    "This fucking pigeon is so raw it can still fly!",
    "Why did the chicken cross the road? Because you didn't fucking cook it!",
    "You used so much oil the US is trying to invade the plate!",
    "Are we making a soup or trying to summon a demon?",
    "Look at that overcooked on the bottom-crispy on the top... looks like Ghandi's flip flop!",
    "This squid is so undercooked I can still hear it telling Spongebob to pisso off!",
    "There's more smoke in this kitchen than in Snoop Dogg's tour bus!",
    "This souffle has sunk so badly James Cameron wants to make a film about it!",
    "WHAT ARE YOU? :bread: :slight_smile: :bread: Yes! An **IDIOT SANDWICH**!",
    "Green burgers kill people!",
    "https://cdn.ebaumsworld.com/mediaFiles/picture/2234450/84624489.gif",
    "I wish you'd jump on the oven, would make my life easier!",

  ];

  // eslint-disable-next-line no-new
  new DspHook(msg, "Gordon Ramsay", shuffle(avatars)[0], {
    payload: { content: shuffle(phrases)[0] },
    once: true,
    reason: `+ramsay [${msg.author.tag}]`,
  });
};
module.exports = {
  init,
  pub: true,
  cmd: "fausto",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks", "manageWebhooks"],
  aliases: [],
};
