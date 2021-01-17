const moment = require("moment");

const init = async function (msg, args, resolve) {
  const USERDATA = await DB.users.get(msg.author.id);

  const MRG = USERDATA.married;

  marriageToRelationship = async (mar) => {
    const newmar = {};
    newmar.initiative = mar.initiative ? mar.id : msg.author.id;
    newmar.users = [msg.author.id, mar.id];
    newmar.ring = mar.ring;
    newmar.since = mar.since;
    newmar.type = "marriage";
    newmar.lovepoints = Math.floor(USERDATA.modules.lovepoints / USERDATA.married.length) || 0;
    newmar.merged = mar.merged;
    newmar.ringCollection = mar.ringCol;

    newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });
    if (newmar.preexistent) newmar.transferred = true;

    return newmar;
  };

  //

  const prefilt = MRG.filter((v, i, a) => {
    // let unique = i === a.map(x=>x.id).indexOf(v.id);
    const unique = a.map((x) => x.id).filter((x) => x === v.id).length === 1;
    const copies = a.filter((ff) => ff.id === v.id);
    v.ringCol = copies.map((c) => c.ring);

    if (!unique) {
      const oldest = copies.sort((a, b) => a.since - b.since)[0];
      copies.forEach((c) => c.ponderedValue = c.ring === "stardust" ? 0 : c.ring === "sapphire" ? 1 : c.ring === "rubine" ? 2 : c.ring === "jade" ? 3 : 9);
      const mostValuable = copies.sort((a, b) => a.ponderedValue - b.ponderedValue)[0];

      v.ring = mostValuable.ring;
      v.since = oldest.since;
      v.merged = true;
      return v;
    }
    return v;
  }).filter((v, i, a) => i === a.map((y) => y.id).indexOf(v.id));

  const newMARRIAGES = await Promise.all(prefilt.map(marriageToRelationship));

  function buildDescription(nMAR) {
    return `
**Total Marriages:** ${MRG.length}
**Unique Spouses:** ${MRG.map((x) => x.id).filter((v, i, a) => i === a.indexOf(v)).length}
            
**Choose up to 3 to import,** additional slots are gonna cost you ${_emoji("SPH")}**5 Sapphires** each (they'll be deducted *after* you receive the bonus Sapphires).
Please send **the number** of the selected marriages. Send \`ok\` to finish or skip.

${nMAR.map((x, i) => (x.transferred ? `\n\`${i}\` - Transferred! (<@${x.users.find((x) => x != msg.author.id)}>)`
    : `\n\u200b\`${i}\` **From** ${moment(x.since).from(Date.now())} | **User:** <@${x.users.find((x) => x != msg.author.id)}> | Init: ${x.initiative === msg.author.id ? _emoji("yep") : _emoji("nope")}
> **Highest Ring:** ${_emoji(x.ring, `💍\`${x.ring.toUpperCase()}\``)}${x.ringCollection.length > 1 ? `\n> **Ring Collection:** ${x.ringCollection.map((r) => _emoji(r, `💍\`${r.toUpperCase()}\``))}` : ""}
${x.preexistent ? `PREEXISTENT: ${x.preexistent._id}\n` : ""}`)).join("")}
`;
  }

  const marriageEmbed = {
    description: buildDescription(newMARRIAGES),
  };
  const marriageBox = await msg.channel.send({ embed: marriageEmbed });

  const Collector = msg.channel.createMessageCollector((m) => m.author.id === msg.author.id && (Math.abs(Number(m.content) ?? 999) < newMARRIAGES.length || m.content === "ok"), { time: 12e4 });

  let imported = 0;
  let last;
  const transferlist = [];
  Collector.on("message", async (m) => {
    m?.delete();
    last?.delete();
    let finalMessage = "";
    if (m.content === "ok") return Collector.stop();
    const index = Math.abs(Number(m.content));
    if (newMARRIAGES[index].transferred) return last = await msg.channel.send("This one has been transferred already!");

    if (imported >= 3) {
      finalMessage += `-5 ${_emoji("SPH")}`;
    }
    await DB.users.set(msg.author.id, { $pull: { married: { id: newMARRIAGES[index].users.find((x) => x != msg.author.id) } } });
    const newM = await DB.relationships.create("marriage", newMARRIAGES[index].users, newMARRIAGES[index].initiative, newMARRIAGES[index].ring, newMARRIAGES[index].since);
    //
    // msg.channel.send(`${_emoji("yep")} created. ${newM._id}`);
    finalMessage += (`\n${_emoji("yep")} created. \`${newMARRIAGES[index].users}\``);
    newMARRIAGES[index].transferred = true;

    marriageEmbed.description = buildDescription(newMARRIAGES);

    marriageBox.edit({ embed: marriageEmbed });
    transferlist.push(`<@${newMARRIAGES[index].users.find((x) => x != msg.author.id)}>`);

    imported++;
    if (imported == 3) {
      finalMessage += ("\n***Next imports will cost you 5 Sapphires each***");
    }
    last = await msg.channel.send(finalMessage);
    if (!newMARRIAGES.find((x) => !x.transferred)) return Collector.stop();
  });
  Collector.on("end", async (m) => {
    last?.delete();
    const res = await marriageBox.edit({
      embed: {
        description: `
    **Complete!**
    Marriages transferred: **${imported}**
> ${transferlist.join(" | ")}
    Cost: **${5 * Math.max(imported - 3, 0) || "Free"}**
    `,
      },
    });
    if (typeof resolve === "function") resolve({ res, cost: 5 * Math.max(imported - 3, 0) || 0, imported });
  });
  if (!newMARRIAGES.find((x) => !x.transferred)) return Collector.stop();
};
module.exports = {
  init,
  pub: false,
  cmd: "mrgt",
  perms: 3,
  cat: "misc",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
