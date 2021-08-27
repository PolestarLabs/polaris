/* eslint-disable func-names */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
// TRANSLATE[epic=translations] rpgen

const axios = require("axios");

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const RPGen = require("../../../resources/rpgen");

  const hex = `#${(randomize(0, 1677720) * 10 + 2).toString(16).padStart(6, "A")}`;

  const { data } = await axios.get(`https://www.thecolorapi.com/id?hex=${hex.replace("#", "")}`, {
    headers: { Accept: "json" },
    responseType: "json",
  });
  const color = hex
    ? { title: data.name.value, hex, data }
    : { title: "Invalid Color (Defaults to Black)", hex: "#000000" };

  if (!msg.args[0] || msg.args[0]?.toLowerCase() === "npc") {
    const oneNPC = RPGen.NPCs.generate();
    const fs = require("fs");
    fs.readdir("../../../../../DEV/bot/resources/rpgen/pics/", (err, files) => {
      const archetypes = {
        dragonborn: 4,
        dwarf: 2,
        gnome: 2,
        "half-elf": 5,
        halfling: 1,
        "half-orc": 6,
        orc: 7,
        tiefling: 3,
        elf: 1,
        human: 0,
      };
      files = files.filter((x) => x.includes(archetypes[oneNPC.race]));
      const rand = randomize(0, files.length - 1);
      const filepath = `${appRoot}/resources/rpgen/pics/${files[rand]}`;
      const file = fs.readFileSync(filepath);

      if (oneNPC.race === "dragonborn") oneNPC.race = "Beast";
      const embed = {};
      embed.title = capitalize(oneNPC.name);
      embed.fields = [];
      embed.fields.push({
        name: "Race",
        value: capitalize(oneNPC.race),
        inline: true,
      });
      embed.fields.push({
        name: "Feature Color",
        value: color.title,
        inline: true,
      });
      embed.fields.push({
        name: "Traits",
        value: `\` • ${oneNPC.traits.join("`\n` • ")}\``,
        inline: true,
      });
      embed.fields.push({
        name: "Flaws",
        value: `\` • ${oneNPC.flaws.join("`\n` • ")}\``,
        inline: true,
      });
      embed.color = parseInt(color.hex.replace(/^#/, ""), 16);
      embed.thumbnail = { url: "attachment://ava.gif" };
      msg.channel.send({ embed }, { file, name: "ava.gif" });
    });
    return;
  }

  if ([ "plot", "hook", "story" ].includes(msg.args[0]?.toLowerCase())) {
    let flavor;
    if (!msg.args[1] || msg.args[1] === "player") {
      flavor = RPGen.Storyhooks.pcRelated();
    } else if (msg.args[1] === "npc") {
      flavor = RPGen.Storyhooks.npcActs();
    } else {
      flavor = RPGen.Storyhooks.pcRelated();
    }
    const embed = {};
    embed.color = parseInt(hex.replace(/^#/, ""), 16);
    embed.description = flavor;
    return msg.channel.send({ embed });
  }
};
module.exports = {
  init,
  pub: false,
  argsRequired: true,
  cmd: "rpgen",
  perms: 3,
  cat: "roleplay",
  botPerms: [ "attachFiles", "embedLinks" ],
  aliases: ["rpgenerator"],
};
