const init = async (msg, args) => {
  if (!msg.channel.nsfw) return $t("responses.errors.not-a-NSFW-channel", { lngs: msg.lang });
  delete require.cache[require.resolve("../anime/safebooru")];
  return require("../anime/safebooru").init(msg, args, {
    title: " ", color: 0xff4c45, nsfw: true, tags: true,
  });
};
module.exports = {
  init,
  pub: true,
  cmd: "lewd",
  perms: 3,
  cat: "nsfw",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["rule34", "hentai"],
};
