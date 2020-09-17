const moment = require("moment");

const init = async (msg) => {
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

    newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });

    return newmar;
  };

  //

  const prefilt = MRG.filter((v, i, a) => {
    // let unique = i === a.map(x=>x.id).indexOf(v.id);
    const unique = a.map((x) => x.id).filter((x) => x === v.id).length === 1;
    if (!unique) {
      const copies = a.filter((ff) => ff.id === v.id);
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

  console.log(newMARRIAGES);
  msg.channel.send({
    embed: {
      description: `
            MRG: ${MRG.length}
            DiffUsr: ${MRG.map((x) => x.id).filter((v, i, a) => i === a.indexOf(v)).length}
            

            ${newMARRIAGES.map((x, i) => `\`${i}\` **From** ${moment(x.since).from(Date.now())} | **User:** <@${x.users.find((x) => x != msg.author.id)}> | **Ring:** ${_emoji(x.ring)} | Init: ${x.initiative === msg.author.id ? _emoji("yep") : _emoji("nope")}, LVP: ${x.lovepoints} | ${x.merged ? "`MERGED`" : ""}
${x.preexistent ? `PREEXISTENT: ${x.preexistent._id}\n` : ""}`).join("")}


        `,
    },
  });

  const responses = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id && (
    msg2.content.startsWith("import") && typeof parseInt(msg2.content.split(" ")[1]) === "number"
  ), {
    maxMatches: 1,
    time: 30e3,
  });
  console.log("help");

  let action = "";
  let subaction = 0;
  if (responses.length !== 0) {
    action = responses[0].content.toLowerCase();
    subaction = parseInt(responses[0].content.split(" ")[1]);
  }

  if (action.startsWith("import")) {
    console.log(newMARRIAGES[subaction]);

    await DB.users.set(msg.author.id, { $pull: { married: { id: newMARRIAGES[subaction].users.find((x) => x != msg.author.id) } } });
    const newM = await DB.relationships.create("marriage", newMARRIAGES[subaction].users, newMARRIAGES[subaction].initiative, newMARRIAGES[subaction].ring);

    msg.channel.send(`${_emoji("yep")} created. ${newM._id}`);
  }
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
