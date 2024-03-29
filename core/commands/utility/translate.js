const TranslateBlob = require("../../structures/TranslationBlob");

const cmd = "translate";

const init = async function (msg) {
  const pre = await TranslateBlob.grabLang(msg);
  let ttt = pre.textToTrans;
  let newmes;
  if (msg.args.length === 0 || [msg.args[0], msg.args[1], msg.args[2]].some((a) => a === "^")) {
    const messageGrab = await PLX.getPreviousMessage(msg);
    if (messageGrab) ttt = messageGrab.content;
  }
  const messagebyID = [msg.args[0], msg.args[1], msg.args[2]].filter((arg) => arg && !isNaN(arg) && arg.length > 10);
  
  if (msg.referencedMessage) ttt = msg.referencedMessage.content;
  
  if (messagebyID.length > 0) {
    newmes = await PLX.getPreviousMessage(msg, messagebyID[0]);
    if (newmes) ttt = newmes.content;
  }

  const result = await TranslateBlob.translate(ttt, pre.langFrom, pre.langTo);
  if (messagebyID.length > 0 && newmes) {
    result.embed.fields.push({ name: "\u200b", value: `<@${newmes.author.id}> @ <#${newmes.channel.id}>` });
    result.embed.timestamp = new Date(newmes.createdAt);
    result.embed.footer = { icon_url: newmes.author.avatarURL, text: "\u200b" };
  }
  msg.channel.send(result);
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "utility",
};
