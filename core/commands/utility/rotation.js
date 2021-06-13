//TODO[epic=anyone] Deprecate Request AND Cheerio

const request = require("request");
// const gear = require("../../utilities/Gearbox.js");
const cheerio = require("cheerio");
// const locale = require('../../../utils/i18node');
// const $t = locale.getT();
const { riot } = require(`${appRoot}/config.json`);

const cmd = "rotation";

const init = async function (message) {
  const LANG = message.lang;

  const nope = $t("CMD.noDM", {
    lngs: LANG,
  });
  const gener = $t("builds.genProf", {
    lngs: LANG,
  });
  const inf = $t("dict.infinite", {
    lngs: LANG,
  });

  // -------MAGIC----------------
  const helpkey = $t("helpkey", {
    lngs: message.lang,
  });

  const args = message.content.split(/\s+/).slice(1).join(" ").toLowerCase();
  const rotation = [];
  const secondRotation = [];
  let emb = new Embed();

  if (args === "league of legends" || args === "league" || args === "lol") lol();
  else if (args === "heroes of the storm" || args === "hots" || args === "hos" || args === "heroes") hots();
  else if (args === "smite") return message.reply("Smite does not provide rotations anymore.");
  else if (args === "help" || args === helpkey) return PLX.usage(cmd, message, this.cat);
  else return PLX.usage(cmd, message, this.cat);

  function hots() {
    const rotation = [[]];
    request("http://heroesofthestorm.gamepedia.com/Free_rotation", (error, response, html) => {
      if (!error && response.statusCode === 200) {
        const $ = cheerio.load(html);
        $(".hero-tile").each(function (i, element) {
          const a = $(this).children()[0]; // [0];
          if (i < 10) {
            rotation[0].push(a.attribs.title);
          } else {
            rotation.push(a.attribs.title);
          }
        });

        emb.setColor("#272791");
        emb.footer(`© 2015 - ${(new Date()).getYear() + 1900} | Blizzard Entertainment, Inc.`, "https://seeklogo.com/images/B/blizzard-entertainment-logo-04FA6ACC79-seeklogo.com.png");
        emb.author("Heroes of the Storm", "http://www.mpcgaming.com/img/hotsicon.png", "http://heroesofthestorm.gamepedia.com/");
        emb.thumbnail("http://www.mpcgaming.com/img/hotsicon.png");
        emb.description = "Weekly Hero Rotation";

        emb.addField("All Levels", `
${_emoji(rotation[0][0].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][0]}
${_emoji(rotation[0][1].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][1]}
${_emoji(rotation[0][2].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][2]}
${_emoji(rotation[0][3].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][3]}
${_emoji(rotation[0][4].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][4]}
`, true);
        emb.addField("\u200b", `
${_emoji(rotation[0][5].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][5]}
${_emoji(rotation[0][6].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][6]}
${_emoji(rotation[0][7].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][7]}
${_emoji(rotation[0][8].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][8]}
${_emoji(rotation[0][9].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[0][9]}
`, true);
        emb.addField("Level 5", `${_emoji(rotation[1].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[1]}`, true);
        emb.addField("Level 7", `${_emoji(rotation[2].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[2]}`, true);
        emb.addField("Level 12", `${_emoji(rotation[3].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[3]}`, true);
        emb.addField("Level 15", `${_emoji(rotation[4].replace(/\./g, "").replace(" ", "").toLowerCase())}${rotation[4]}`, true);
        message.channel.send({
          embed: emb,
        });
      }
    });
  }

  async function lol() {
    request(`https://na1.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${riot}`, (e, r) => {
      const body = JSON.parse(r.body).freeChampionIds;
      const body4new = JSON.parse(r.body).freeChampionIdsForNewPlayers;
      const maxnewlv = JSON.parse(r.body).maxNewPlayerLevel;

      const obj = require("@polestar/constants/league.json").data;
      const allchamps = Object.keys(obj).map((key) => obj[key]).filter((key) => body.includes(key.id));

      const allchampsNew = Object.keys(obj).map((key) => obj[key]).filter((key) => body4new.includes(key.id));

      allchamps.forEach((champ) => {
        const c = champ;
        const role = c ? c.tags ? c.tags[0] : "Specialist" : "Specialist";
        rotation.push([_emoji(role.toLowerCase()), champ.name]);
      });

      allchampsNew.forEach((champ) => {
        const c = champ;
        const role = c ? c.tags ? c.tags[0] : "Specialist" : "Specialist";
        secondRotation.push([_emoji(role.toLowerCase()), champ.name]);
      });

      emb = new Embed();
      emb.setColor("#064955");

      emb.footer(`© 2006 - ${(new Date()).getYear() + 1900} | Riot Games, Inc.`, "https://www.riotgames.com/darkroom/original/06fc475276478d31c559355fa475888c:af22b5d4c9014d23b550ea646eb9dcaf/riot-logo-fist-only.png");
      emb.author("League of Legends", "https://vignette1.wikia.nocookie.net/leagueoflegends/images/1/12/League_of_Legends_Icon.png/revision/latest?cb=20150402234343", "http://leagueoflegends.wikia.com/wiki/League_of_Legends_Wiki");
      emb.thumbnail("https://vignette1.wikia.nocookie.net/leagueoflegends/images/1/12/League_of_Legends_Icon.png/revision/latest?cb=20150402234343");
      emb.description = "Weekly Champion Rotation";

      emb.addField("Regular Rotation", `
${rotation[0][0]}  ${rotation[0][1]}
${rotation[1][0]}  ${rotation[1][1]}
${rotation[2][0]}  ${rotation[2][1]}
${rotation[3][0]}  ${rotation[3][1]}
${rotation[4][0]}  ${rotation[4][1]}
${rotation[5][0]}  ${rotation[5][1]}
${rotation[6][0]}  ${rotation[6][1]}
`, true);
      emb.addField("\u200b", `
${rotation[7][0]}  ${rotation[7][1]}
${rotation[8][0]}  ${rotation[8][1]}
${rotation[9][0]}  ${rotation[9][1]}
${rotation[10][0]}  ${rotation[10][1]}
${rotation[11][0]}  ${rotation[11][1]}
${rotation[12][0]}  ${rotation[12][1]}
${rotation[13][0]}  ${rotation[13][1]}
`, true);

      emb.addField(`Rotation for New Players (${maxnewlv})`, `
${secondRotation[0][0]}  ${secondRotation[0][1]}
${secondRotation[1][0]}  ${secondRotation[1][1]}
${secondRotation[2][0]}  ${secondRotation[2][1]}
${secondRotation[3][0]}  ${secondRotation[3][1]}
${secondRotation[4][0]}  ${secondRotation[4][1]}

`, true);
      emb.addField("\u200b", `
${secondRotation[5][0]}  ${secondRotation[5][1]}
${secondRotation[6][0]}  ${secondRotation[6][1]}
${secondRotation[7][0]}  ${secondRotation[7][1]}
${secondRotation[8][0]}  ${secondRotation[8][1]}
${secondRotation[9][0]}  ${secondRotation[9][1]}

`, true);
      message.channel.send({
        embed: emb,
      });
    });
  }
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "utility",
  argsRequired: true,
};
