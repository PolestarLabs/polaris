module.exports = {
  init: "Marketplace",
  pub: true,
  cmd: "marketplace",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: ["market", "mkt"],
  argsRequired: true,
  subs: ["list", "post", "delete"],
};
