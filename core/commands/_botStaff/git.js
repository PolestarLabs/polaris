const init = async (msg, args) => {
  const regex = /^git[\w\d\s-"'./]+$/;

  if (!regex.test(`git ${args.join(" ")}`)) return ` ${_emoji("nope")}`;

  const description = await exec(`git ${args.join(" ")}`).then(
    (res) => `${_emoji("yep")} \`${args.join(" ")}\` ${res.length ? "```nginx\n" : "```OK!"}${res.slice(0, 1900)}${"```"}`,
    (rej) => `${_emoji("nope")}**Oopsie Woopsie:** \`\`\`nginx\n${rej.message.slice(0, 1900)}\`\`\``,
  );

  msg.channel.send({ embed: { description } });

  return require("./reload").init(msg, ["hard"]);
};

module.exports = {
  init,
  pub: false,
  cmd: "git",
  perms: 3,
  cat: "_botStaff",

};
