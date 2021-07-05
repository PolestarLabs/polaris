// TRANSLATE[epic=translations] read

const Vision = require("@google-cloud/vision/");

const cmd = "read";
const init = async function (message, cmdPiece = false) {
  return new Promise(async (resolve, reject) => {
    const url = `https://proxy.pollux.workers.dev/?pollux_url=${encodeURIComponent(message.args[0])}`;

    img2base64(url).then(async (img) => {
      if (img) resolve(vere(img.b64, message, cmdPiece)).catch(err => null);
      else reject("NO IMAGE");

    }).catch(async err => {

      let nwurl = await PLX.getChannelImg(message.referencedMessage||message);
      if (nwurl?.includes(".discord")) nwurl = decodeURIComponent(nwurl.replace("https://proxy.pollux.workers.dev/?pollux_url=", ""));
      if (!nwurl) return message.channel.send("`INVALID IMAGE URL`");
      return img2base64(nwurl).then(img => {
        resolve(vere(img.b64, message, cmdPiece))
      }).catch(err => {
        message.channel.send("`INVALID IMAGE URL (2)`");
      });

    });
  });
};

async function vere(base64, message, cmdPiece) {
  try {
    const vision = new Vision.ImageAnnotatorClient({
      projectId: "pollux-172700",
      keyFilename: "./pollux-172700-4fc2e6c49940.json",
    });
    const results = await vision.annotateImage({
      image: {
        content: base64,
      },
      features: [
        {
          type: "TEXT_DETECTION",
        }],
    }).catch((err) => {
      message.channel.send("`Error::VisionAPI Unreachable`");
      console.error("ERROR:", err);
    });

    const detections = results[0].textAnnotations[0].description;
    if (cmdPiece === true) return detections;

    const lang = results[0].textAnnotations[0].locale;

    const TranslateBlob = require("../../structures/TranslationBlob");

    const embed = new Embed();
    embed.title("Read Results");
    embed.setColor("#6167b8");
    embed.description(`*React with a flag within 30 seconds to translate it.*  \`\`\`${detections}\`\`\``);
    L = TranslateBlob.flagFromLang(lang);
    embed.field("Detected Language", `${L.flag} ${L.name}`);
    message.channel.send({ embed }).then(async (mes) => {

      //FUTURE[epic=anyone] (Low Priority) - GTranslate Reaction prompts user to type language
      const reas = await mes.awaitReactions({ maxMatches: 1, time: 30000 }).catch(() => []);
      if (reas.length === 0) return;
      const Rea = reas[0];
      const LF = TranslateBlob.LANGFLAGS;
      const rLang = Object.keys(LF).find((x) => LF[x] === Rea.emoji.name);
      const translated = await TranslateBlob.translate(detections, lang, rLang, true);
      embed.description = `\`\`\`${translated}\`\`\`(translated to ${TranslateBlob.LANGNAMES[rLang]})`;
      mes.edit({ embed });
    });
  } catch (err) {
    console.error(err);
    message.channel.send("`Error::Could not process text from image`");
  }
}

module.exports = {
  vere,
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "utility",
  aliases: ["ocr", "eye"],
};
