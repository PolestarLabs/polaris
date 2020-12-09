// TODO[epic=translations] attribute
const cmd = "attribute";

const init = async function (message) {
  const P = { user: message.member.displayName, lang: message.lngs };
  if (PLX.autoHelper([$t("helpkey", P), "noargs"], { cmd, message, opt: this.cat })) return;

  let requiredArgs = 2;

  const action = message.args[0];
  if (["add", "set"].includes(action)) requiredArgs = 3;
  if (["see", "list"].includes(action)) requiredArgs = 1;

  if (requiredArgs > message.args.length) return message.reply(`Insufficient Args (${message.args.length}/${requiredArgs})`);

  const tag = message.args[1];
  const value = message.args.slice(2).join(" ");

  let USERDATA = await DB.users.getFull({ id: message.author.id });
  let vars = USERDATA.switches?.variables;

  if (["add", "set"].includes(action)) {
    if (vars && vars.length === 25) return message.reply("Max Attributes Reached (25)");
    if (tag === "all") return message.reply("`all` is a reserved tag!");
    if (vars && vars.find((ex) => ex.tag === tag)) {
      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.value": value } });
    } else {
      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
    }
  }

  if (["ren", "rename"].includes(action)) {
    if (tag === "all") return message.reply("Cannot rename all!");
    if (vars && vars.find((ex) => ex.tag === tag)) {
      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.tag": value } });
    } else {
      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
    }
  }

  if (["delete", "remove", "del", "rem"].includes(action)) {
    if (tag === "all") {
      await DB.users.set({ id: message.author.id }, { $set: { "switches.variables": [] } });
    } else {
      await DB.users.set({ id: message.author.id }, { $pull: { "switches.variables": { tag } } });
    }
  }

  USERDATA = await DB.users.getFull({ id: message.author.id });

  vars = USERDATA.switches?.variables;
  const embed = new Embed();
  embed.title("Attributes");
  for (i in vars) {
    const vi = vars[i];
    embed.field(vi.tag, `\`\`\`${vi.value}\`\`\``, true);
  }
  embed.footer(message.author.tag, message.author.avatarURL);
  embed.color("#f29d15");

  if (embed.fields.length === 0) embed.setDescription(`*No attributes set! Set some with \`${message.prefix}attribute [add|set] [TAG] [VALUE]\`*`);
  message.channel.send({ embed });
};

module.exports = {
  pub: true,
  cmd,
  perms: 3,
  init,
  cat: "roleplay",
};
