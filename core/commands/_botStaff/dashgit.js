const init = async (msg, args) => {
  const description = await exec(`git ${args.join(" ")}`, {
    cwd: "/home/pollux/polaris/dashboard",
  }).then(
    (res) => `${_emoji("yep")} \`${args.join(" ")}\` ${res.length ? "```nginx\n" : "```OK!"}${res.slice(0, 1900)}${"```"}`,
    (rej) => `${_emoji("nope")}**Oopsie Woopsie:** \`\`\`nginx\n${rej.message.slice(0, 1900)}\`\`\``,
  );

  msg.channel.send({ embed: { description } });
};

module.exports = {
  init,
  pub: false,
  cmd: "git",
  perms: 3,
  cat: "_botStaff",
  aliases: ["dgit", "dg", "dgt"],

};
