const Picto = require("../../utilities/Picto");
const axios = require('axios')


const init = async function(msg, programatic) {


  let P = { lngs: msg.lang, prefix: msg.prefix };
  if (
    PLX.autoHelper(["noargs", $t("helpkey", P)], {
      cmd: this.cmd,
      msg,
      opt: this.cat
    })
  )
    return;

  let hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  let hexColor = (msg.args[0].match(hexRegex))?.[1];
  let result;
  try {
    URL = "https://www.thecolorapi.com/id?hex=" + hexColor
    const pre_res = (await axios.get(URL, {
        headers: { 'Accept': 'json' },
        responseType: 'json'
    })).data ;
 
console.log({pre_res})
  //  const colors = require("name-this-color");
    result = hexColor
      ? [{title: pre_res.name.value, hex: hexColor, data: pre_res}]
      : [{ title: "Invalid Color (Defaults to Black)", hex: "#000000" }];
  } catch (e) {
    result = [{ title: "Invalid Color (Defaults to Black)", hex: "#000000" }];
  }

  let embed = new Embed(),
    Canvas = Picto.new(140, 140),
    ctx = Canvas.getContext("2d");

  if (result) {
    result = result[0];
    // let RGB = colors.rgb(result[0])
    let CMYK = result.data.cmyk
    let RGB = result.data.rgb

    embed
      .author(result.title, "https://img.icons8.com/dusk/250/paint-brush.png")
      .color(result.hex)
      .thumbnail("attachment://color.png")
      .description(`
      HEX \`${result.hex}\`
      RGB \`${RGB.r}\` \`${RGB.g}\` \`${RGB.b}\`  
      CMYK \`${CMYK.c}\` \`${CMYK.m}\` \`${CMYK.y}\` \`${CMYK.k}\`
      `);

    Picto.roundRect(ctx, 10, 10, 120, 120, 20,  hexColor);

    console.log(Canvas)
    if (programatic === true)
      return {
        embed,
        file: file(Canvas.toBuffer(), "color.png"),
        hex: result.hex,
        name: result.title
      };

    msg.channel.send({ embed }, file(Canvas.toBuffer(), "color.png"));
  } else {
    if (programatic === true) {
      Picto.roundRect(ctx, 10, 10, 120, 120, 20, "#000000");
      return {
        embed,
        file: file(Canvas.toBuffer(), "color.png"),
        hex: "#000000",
        name: "INVALID COLOR"
      };
    }
    msg.reply("`ERROR :: COLOR NOT FOUND`");
  }
};
module.exports = {
  init,
  pub: true,
  cmd: "color",
  perms: 3,
  cat: "util",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: []
};
