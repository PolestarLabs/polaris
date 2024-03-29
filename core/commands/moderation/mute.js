// TRANSLATE[epic=translations] mute

const cmd = "mute";

const init = async function (msg, args) {
  return "Mute has been disabled in favor of Discord's 'Timeout' feature. Please update your client.";
  const P = { lngs: msg.lang };
  const Server = msg.guild;
  const Author = msg.author;
  const Member = Server.member(Author);
  const Target = await PLX.resolveMember(msg.guild, args[0], { softMatch: true }).catch(() => {});
  if (!Target) return msg.channel.send($t("responses.errors.kin404", P));
  if (msg.author.id === Target.id) return msg.channel.createMessage("[REQUIRES_TRANSLATION_STRING] SELF_USER");
  const bot = msg.botUser;


  let ServerDATA = await DB.servers.get(Server.id);
  if (!ServerDATA) {
    await DB.servers.new(msg.guild);
    await DB.servers.get(Server.id);
  }

  const modPass = PLX.modPass(Member, "kickMembers", ServerDATA);
  if (!modPass) return msg.reply($t("CMD.moderationNeeded", P)).catch(console.error);

  const MUTEROLE = msg.guild.roles.get(ServerDATA.modules.MUTEROLE);

  if (!!MUTEROLE && MUTEROLE.position >= msg.guild.me.highestRole.position) {
    return msg.channel.send($t("responses.errors.unmutable", P));
  }

  const regex = /([0-9]*)[\s+]?([m|h|d|w|y]?)/;
  const timing = msg.args[1];

  const number = !timing ? 0 : timing.match(regex)[1];
  const unit = !timing ? 0 : timing.match(regex)[2];
  let mult;
  switch (unit) {
    case "y":
      mult = 1000 * 60 * 60 * 24 * 365;
      break;
    case "w":
      mult = 1000 * 60 * 60 * 24 * 7;
      break;
    case "d":
      mult = 1000 * 60 * 60 * 24;
      break;
    case "h":
      mult = 1000 * 60 * 60;
      break;
    default:
      mult = 60000;
      break;
  }

  msg.args[2] = (+number * mult) / 60000;

  let timeTx; let time;

  if (msg.args[2] != undefined && !isNaN(msg.args[2]) && Number(msg.args[2]) != 0) {
    timeTx = msg.args[2] + (msg.args[2] === 1 ? " minute." : " minutes.");
    time = Number(msg.args[2]);
  } else {
    time = 24 * 60;
    timeTx = "undetermined time.";
  }

  if (time > 60) {
    const unit = Math.floor(time / 60);
    timeTx = unit + (unit === 1 ? " hour" : " hours");
  }
  if (time > 60 * 24) {
    const unit = Math.floor(time / (60 * 24));
    timeTx = unit + (unit === 1 ? " day" : " days");
  }
  if (time > 60 * 24 * 7) {
    const unit = Math.floor(time / (60 * 24 * 7));
    timeTx = unit + (unit === 1 ? " week" : " weeks");
  }
  if (time > 60 * 24 * 30) {
    const unit = Math.floor(time / (60 * 24 * 30));
    timeTx = unit + (unit === 1 ? " month" : " months");
  }



  const MUTED = "MUTED";
  const wasMUTED = "was Muted";
  const TIME = "Time";
  const UNMUTE = "UNMUTED";
  const wasAUTOUNMUTE = "Mute has Timed Out";
  const noperms = $t("CMD.moderationNeeded", P);

  const RESPO = $t("dict.responsible", P);

  const noPermsMe = $t("CMD.unperm", P);

  // Create a new role with data

  if (
    !MUTEROLE
    || (!Server.roles.find((x) => x.id === MUTEROLE)
      && !Server.roles.find((x) => x.name.includes("POLLUX-MUTE")))
  ) {
    return msg.reply("Please set up a mute role first!");

    Server.createRole(
      {
        name: "POLLUX-MUTE",
        color: 0x29305a,
        permissions: 0,
      },
      "No Mute Role found, creating new one!",
    )
      .then(async (role) => {
        msg.channel.send(
          "No Mute Role Setup, Creating **POLLUX-MUTE**...",
        );
        DB.servers.set(Server.id, { $set: { "modules.MUTEROLE": role.id } });
        setupMute(role, time);
        commitMute(role.id, true);
      })
      .catch();
  } else if (Server.roles.find((x) => x.name === "POLLUX-MUTE")) {
    const r = Server.roles.find((x) => x.name === "POLLUX-MUTE");
    setupMute(r, time);
    commitMute(r);
  } else if (Server.roles.find((x) => x.id === MUTEROLE)) {
    const r = Server.roles.find((x) => x.id === MUTEROLE);
    setupMute(r, time);
    commitMute(MUTEROLE);
  }

  async function setupMute(role, time) {
    Target.addRole(
      role.id,
      `MUTED BY ${msg.author.tag}  (${msg.author.id})`,
    );
    makeitMute(Target, role, time);
    logThis(time, timeTx);
    return msg.channel.send(
      `**${(Target.user || Target).tag}** was MUTED for ${timeTx}`,
    );
  }

  function logThis(time, timeTx) {
    let chanpoint;

    const logchan = ServerDATA.modules.LOGCHANNEL;
    const modchan = ServerDATA.modules.MODLOG;

    if (logchan && Server.channels.has(logchan)) {
      chanpoint = Server.channels.get(logchan);
    }
    if (ServerDATA.splitLogs && modchan && Server.channels.has(modchan)) {
      chanpoint = Server.channels.get(modchan);
    }
    // console.log(chanpoint.name)

    if (chanpoint) {
      const { id } = Target.user;
      const mess = msg;
      const emb = new RichEmbed();

      emb.setThumbnail(Target.user.avatarURL);
      emb.setTitle(`:mute: ${MUTED}`);
      emb.setDescription(
        `**${`${Target.user.username}#${Target.user.discriminator}`
        }** ${wasMUTED}`,
      );
      // emb.addField("Channel",mess.channel,true)
      emb.addField(TIME, timeTx, true);
      emb.addField(RESPO, Author, true);
      // emb.addField("Message",mess.content,true)
      emb.setColor("#102af5");
      var ts = new Date();
      emb.setFooter("Mute", Target.user.avatarURL);
      emb.setTimestamp(ts);

      chanpoint
        .send({
          embed: emb,
        })
        .catch((e) => {
          const a = new Error();
          errLog(e, __filename, a.stack.toString());
        });

      const RevokeEmb = new RichEmbed();

      RevokeEmb.setThumbnail(Target.user.avatarURL);
      RevokeEmb.setTitle(`:mute: ${UNMUTE}`);
      RevokeEmb.setDescription(
        `**${`${Target.user.username}#${Target.user.discriminator}`
        }** ${wasAUTOUNMUTE}`,
      );
      RevokeEmb.addField(RESPO, bot.user, true);
      RevokeEmb.setColor("#102af5");
      var ts = new Date();
      RevokeEmb.setFooter("Unmute", Target.user.avatarURL);
      RevokeEmb.setTimestamp(ts);

      if (time && typeof time === "number") {
        setTimeout((f) => {
          chanpoint.sendEmbed(RevokeEmb).catch();
        }, time * 60000);
      }
    }
  }

  async function makeitMute(Mem, Rol, minutes) {
    const now = Date.now();
    const time = minutes * 60000;
    const freedom = now + time;

    DB.mutes.add({ S: Mem.guild.id, U: Mem.id, E: freedom });
  }

  async function commitMute(role, first = false) {
    role = role.id || role;
    const totChans = Server.channels.filter((c) => (c.type = "text"));
    let erroredChans = 0;
    const promiseBucket = [];
    chanLen = totChans.length;
    return new Promise(async (resolve) => {
      while (chanLen-- > 0) {
        const chn = Server.channels.map((c) => c)[chanLen];
        promiseBucket.push(
          (async () => {
            if (!chn.permissionsOf(PLX.user.id).has("manageChannel")){
              erroredChans++;
              return;
            }
            chn.editPermission(role,0,2048,"role","UPDATING MUTE OVERRIDES",)
              .then()
                .catch((err) => { erroredChans++ })
          })()
        );
      }
      if (first === true) {
        Promise.all(promiseBucket).then((x) => {
          msg.channel.send(
            `\`Could not edit Mute overrides in ${erroredChans
            } Channels 💔\``,
          );
        }).catch();
      }
    });
  }
};

module.exports = {
  pub: false,
  argsRequired: false,
  cmd,
  perms: 3,
  init,
  cat: "moderation",
  botPerms: ["manageChannels", "guild:manageRoles"],
};
