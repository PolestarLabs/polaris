const { Venture, Journey, renderMap } = require("../../archetypes/Venture.js");
const ReactionMenu = require("../../structures/ReactionMenu");

const init = async function (msg) {
  0;

  const LOCATIONS = [
    {
      name: "City 0",
      id: "city0",
      type: "city",
      aliases: ["city", "city 0"],
      emoji: "🏙",
      rank: 0,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004836985110538/venture_field.gif",
      // replaces: ["city0"],
    },
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
      name: "Field 1",
      id: "field1",
      type: "field",
      aliases: ["field", "field 1"],
      emoji: "🏞️",
      rank: 1,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004836985110538/venture_field.gif",
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
      name: "Field 2",
      id: "field2",
      type: "field",
      aliases: ["field", "field 2"],
      emoji: "🏞️",
      rank: 2,
      image: "https://cdn.discordapp.com/attachments/488142034776096772/689004836985110538/venture_field.gif",
      replaces: ["field1", "desert1"],
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
  const tally = await msg.channel.send({ embed: tallyEmbed });

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
  const durationChoice = res_DUR.res.index;

  //-----------------------------------------------
  const selectedTime = durationChoice === 0 ? 1
    : durationChoice === 1 ? 5
      : durationChoice === 2 ? 10 : 0;
  //-----------------------------------------------
  delete embed.title;
  embed.description = TIME_OPTS[durationChoice];

  tallyEmbed.fields.push({ name: "Duration", value: embed.description, inline: true });
  tally.edit({ embed: tallyEmbed });

  res_DUR.menuMessage.delete();

  if (!selectedTime) return "ERROR";

  const LOCATIONS_B = await DB.advLocations.traceRoutes("LSGC", durationChoice);

  const locationEmbed = {
    embed: {
      color: numColor(_UI.colors.blue),
      description: "**Select location:**",
      fields: LOCATIONS_B.map((l) => ({ inline: !0, name: `\`${l.type.toUpperCase()}\``, value: `${_emoji(l.type)} **${l.name}** \`\`\` ${l._id}\`\`\`\n` })),

    },
  };

  locationEmbed.embed.fields.push({ name: "\u200b", value: "*You can also type the ID of the desired location. By default you will be sent to the highest level available.*" });

  // TODO[epic=flicky] Assign emojis to options properly
  const res_LOC = await Screen(locationEmbed, ["🥩", "🍠", "🥟", "🥠", "🥡"]);
  //-----------------------------------------------
  const selectedLocation = LOCATIONS_B[res_LOC.res.index];
  //-----------------------------------------------
  delete embed.title;
  embed.description = `${selectedLocation.emoji} **${selectedLocation.name}**`;
  tallyEmbed.fields.push({ name: "Location", value: embed.description, inline: true });

  // TODO[epic=flicky] adventure Create adventure and save to DB

  const ventureImage = renderMap(selectedLocation._id);

  tallyEmbed.image = { url: "attachment://venture.png" };
  tally.edit({ embed: tallyEmbed });

  res_LOC.menuMessage.delete();

  //const userData = await DB.users.get(msg.author.id);
  const userData = PLX.getOrCreateUser(msg.author);
  userData.supplied_rubines = selectedInsurance;

  const playersHere = await DB.advJourneys.find({ location: selectedLocation._id, end: { $gt: Date.now() } }).lean();
  const Adventure = new Venture(userData, selectedTime, selectedLocation, playersHere);
  const journeyLog = new Journey(Adventure);

  msg.channel.send(`\`\`\`json\n${JSON.stringify({ Adventure })}\`\`\``).catch((err) => null);
  msg.channel.send(`\`\`\`json\n${JSON.stringify({ journeyLog })}\`\`\``).catch((err) => null);

  Adventure.location = selectedLocation._id;
  DB.advJourneys.new(msg.author.id, Adventure, Adventure.journey);

  async function Screen(message, choices) {
    const menu = await msg.channel.send(message);
    let res = await ReactionMenu(menu, msg, choices, { time: 35000 });
    if (!res) res = ReactionMenu.choice(choices[0], 0);
    return { res, menuMessage: menu };
  }
};

module.exports = {
  init,
  pub: true,
  //TODO[epic=Unfinished Commands] Needs venture processor and 3rd island;
  disabled: true,
  cmd: "adventure",
  perms: 3,
  cat: "pollux",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["venture", "explore", "adv"],
};
