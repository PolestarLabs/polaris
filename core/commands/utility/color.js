// TRANSLATE[epic=translations] color

const axios = require("axios");
const Picto = require("../../utilities/Picto");

const init = async function (msg, programatic) {
  const hexRegex = /^#?([a-fA-F0-9]{3}([a-fA-F0-9]{3})?)$/;
  const hexColor = (msg.args[0].match(hexRegex))?.[1];
  let result;
  try {
    URL = `https://www.thecolorapi.com/id?hex=${hexColor}`;
    const pre_res = (await axios.get(URL, {
      headers: { Accept: "json" },
      responseType: "json",
    })).data;

    result = hexColor
      ? [{ title: pre_res.name.value, hex: hexColor, data: pre_res }]
      : [{
        title: "Invalid Color (Defaults to Black)",
        hex: "#000000",
        data: {
          cmyk: {
            c: 0, m: 0, y: 0, k: 100,
          },
          rgb: { r: 0, g: 0, b: 0 },
        },
      }];
  } catch (e) {
    result = [{
      title: "Invalid Color (Defaults to Black)",
      hex: "#000000",
      data: {
        cmyk: {
          c: 0, m: 0, y: 0, k: 100,
        },
        rgb: { r: 0, g: 0, b: 0 },
      },
    }];
  }

  const embed = {};
  const Canvas = Picto.new(140, 140);
  const ctx = Canvas.getContext("2d");

  if (result) {
    result = result[0];
    const CMYK = result.data.cmyk;
    const RGB = result.data.rgb;

    embed.author = { name: result.title, icon_url: "https://img.icons8.com/dusk/250/paint-brush.png" };
    embed.color = parseInt(result.hex, 16);
    embed.thumbnail = { url: "attachment://color.png" };
    embed.description = `      
      HEX \`#${result.hex}\`
      RGB \`${RGB.r}\` \`${RGB.g}\` \`${RGB.b}\`  
      CMYK \`${CMYK.c}\` \`${CMYK.m}\` \`${CMYK.y}\` \`${CMYK.k}\`
      `;

    Picto.roundRect(ctx, 10, 10, 120, 120, 20, `#${hexColor}`);
    if (programatic === true) {
      return {
        embed,
        file: file(await Canvas.toBuffer(), "color.png"),
        hex: result.hex,
        name: result.title,
      };
    }

    msg.channel.send({ embed }, { file: await Canvas.toBuffer(), name: "color.png" });
  } else {
    if (programatic === true) {
      Picto.roundRect(ctx, 10, 10, 120, 120, 20, "#000000");
      return {
        embed,
        file: file(await Canvas.toBuffer(), "color.png"),
        hex: "#000000",
        name: "INVALID COLOR",
      };
    }
    msg.reply("`ERROR :: COLOR NOT FOUND`");
  }
};
module.exports = {
  init,
  pub: true,
  cmd: "color",
  argsRequired: true,
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["colour"],
};
