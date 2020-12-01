const { performance } = require("perf_hooks");

const clean = (text) => {
  const output = (typeof text === "string" ? text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(PLX.token, "[REDACTED]")
    .replace(DB.native.host, "[REDACTED]")
    .replace(DB.native.name, "[REDACTED]")
    .replace(DB.native.port, "[REDACTED]")
    .replace(DB.native.pass, "[REDACTED]")
    .replace(/[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g, "[OWO WHAT IS THIS]")
    : JSON.stringify(text, null, 2)).slice(0, 1800);
  return output;
};

const init = async (msg) => {
  if (msg.author.id !== "88120564400553984") {
    if (msg.content.includes("fs")) return null;
    if (msg.content.includes("json")) return null;
    if (msg.content.includes("../../")) return null;
    // if (msg.content.includes("require")) return null;
  }

  let depthParam = 0;
  if (msg.args[0] === "-depth") {
    depthParam = parseInt(msg.args[1]);
    msg.args.shift();
    msg.args.shift();
  }

  // eslint-disable-next-line max-len
  const invisibar = "\u200b\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u200b";
  const code = msg.args.join(" ");

  if (code.includes("child_process") && msg.author.id !== "88120564400553984") return null;
  if (code.includes("exec") && msg.author.id !== "88120564400553984") return null;
  if (code.includes(".leave(") && msg.author.id !== "88120564400553984") return null;
  if (code.includes(".drop") && msg.author.id !== "88120564400553984") return null;
  if (code.includes("process.") && msg.author.id !== "88120564400553984") return null;

  if (!code) return null;

  if (code === "process.exit()") {
    const output = `<:maybe:476214608592633866>${invisibar}\`\`\`js\n${clean("Terminating Node Process...")}\`\`\``;
    const embed = { description: output };
    msg.channel.createMessage({ embed }).then(async () => {
      await wait(1);
      process.exit(1);
    });
  }

  let runtime = performance.now();
  const runtimeOutput = (rtm) => (rtm * 1000 < 1000 ? `${Math.floor(rtm * 1000)}μs `
    : rtm < 1000 ? `${rtm.toFixed(2)}ms ` : `${(rtm / 1000).toFixed(2)}s `);
  try {
    let evaled = await eval(code); // eslint-disable-line no-eval
    runtime = performance.now() - runtime;
    if (typeof evaled !== "string") {
      evaled = require("util").inspect(evaled, {
        depth: 0 + depthParam,
      });
    }
    const output = `<:yep:339398829050953728> ⏱ ${runtimeOutput(runtime)}${invisibar}\`\`\`js\n${clean(evaled)}\`\`\``;
    const embed = { description: output };
    embed.color = 0x2bce64;
    return msg.channel.createMessage({ embed });
  } catch (e) {
    runtime = performance.now() - runtime;
    const output = `<:nope:339398829088571402> ⏱ ${runtimeOutput(runtime)}\n**\`\`\`js\n${e.message || e}\`\`\`**\n*\`\`\`c\n${clean(e.stack || [])
      .split("\n")[1]}\`\`\`*`;
    const embed =  { description: output };
    embed.color = 0xe03b3b;
    embed.footer = { text: "Check Logs for detailed Error stack" };
    console.error(e);
    return msg.channel.createMessage({ embed });
  }
};

module.exports = {
  init,
  aliases: ["ev", "ee"],
  cat: "dev",
};
