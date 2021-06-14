// guessingGame('name' , 'type(text/image)' ,'thumb', options)
const axios = require("axios");

function parseGrade(g) {
  let grade;
  switch (true) {
    case g < 0.1:
      grade = "SSS";
      break;
    case g < 0.15:
      grade = "SS";
      break;
    case g < 0.25:
      grade = "S";
      break;
    case g < 0.35:
      grade = "A";
      break;
    case g < 0.5:
      grade = "B";
      break;
    case g < 0.8:
      grade = "C";
      break;
    case g < 1:
      grade = "D";
      break;
    default:
      grade = "F";
  }

  return grade;
}

class GuessingGame {
  /**
     *
     * @param {String} name Minigame identifier, will be the folder name in assets/build/guessing/
     * @param {String} type "image" or "text"
     * @param {Object} options
     * @param {String} [options.imgPosition=thumbnail] "thumbnail" or "image"
     * @param {Number} [options.color=0x5080AA]
     * @param {String} options.title Window Title
     * @param {String} options.prompt Prompt message
     * @param {String} options.guessed Response when guessed (use {{correct}} and {{user}} as placeholders)
     * @param {String} options.timeout Response when timeout (
     * @param {String} options.gamemode "normal" (default) | "endless" - See how far can you go | "versus" - challenge other players
     * @param {Boolean} options.solo   If the game is solo or in group
     * @param {Number} [options.time=15e3] time in ms. 15s defailt
     */

  constructor(name, type = "image", {
    title, prompt, guessed, timeout, gamemode, imgPosition, time, color, solo,
  }) {
    color = color || 0x5080AA;
    imgPosition = imgPosition || "thumbnail";
    this.gamemode = gamemode || "normal";
    this.time = this.gamemode === "endless" ? 0
      : this.gamemode === "time" ? 60e3
        : time || 15e3;

    this.solo = solo ?? false;
    this.name = name;
    this.guessed = guessed;
    this.timeout = timeout;
    this.type = type;

    if (!["image", "thumbnail"].includes(imgPosition)) throw new Error("[imgPosition] must be either 'image' or 'thumbnail'.");

    this.embed = {
      title,
      color,
      description: prompt,
      fields: [],
      [imgPosition]: { url: `attachment://${name}.png` },
      footer: { text: `⏱ ${this.time / 1000}s` },
    };
  }

  progressionTrack(message){
    if (!message) return;
    Progression.emit(`play.${this.name}.${this.gamemode}`,{msg: message, userID: message.author.id});
  }
  progressionScore(message,score){
    if (!message) return;
    Progression.emit(`play.${this.name}.score`,{valueSet: score, msg: message, userID: message.author.id});
  }
  progressionStreak(message,reset){
    if (!message) return;
    if (reset)
      Progression.emit(`streak.${this.name}.${this.gamemode}`,{valueSet: 0, msg: message, userID: message.author.id, data: this});
    else
      Progression.emit(`streak.${this.name}.${this.gamemode}`,{value: 1, msg: message, userID: message.author.id, data: this});
  }

  async generate() {
    if (this.type === "image") {
      const response = (await axios.get(`${paths.DASH}/random/guess/${this.name}?json=1`)).data;
      console.log(response);
      this.imageFile = await resolveFile(response.url);

      if (this.gamemode === "endless") this.embed.footer.text = `Endless Mode | Round ${this.round || 1}`;
      if (this.gamemode === "time") {
        this.embed.footer.text = `Time Attack Mode | Remaining: ${~~((this.time - ~~(Date.now() - (this.start || Date.now()))) / 1000)}s`;
      }
      if (this.solo) this.embed.footer.text += " | SOLO";
      return response;
    }
    return null;
  }

  /** @param {import('eris').Message} msg */
  async play(msg) {
  
    return new Promise( async(resolve) => {
      const v = {
        points: $t(["keywords.points", "points"], { lngs: msg.lang }),
        grade: $t(["keywords.grade", "Grade"], { lngs: msg.lang }),
        score: $t(["keywords.score", "Score"], { lngs: msg.lang }),
        flags: $t(["response.games.guess.Flags", "Flags"], { lngs: msg.lang }),
        timeAttackResults: $t(["response.games.guess.timeAttackResults", "Time Attack Mode Results"], { lngs: msg.lang }),
        endlessModeResults: $t(["response.games.guess.endlessModeResults", "Endless Mode Results"], { lngs: msg.lang }),
        next: $t(["response.games.guess.next", "Next Round..."], { lngs: msg.lang }),
        rounds: $t(["keywords.round_plural", "Rounds"], { lngs: msg.lang }),
        time: $t(["keywords.time", "Time"], { lngs: msg.lang }),
        seconds: $t(["keywords.seconds", "seconds"], { lngs: msg.lang }),

      };

      let { names, url } = await this.generate();

      PLX.createMessage('792176688070918194', `${require("util").inspect(this)} ${url}`)
      PLX.createMessage('792176688070918194', { content: 'DEBUG', embed: this.embed }, { file: this.imageFile, name: `${this.name}.png` })

      msg.channel.send({ embed: this.embed }, { file: this.imageFile, name: `${this.name}.png` })
      .then( ()=> {
        this.start = Date.now();

        const Collector = msg.channel.createMessageCollector((m) => (this.solo ? m.author.id === msg.author.id : true), { time: this.time });

        const isValid = (m, n) => n.includes(m.content.normalize().toLowerCase());
        const _capitalize = (s) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());

        

        if (this.gamemode === "normal") {
          Collector.on("message", (m) => {            
            if (isValid(m, names)) {
              const res = capitalize(names[0]);
              msg.channel.send($t(this.guessed, { user: `<@${m.author.id}>`, answer: `**${res}**` }));

              this.progressionTrack(m);
              this.progressionStreak(m);

              Collector.stop();
            }
          });
          Collector.on("end", (col, reason) => (reason === "time" ? msg.channel.send(this.timeout) && resolve(true) && this.progressionStreak(m, /*RESET*/ true) : console.log({ reason })));
        }

        if (this.gamemode === "endless") {

          this.round = 1;
          let active = true;
          const activity = setInterval(() => {
            if (!active) return Collector.stop("time");
            active = false; return null;
          }, 15e3);
          let points = 0;

          Collector.on("message", async (m) => {
            if (isValid(m, names)) {
              const res = _capitalize(names[0]);
              active = true;
              msg.channel.send($t(this.guessed, { user: `<@${m.author.id}>`, answer: `**${res}**` }));
              const totalTime = ~~(Date.now() - this.start);

              await wait(1);
              this.round++;
              msg.channel.send(v.next);
              await wait(1);

              names = (await this.generate()).names;

              points += ((this.round * res.length) ** 2) / (totalTime / 1000);

              this.embed.fields[0] = {
                name: capitalize(v.score),
                value: `${~~points} ${v.points}`,
                inline: !0,
              };

              this.progressionTrack(m);
              this.progressionStreak(m);

              await msg.channel.send({ embed: this.embed }, { file: this.imageFile, name: `${this.name}.png` });
            } else if (this.solo && m.content?.toLowerCase() === "quit") {
              Collector.end("retire");
            }
          });
          Collector.on("end", () => {
            // if (reason === 'time')

            const totalTime = ~~((Date.now() - this.start) / 1000);
            const gradeCalc = Math.max(totalTime - 14, 1) / 15 / this.round;
            const grade = parseGrade(gradeCalc);

            msg.channel.send({
              content: this.timeout,
              embed: {
                title: v.endlessModeResults,
                description: `
                          ${v.rounds}: ${this.round}
                          ${v.time}: ${totalTime} ${v.seconds}
                          ${v.score}: ${~~points} ${v.points}
                          ${v.grade}: **${grade}**
                          
                          `,
              },
            });

            clearInterval(activity);
            setTimeout( () => this.progressionStreak(m, /*RESET*/ true), 5000 );

            resolve({
              rounds: this.round,
              time: totalTime,
              score: ~~points,
              grade,
            });
          });
        }

        if (this.gamemode === "time") {

          this.round = 1;
          let points = 0;

          Collector.on("message", async (m) => {
            if (isValid(m, names)) {
              const res = _capitalize(names[0]);
              msg.channel.send($t(this.guessed, { user: `<@${m.author.id}>`, answer: `**${res}**` }));
              const totalTime = ~~(Date.now() - this.start);
              this.round++;

              names = (await this.generate()).names;
              points += ((this.round * res.length) ** 2) / (totalTime / 1000);

              this.embed.fields[0] = {
                name: v.score,
                value: `${~~points} ${v.points}`,
                inline: !0,
              };

              this.progressionTrack(m);
              this.progressionStreak(m);

              await msg.channel.send({ embed: this.embed }, { file: this.imageFile, name: `${this.name}.png` });
            } else if (m.content?.toLowerCase() === "skip") {
              names = (await this.generate()).names;
              await msg.channel.send({ embed: this.embed }, { file: this.imageFile, name: `${this.name}.png` });
            }
          });
          Collector.on("end", () => {
            // if (reason === 'time')

            const totalTime = ~~(Date.now() - this.start) / 1000;
            const gradeCalc = Math.max(totalTime - 14, 1) / 15 / this.round;
            const grade = parseGrade(gradeCalc);

            msg.channel.send({
              content: this.timeout,
              embed: {
                title: v.timeAttackResults,
                description: `
                          ${v.flags}: ${this.round}
                          ${v.score}: ${~~points} ${v.points}
                          ${v.grade}: **${grade}**
                      
                          `,

              },
            });

            resolve({
              flags: this.round,
              score: ~~points,
              grade,
            });
          });
        }
      });
    });
  }
}

module.exports = GuessingGame;


