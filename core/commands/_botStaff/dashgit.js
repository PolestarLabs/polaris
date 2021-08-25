
const init = async (msg, args) => {
  let fail = false;

  const live = args[0] === 'live';
  if (live) args[0] = '';

  const description = await exec(`git ${args.join(" ")}`, { cwd: "/home/pollux/polaris/"+( live ?"LIVE":"DEV")+"/dashboard" }).then(
    (res) => `${_emoji("yep")} \`${args.join(" ")}\` ${res.length ? "```nginx\n" : "```OK!"}${res.slice(0, 1900)}${"```"}`,
    (rej) => ((fail = true), `${_emoji("nope")}**Oopsie Woopsie:** \`\`\`nginx\n${rej.message.slice(0, 1900)}\`\`\``),
  );

  await msg.channel.send({ embed: { description } });
  if (!fail) reload(msg);
};

function reload(msg) {
  return require("./reload").init(msg, ["hard"]);
}

module.exports = {
  init,
  pub: false,
  cmd: "git",
  perms: 3,
  cat: "_botStaff",

};
