const { Venture, Journey } = require("../../archetypes/Venture.js");
const ReactionMenu = require("../../structures/ReactionMenu");

const init = async function (msg) {
  0;

  const LOCATIONS = [
    {
      name: "Desert 1",
      id: "desert1",
      type: "desert",
      aliases: ["desert 1"],
      emoji: "🏜️",
      rank: 1,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004833100922913/venture_desert.gif",

    },
    {
      name: "Mountain 1",
      id: "mountain1",
      type: "mountain",
      aliases: ["mountain 1"],
      emoji: "🏔",
      rank: 1,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004826922844176/venture_snow.gif",

    },
    {
      name: "Field 1",
      id: "field1",
      type: "field",
      aliases: ["field", "field 1"],
      emoji: "🏞️",
      rank: 1,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004836985110538/venture_field.gif",
    },
    {
      name: "Field 2",
      id: "field2",
      type: "field",
      aliases: ["field", "field 2"],
      emoji: "🏞️",
      rank: 2,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004836985110538/venture_field.gif",
      replaces: ["field1"],
    },
  ].filter((loc, i, a) => !a.map((y) => (y.replaces || []).join(" ")).join(" ").includes(loc.id));

  // ----------------------------------------------------------
  const TIMES = ["<:TIME1:688827284077150267>", "<:TIME2:688827283624296615>", "<:TIME3:688827284609957945>"];
  const TIME_OPTS = [
    `${TIMES[0]} **Fast:** 1 Hour`,
    `${TIMES[1]} **Recon:** 5 Hours`,
    `${TIMES[2]} **Odyssey:** 10 hours`,
  ];
  //----------------------------------------------------------
  const INSURANCES = ["<:INSURANCE1:688976924466610176>", "<:INSURANCE2:688976923954642975>", "<:INSURANCE3:688976924915269663>"];
  const INSURANCE_VALS = [500, 1500, 5000];
  const INSURANCE_OPTS = [
    `${INSURANCES[0]} **Hitchhiker's guide to adventure:**
            Some travel on a budget, you got no budget at all.
                Cost: ${_emoji("RBN")} **500** Rubines`,
    `${INSURANCES[1]} **Better safe than sorry:**
            Nothing is so bad it can't get worse, so better not risk it.
                Cost: ${_emoji("RBN")} **1500** Rubines`,
    `${INSURANCES[2]} **Jet-setter extravaganza:**
            Never lose the best of life because of such trivial things like money.
                Cost: ${_emoji("RBN")} **5000** Rubines`,
  ];
  //----------------------------------------------------------

  const embed = {};
  const tallyEmbed = { fields: [] };
  const locationEmbed = {
    embed: {
      color: 0x6080F0,
      description: "**Select location:**",
      fields: LOCATIONS.map((l) => ({ inline: !0, name: `\`${l.type.toUpperCase()}\``, value: `${l.emoji} **${l.name}** \`\`\` ${l.aliases}\`\`\`\n` })),

    },
  };

  const tally = await msg.channel.send({ embed: tallyEmbed });

  const res_LOC = await Screen(locationEmbed, LOCATIONS.map((x) => x.emoji));
  //-----------------------------------------------
  const selectedLocation = LOCATIONS[res_LOC.res.index];
  //-----------------------------------------------
  delete embed.title;
  embed.description = `${selectedLocation.emoji} **${selectedLocation.name}**`;
  tallyEmbed.fields.push({ name: "Location", value: embed.description, inline: true });
  tallyEmbed.image = { url: selectedLocation.image };
  tally.edit({ embed: tallyEmbed });

  res_LOC.menuMessage.delete();

  embed.title = "**Select insurance:**";
  embed.description = `*You never know what you're going to find on an adventure, this insurance is a spare cash you will use for all your travel expenses.*
    ${INSURANCE_OPTS.join("\n")}`;
  const res_INS = await Screen({ embed }, INSURANCES);
  //-----------------------------------------------
  const selectedInsurance = INSURANCE_VALS[res_INS.res.index];
  //-----------------------------------------------
  delete embed.title;
  embed.description = INSURANCE_OPTS[res_INS.res.index];

  tallyEmbed.fields.push({ name: "Insurance", value: embed.description, inline: false });
  tally.edit({ embed: tallyEmbed });

  res_INS.menuMessage.delete();

  embed.title = "**Select duration:**";
  embed.description = `How long will you slide?
    ${TIME_OPTS.join("\n")}`;
  const res_DUR = await Screen({ embed }, TIMES);
  //-----------------------------------------------
  const selectedTime = res_DUR.res.index === 0 ? 1
    : res_DUR.res.index === 1 ? 5
      : res_DUR.res.index === 2 ? 10 : 0;
  //-----------------------------------------------
  delete embed.title;
  embed.description = TIME_OPTS[res_DUR.res.index];

  tallyEmbed.fields.push({ name: "Duration", value: embed.description, inline: true });
  tally.edit({ embed: tallyEmbed });

  res_DUR.menuMessage.delete();

  if (!selectedTime) return "ERROR";

  const userData = await DB.users.get(msg.author.id);
  userData.supplied_rubines = selectedInsurance;

  const Adventure = new Venture(userData, selectedTime, "desert");
  const journeyLog = new Journey(Adventure);

  msg.channel.send(`\`\`\`json\n${JSON.stringify({ Adventure })}\`\`\``);
  msg.channel.send(`\`\`\`json\n${JSON.stringify({ journeyLog })}\`\`\``);

  async function Screen(message, choices) {
    const menu = await msg.channel.send(message);
    let res = await ReactionMenu(menu, msg, choices, { time: 5000 });
    if (!res) res = new ReactionMenu.choice(choices[0], 0);
    return { res, menuMessage: menu };
  }
};

module.exports = {
  init,
  pub: true,
  cmd: "adventure",
  perms: 3,
  cat: "pollux",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["venture", "explore"],
};
