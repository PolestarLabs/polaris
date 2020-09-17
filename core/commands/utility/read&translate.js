const TranslateBlob = require("../../structures/TranslationBlob");

const cmd = "read&translate";
const init = async (msg) => {
  const cmd_read = require("./read.js");
  let readContent = cmd_read.init(message, true);
  message.args.push("-");
  let lngs = TranslateBlob.grabLang(message);

  await Promise.all([lngs = await lngs, readContent = await readContent]);

  TranslateBlob.translate(readContent, lngs.langFrom, lngs.langTo).then((res) => {
    message.channel.send(res);
  });
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "util",
  aliases: ["r&t", "readtrans"],
};
