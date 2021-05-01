// TODO[epic=Refactor] rewards - Plan this properly and rewrite the entire command.
// TRANSLATE[epic=translations] rewards

const YEAR = "2021";
const MONTHNAME = "March";
const MONTHCHECK = 2;
const STICKERS = [
  "porujuisu",
  "poruchai",
  "porupix",
  "porubarcode",
  "summerlux",
  "hallux18",
  "dedpollux",
  "polluxsanta",
  "pollux19",
  "pollux19_2",
  "jojollux",
];

const ECO = require("../../archetypes/Economy");

const last = STICKERS[STICKERS.length - 1];
const seclast = STICKERS[STICKERS.length - 2];
const thirdlast = STICKERS[STICKERS.length - 3];
const randompretwo = STICKERS[randomize(STICKERS.length - 2)];
const random = STICKERS[randomize(STICKERS.length - 1)];
const all = STICKERS;

const TIERS = {

  aluminium_leg: {
    legacy: true,
    immediate: 2,
    role: "364817390061748226",
    stickers: [],
    boxes: ["lootbox_C_O", "lootbox_C_O", "lootbox_C_O"],
    medals: ["patreon", "paypal"],
    flairs: [],
    title: "aluminium",
    SPH: 0,
    JDE: 5000,
  },

  iridium_leg: {
    legacy: true,
    immediate: 5,
    role: "364817384567078913",
    stickers: [last],
    boxes: ["lootbox_U_O", "lootbox_U_O", "lootbox_U_O", "lootbox_U_O", "lootbox_U_O"],
    medals: ["patreon", "paypal"],
    flairs: [],
    title: "iridium",
    SPH: 2,
    JDE: 10000,
  },

  palladium_leg: {
    legacy: true,
    immediate: 20,
    role: "364817388106940427",
    stickers: [last, seclast],
    boxes: ["lootbox_R_O", "lootbox_R_O", "lootbox_SR_O", "lootbox_SR_O", "lootbox_SR_O"],
    medals: ["patreon", "paypal"],
    flairs: [],
    title: "palladium",
    SPH: 8,
    JDE: 25000,
    customComm: "UNCLAIMED",

  },

  uranium_leg: {
    legacy: true,
    immediate: 50,
    role: "369149163453284352",
    stickers: [last, seclast, thirdlast, randompretwo],
    boxes: ["lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O"],
    medals: ["patreon", "paypal"],
    flairs: [],
    title: "uranium",
    SPH: 24,
    JDE: 100000,
    customComm: "UNCLAIMED",
    customMod: "UNCLAIMED",
  },

  astatine_leg: {
    legacy: true,
    immediate: 50,
    role: "467032160763772948",
    stickers: [last, seclast, thirdlast, randompretwo],
    boxes: ["lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O", "lootbox_UR_O"],
    medals: ["patreon", "paypal"],
    flairs: [],
    title: "astatine",
    SPH: 50,
    JDE: 100000,
    customComm: "UNCLAIMED",
    customMod: "UNCLAIMED",
  },

  // --------------------------------------------------------

  plastic: {
    role: "544620335115534349",
    stickers: [],
    boxes: [{ name: "lootbox_C_O", count: 1 }],
    medals: [],
    flairs: ["plastic"],
    title: "plastic",
    SPH: 0,
    JDE: 1000,
  },
  aluminium: {
    role: "532993206040920065",
    stickers: [random],
    boxes: [{ name: "lootbox_C_O", count: 5 }],
    medals: [],
    flairs: ["aluminium"],
    title: "aluminium",
    SPH: 1,
    immediate: 4,
    JDE: 2500,
  },
  iron: {
    role: "532987438700822529",
    stickers: [last],
    boxes: [{ name: "lootbox_U_O", count: 5 }],
    medals: [],
    flairs: ["iron"],
    title: "iron",
    SPH: 1,
    // ,spoilerino:true,
    immediate: 10,
    JDE: 5000,
  },
  carbon: {
    role: "467100086330195998",
    stickers: [last],
    boxes: [{ name: "lootbox_C_O", count: 5 }],
    medals: [],
    flairs: ["carbon"],
    // ,title: "carbon"
    title: "carbon",
    SPH: 5,
    immediate: 5,
    JDE: 5000,
  },
  lithium: {
    role: "467100151161290762",
    stickers: [last, seclast],
    boxes: [{ name: "lootbox_R_O", count: 5 }],
    medals: [],
    flairs: ["lithium"],
    title: "lithium",
    SPH: 8,
    immediate: 10,
    JDE: 10000,
    customBg: 1,
  },
  iridium: {
    role: "532987440831660072",
    stickers: [last, seclast],
    boxes: [{ name: "lootbox_R_O", count: 5 }],
    medals: [],
    flairs: ["iridium"],
    title: "iridium",
    SPH: 8,
    immediate: 10,
    customCommand: 1,
    JDE: 10000,
  },
  palladium: {
    role: "532987443117424640",
    stickers: [last, seclast, randompretwo],
    boxes: [{ name: "lootbox_SR_O", count: 5 }],
    medals: [],
    flairs: ["palladium"],
    title: "palladium",
    SPH: 15,
    JDE: 25000,
    immediate: 20,
    customCommand: 1,
    customBg: 1,

  },
  zircon: {
    role: "467100376777228298",
    stickers: [last, seclast, thirdlast, randompretwo],
    boxes: [{ name: "lootbox_SR_O", count: 8 }],
    medals: [],
    flairs: ["zircon"],
    title: "zircon",
    // ,title: "zircon"
    SPH: 25,
    JDE: 45000,
    customMod: "UNCLAIMED",
    immediate: 25,
    customCommand: 1,
    customBg: 1,
  },
  uranium: {
    role: "544620092478980111",
    stickers: [last, seclast, thirdlast, randompretwo, random],
    boxes: [{ name: "lootbox_UR_O", count: 8 }],
    medals: [],
    flairs: ["uranium"],
    title: "uranium",
    SPH: 50,
    immediate: 50,
    JDE: 100000,
    customCommand: 2,
    customBg: 1,
    customShop: 1,
  },
  xastatine: {
    role: "x467032160763772948",
    stickers: [all],
    boxes: [{ name: "lootbox_UR_O", count: 10 }],
    medals: [],
    flairs: ["astatine"],
    // ,title: "astatine"
    title: "xastatine",
    SPH: 50,
    JDE: 150000,
    immediate: 80,
    customCommand: 2,
    customBg: 1,
    customShop: 2,
    partner: true,
  },
  antimatter: {
    role: "466737702772015144",
    stickers: all,
    boxes: [{ name: "lootbox_UR_O", count: 15 }],
    medals: [],
    flairs: ["antimatter"],
    // ,title: "astatine"
    title: "antimatter",
    SPH: 100,
    immediate: 150,
    JDE: 250000,
    customCommand: 3,
    customBg: 2,
    customShop: 4,
    partner: true,
  },
  neutrino: {
    role: "532987435680923648",
    stickers: all,
    boxes: [{ name: "lootbox_UR_O", count: 25 }],
    medals: [],
    flairs: ["neutrino"],
    title: "neutrino",
    SPH: 500,
    immediate: 250,
    JDE: 1000000,
    customCommand: 3,
    customBg: 5,
    customShop: 4,
    partner: true,
  },

};

const queryGen = function queryGen(T, pushmo) {
  return {
    $set: { donator: T.title, rewardsMonth: MONTHCHECK },
    $addToSet: {
      "modules.stickerInventory": { $each: T.stickers },
      "modules.medalInventory": { $each: T.medals },
      "modules.flairsInventory": { $each: T.flairs },
    },
    // ,$push:    { "modules.inventory": {$each:T.boxes} }
    $inc: {
      // "modules.SPH": T.SPH
      // ,"modules.JDE":    T.JDE
      "counters.donateStreak.total": 1,
      [`counters.donateStreak.${T.title}`]: 1,
    },
  };
};

const cmd = "rewards";
const init = async function (message) {
  Member = message.member;

  if (message.guild.id !== "277391723322408960") {
    return message.reply("This command must be used at Pollux's Mansion server.");
  }

  // let aluminiumLegacy   = message.guild.roles.get('364817390061748226');
  // let iridiumLegacy     = message.guild.roles.get('364817384567078913');
  // let palladiumLegacy   = message.guild.roles.get('364817388106940427');
  // let uraniumLegacy     = message.guild.roles.get('369149163453284352');

  const useroles = message.member.roles;
  let tier = false;

  for (i in TIERS) {
    if (Member.hasRole(TIERS[i].role)) {
      tier = TIERS[i];
      tier.id = i;
    }
  }

  if (!tier) {
    return message.reply("You're not eligible for any rewards");
  }

  const userData = await DB.users.getFull({ id: message.author.id });

  // console.log({remo: userData.rewardsMonth, mocheck: MONTHCHECK})
  if (message.author.id !== "88120564400553984") {
    if (userData.rewardsMonth >= MONTHCHECK && userData.donator === tier.title) {
      return message.reply("You already claimed this month's rewards!");
    }
    if (!useroles.includes("421181998439333901")) {
      return message.reply("Your donation status is unconfirmed.");
    }
  }

  const d6mo = message.guild.roles.find((r) => r.id === "418887056262037505");
  const d5mo = message.guild.roles.find((r) => r.id === "418887120896393217");
  const d4mo = message.guild.roles.find((r) => r.id === "418887153662164996");
  const d3mo = message.guild.roles.find((r) => r.id === "418887192790958090");
  const d2mo = message.guild.roles.find((r) => r.id === "418887224642502668");
  const d1mo = message.guild.roles.find((r) => r.id === "418887258699988992");
  const poof = message.guild.roles.find((r) => r.id === "544641663348506673");

  const demodemo = [d6mo, d5mo, d4mo, d3mo, d2mo, d1mo, poof];

  const dasveritas = message.guild.roles.get("421181998439333901");

  const embed = new Embed();

  embed.title(`${MONTHNAME} Donators rewards`);
  embed.setColor("#32363c");

  let STATUS = "ok";

  for (i in demodemo) {
    const rolId = demodemo[i];
    const rolIdNext = demodemo[i - -1];

    if (!rolId) {
      break;
    }
    if (Member.hasRole(rolId.id)) {
      if (!rolIdNext) {
        STATUS = "expired";
        continue;
      }
      Member.addRole(rolIdNext.id, "Donation Rewards");
      Member.removeRole(rolId.id, "Donation Rewards");
      STATUS = 5 - i;
      break;
    }
  }

  if (STATUS === "expired") return message.reply("Your rewards period seems to have expired. Thanks for supporting up to this point~\n If you wish to continue supporting, consider donating on Patreon <https://pollux.gg/patreon>.");

  const T = tier;
  const pushmo = T.stickers;
  const stickernames = await DB.cosmetics.find({ id: { $in: pushmo }, type: "sticker" }, { name: 1, _id: 0 });
  const tiere = T.boxes[0].name.replace("lootbox_", "").replace("_O", "");
  embed.thumbnail(`https://pollux.gg/build/${T.title}.png`);
  embed.description(`
**${capitalize(T.title) + (T.legacy ? " Legacy" : "")}** ${STATUS === 0 ? "(Last Month)" : typeof STATUS === "number" ? `(${STATUS} Months Left)` : ""}

${_emoji("sapphire")} x ${T.SPH}
${_emoji("jade")} x ${miliarize(T.JDE)}
${_emoji("loot")} x ${T.boxes[0].count} ${_emoji(tiere)}

**STICKERS**
${stickernames.map((f) => f.name).join(" • ")}

`);
  embed.footer(message.author.tag, message.author.avatarURL);
  const ts = new Date();
  embed.timestamp(ts);
  // embed.setImage('https://pollux.gg/stickers/'+STICKERS[STICKERS.length-1]+'.png')

  const querystring = queryGen(T);

  const amts = [T.JDE, T.SPH];
  const curr = ["JDE", "SPH"];

  if (!userData.counters?.donateStreak.total) {
    // await userDB.set(message.author.id,{
    //   $inc:{"modules.SPH":T.immediate}
    // });
  }

  if (!(userData.counters?.donateStreak[T.title])) {
  // await DB.users.set(message.author.id,{
  //  $inc:{"modules.SPH":T.immediate}
  // });
    amts.push(T.immediate);
    curr.push("SPH");

    embed.description += `**Tier First-Time Sapphire Bonus**
${_emoji("sapphire")} x ${T.immediate}
${_emoji("yep")} **${capitalize(T.title)} Donator's Flair**
`;
    embed.description += "\n*Enable profile frame with `p!profile frame [on|off]`*\n";
  }

  await Promise.all([
    DB.users.set(message.author.id, querystring),
    userData.addItem(T.boxes[0].name, T.boxes[0].count),
    ECO.receive(message.author, amts, "dono_rewards", curr,{details:{tier: T.title, month: MONTHNAME, year: YEAR}}),
  ]);

  embed.description += `📶 **Streak:** ${(userData.counters?.donateStreak.total || 0) + 1} (${(userData.counters?.donateStreak[T.title] || 0) + 1} as ${[T.title]})`;

  message.channel.send({ content: `${_emoji("yep")} All set! Rewards added!`, embed });
};
module.exports = {
  init,
  pub: true,
  //TODO[epic=Unfinished Commands] Needs to be redone before first month after release;
  disabled: true, 
  cmd: "rewards",
  perms: 3,
  cat: "misc",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  TIERS,
  queryGen,
};
