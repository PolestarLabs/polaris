const { performance } = require("perf_hooks");
const Eris = require('eris');
const clean = (text) => {
  const output = (typeof text === "string" ? text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(PLX._token, "[REDACTED]")
    .replace("PLX._token", "[REDACTED]")
    .replace(DB.native.host, "[REDACTED]")
    .replace(DB.native.name, "[REDACTED]")
    .replace(DB.native.port, "[REDACTED]")
    .replace(DB.native.pass, "[REDACTED]")
    .replace(/[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g, "[OWO WHAT IS THIS]")
    : JSON.stringify(text, null, 2));

  if (output.length > 1200) {
    let partial = output.slice(0, 1200);
    let full =  output;
    return {full,partial};    
  }
  return output;
};

const devs = ["88120564400553984", "253600545972027394", "124989722668957700"];

const init = async (msg) => {
  if (!devs.includes(msg.author.id)) {
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
  let code = msg.args.join(" ");

  if (code.includes("child_process") && !devs.includes(msg.author.id)) return null;
  if (code.includes("exec") && !devs.includes(msg.author.id)) return null;
  if (code.includes(".leave(") && !devs.includes(msg.author.id)) return null;
  if (code.includes(".drop") && !devs.includes(msg.author.id)) return null;
  if (code.includes("process.") && !devs.includes(msg.author.id)) return null;

  if (!code) return null;

  if (code === "process.exit()") {
    const output = `<:maybe:476214608592633866>${invisibar}\`\`\`js\n${clean("Terminating Node Process...")}\`\`\``;
    const embed = { description: output };
    await msg.channel.createMessage({ embed }).then(async () => {
      await wait(1);
      process.exit(1);
    });
  }

  // allow top-level await
  if (/await/i.test(code)) 
    code = `(async() => {${/return/i.test(code) ? code : addReturn(code)}})()`;

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
    const out = clean(evaled);
    const output = `<:yep:339398829050953728> ⏱ ${runtimeOutput(runtime)}${invisibar}\`\`\`js\n${out.full ? "// Check output file" : out}\`\`\``;
    const embed = { description: output };
    embed.color = 0x2bce64;
    return msg.channel.createMessage({ embed }, (out.full ? {name: "output.js", file: out.full  } : undefined) );
  } catch (e) {
    runtime = performance.now() - runtime;
    const out = clean(e.stack || []);
    const output = `<:nope:339398829088571402> ⏱ ${runtimeOutput(runtime)}\n**\`\`\`js\n${e.message || e}\`\`\`**\n*\`\`\`c\n${ 
      (out.full ? "// Check output file" : out).split("\n")[1]}\`\`\`*`;
    const embed =  { description: output };
    embed.color = 0xe03b3b;
    embed.footer = { text: "Check Logs for detailed Error stack" };
    console.error(e);
    return msg.channel.createMessage({ embed }, (out.full ? {name: "error.js", file: out.full  } : undefined) );
  }
};
 
/**
 * Attempts to place a return in the correct spot.
 * 
 * @param {string} code
 * @returns {string} code with return
 */
function addReturn(code) {
  const lastSemiColonWithContentAfter = code.match(/(;)(?!.*;.*\w+)(?=.*\w+)/m);
  const codeArray = code.split("");

  let index = lastSemiColonWithContentAfter?.index ?? 0;
  if (index > 0) index += 1;

  codeArray.splice(index, 0, ..." return ".split(""))
  return codeArray.join("");
}

module.exports = {
  init, 
  aliases: ["ev", "ee"],
  cat: "dev",
};
