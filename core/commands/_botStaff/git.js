const init = async (msg, args) => {
  const regex = /^git[\w\d\s-"'./]+$/;

  if (!regex.test(`git ${args.join(" ")}`)) return ` ${_emoji("nope")}`;

  exec(`git ${args.join(" ")}`, (error, stdout, stderr) => {
    const description = error
      ? `${_emoji("nope")}**Oopsie Woopsie:** \`\`\`nginx\n${stderr.slice(0, 1900)}\`\`\``
      : `${_emoji("yep")} \`${args.join(" ")}\` ${stdout.length ? "```nginx\n" : "```OK!"}${stdout.slice(0, 1900)}${"```"}`;

    msg.channel.send({ embed: { description } });
  });

  return require("./reload").init(msg, ["hard"]);
};

module.exports = {
  init,
  pub: false,
  cmd: "git",
  perms: 3,
  cat: "_botStaff",

};
