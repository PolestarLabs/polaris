const init = async function(msg, args, streak) {
  let rounds = args[0] || 10;
  let diff = Number(args[1]) || false;
  let theme = (args[2] || "").toLowerCase();
  let cround = 0;
  let scores = {};

  let QUESTIONS = require("./questions.json");
  if (!!diff) QUESTIONS = QUESTIONS.filter(q => q.level == diff);
  if (theme && theme != "")
    QUESTIONS = QUESTIONS.filter(q => q.allcats.toLowerCase().includes(theme));

  await triviaRun();

  async function triviaRun() {
    if (QUESTIONS.length == 0 || cround > rounds) {
      return msg.channel.send({
        content: "no more questions",
        embed: {
          fields: Object.keys(scores).map(i => {
            return { name: scores[i].name, value: `Score: ${scores[i].score}` };
          })
        }
      });
    }
    let rand = randomize(1, QUESTIONS.length) - 1;
    let Q = QUESTIONS[rand];
    QUESTIONS = QUESTIONS.filter((v, i) => i != rand);
    let levels = ["VERY EASY", "EASY", "MEDIUM", "HARD", "VERY HARD"];

    let embed = {
      description:
        Q.question +
        `
    **Category:** ${Q.category}
    Level: **${levels[-1 + Number(Q.level) || 0]}**
    `
    };

    msg.channel.send({ embed }).then(async m2 => {
      let responses = await m2.channel.awaitMessages(
        m3 => correctCheck(m3, Q).end,
        { maxMatches: 1, time: 15e3 }
      );

      if (responses.length == 0) {
        msg.reply("timeout");
        return triviaRun();
      }

      let { correct, response } = correctCheck(responses[0], Q);

      let responder = responses[0].author;

      cround++;

      embed.footer = { text: `Round ${cround}/${rounds}` };
      if (correct) {
        if (scores[responder.id]) scores[responder.id].score += 1;
        else scores[responder.id] = { name: responder.username, score: 1 };
        embed.color = 0x00cc00;
        m2.edit({ embed });
      } else {
        if (!scores[responder.id])
          scores[responder.id] = { name: responder.username, score: 0 };
        embed.color = 0xcc0000;
        m2.edit({ embed });
      }
      await wait(1);
      if (cround < rounds) return triviaRun();
      msg.channel.send({
        embed: {
          fields: Object.keys(scores).map(i => {
            return { name: scores[i].name, value: `Score: ${scores[i].score}` };
          })
        }
      });
    });
  }
  function correctCheck(res, Q) {
    if (res.author.bot) return { end: false };
    let response = res.content
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    let answers = Q.answer.split(",").map(a => a.trim().toLowerCase());
    let correct = answers.includes(response);

    if (correct) res.addReaction(_emoji("yep").reaction);
    else res.addReaction(_emoji("nope").reaction);

    let end = correct;
    if (Q.type == "TF" && ["true", "false"].includes(response)) end = true;
    if (!correct && ["pass"].includes(response)) end = true;

    return { correct, response, end };
  }
};

module.exports = {
  init,
  pub: true,
  cmd: "index",
  perms: 3,
  cat: "trivia",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: []
};
