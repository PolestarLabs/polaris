const init = async function (msg, args) {
  PLX.registerCommands(true);
  translateEngineStart();
  if (args[0] == "hard") {
    Object.keys(require.cache).forEach((R) => {
      if (R.includes("node_modules")) return;
      if (R.includes("bot/pollux.js")) return;
      if (R.includes("core/database")) return;
      if (R.includes("Microserver")) return;

      delete require.cache[R];
      try {
        require(R);
      } catch (e) {
        console.log(R.red);
        console.error(e);
      }
    });
  }
  msg.addReaction(_emoji("yep").reaction);
};
module.exports = {
  init,
  pub: false,
  cmd: "reload",
  perms: 3,
  cat: "_botStaff",
  aliases: ["rld"],
};