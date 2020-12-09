// TODO[epic=translations] trivia

const init = async (msg, args) => {
  let rounds = args[0] || 10;
  if (rounds > 30) rounds = 30;
  const diff = Number(args[1]) || false;
  const theme = (args[2] || "").toLowerCase();
  let cround = 0;
  const scores = {};

  let QUESTIONS = require("./questions.json");
  if (diff) QUESTIONS = QUESTIONS.filter((q) => q.level === diff);
  if (theme && theme !== "") QUESTIONS = QUESTIONS.filter((q) => q.allcats.toLowerCase().includes(theme));

  async function triviaRun() {
    msg.channel.trivia = true;
    if (QUESTIONS.length === 0 || cround + 1 > rounds) {
      msg.channel.trivia = false;
      return msg.channel.send({
        content: "no more questions",
        embed: {
          fields: Object.keys(scores).map((i) => ({ name: scores[i].name, value: `Score: ${scores[i].score}` })),
        },
      });
    }

    function correctCheck(res, Q) {
      if (res.author.bot) return { end: false };
      if (res.content === "abort" && res.author.id === msg.author.id) return { end: true };

      const response = res.content
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const answers = Q.answer.split(",").map((a) => a.trim().toLowerCase());
      const correct = answers.includes(response);

      if (correct) res.addReaction(_emoji("yep").reaction);
      else res.addReaction(_emoji("nope").reaction);

      let end = correct;
      if (Q.type === "TF" && ["true", "false"].includes(response)) end = true;
      if (!correct && ["pass"].includes(response)) end = true;

      return { correct, response, end };
    }

    const rand = randomize(1, QUESTIONS.length) - 1;
    const Q = QUESTIONS[rand];
    QUESTIONS = QUESTIONS.filter((v, i) => i !== rand);
    const levels = ["Braindead", "My mom can do it", "Lemme think", "Goddammit", "What in tarnation"];

    const embed = {
      description:
       `*\`\`\`css\n${Q.question}\`\`\`*`,
    };
    embed.description += "\n\u200b";
    embed.fields = [];
    embed.fields[0] = { name: "Category", value: Q.allcats, inline: true };
    embed.fields[1] = { name: "Difficulty", value: ` **${levels[-1 + Number(Q.level) || 0]}**`, inline: true };

    embed.title = `Trivia: Round ${cround + 1}/${rounds}`;

    return msg.channel.send({ embed }).then(async (m2) => {
      const responses = await m2.channel.awaitMessages(
        (m3) => correctCheck(m3, Q).end,
        { maxMatches: 1, time: 15e3 },
      );

      cround++;

      if (responses.length === 0) {
        msg.channel.send("Nobody got it. :( ");
        return triviaRun();
      }

      const { correct } = correctCheck(responses[0], Q);
      if (responses[0].content === "abort" && responses[0].author === msg.author) {
        msg.channel.trivia = false;
        return msg.channel.send("Game cancelled!");
      }

      const responder = responses[0].author;

      if (correct) {
        if (scores[responder.id]) scores[responder.id].score += 1;
        else scores[responder.id] = { name: responder.username, score: 1 };
        embed.color = 0x33FE55;
        embed.footer = { text: `${responder.username} got it!`, icon_url: responder.avatarURL };
        m2.edit({ embed });
      } else {
        if (!scores[responder.id]) scores[responder.id] = { name: responder.username, score: 0 };
        embed.color = 0xFF3355;
        m2.edit({ embed });
      }
      await wait(1);
      if (cround < rounds) return triviaRun();
      msg.channel.trivia = false;
      return msg.channel.send({
        embed: {
          fields: Object.keys(scores).map((i) => ({ name: scores[i].name, value: `Score: ${scores[i].score}` })),
        },
      });
    });
  }
  if (msg.channel.trivia) return msg.reply("Theres already a game going on here!");
  return triviaRun();
};

module.exports = {
  init,
  pub: true,
  cmd: "trivia",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
