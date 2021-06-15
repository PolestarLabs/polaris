module.exports = {
  pub: true,
  init: () => { },
  cmd: "marketplace",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: ["market", "mkt"],
  argsRequired: true,
  subs: ["list", "post", "delete"],
};

// LINK[seq=999] Trello = marketplace https://trello.com/c/jp0IIj2S
