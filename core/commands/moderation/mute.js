// const gear = require("../../utilities/Gearbox");
// const DB = require("../../database/db_ops");
//const locale = require(appRoot + '/utils/i18node');
//const $t = locale.getT();

const cmd = "mute";

const init = async function (message) {
  const Server = message.guild;
  const Author = message.author;
  const Member = Server.member(Author);
  let Target = PLX.getTarget(message, 0, false,{force:true} );
  const bot = message.botUser;

  const P = { lngs: message.lang };

  let ServerDATA = await DB.servers.get(Server.id);

    const modPass = PLX.modPass(Member, "kickMembers", ServerDATA);
    if (!modPass) return message.reply($t("CMD.moderationNeeded", P)).catch(console.error);

    console.log({Target})
    
    Target = Server.member(await Target);
    
    console.log({Target})

    if (!Target) return message.channel.send($t("responses.errors.kin404", P));
    if (!Target.kickable) return message.channel.send($t("responses.errors.unmutable", P));    

    let regex = /([0-9]*)[\s+]?([m|h|d|w|y]?)/;
    let timing = message.args[1];

    let number = !timing ? 0 : timing.match(regex)[1];
    let unit = !timing ? 0 : timing.match(regex)[2];
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

    message.args[2] = (+number * mult) / 60000;
    
    let timeTx,time;

    if ( message.args[2] != undefined && !isNaN(message.args[2]) && Number(message.args[2]) != 0 ) {
        timeTx = message.args[2] + (message.args[2] == 1 ? " minute." : " minutes.");      
    } else {
        time = 24 * 60;
        timeTx = "undetermined time.";
    }

    if (time > 60) {
      let unit = Math.floor(time / 60);
      timeTx = unit + (unit == 1 ? " hour" : " hours");
    }
    if (time > 60 * 24) {
      let unit = Math.floor(time / (60 * 24));
      timeTx = unit + (unit == 1 ? " day" : " days");
    }
    if (time > 60 * 24 * 7) {
      let unit = Math.floor(time / (60 * 24 * 7));
      timeTx = unit + (unit == 1 ? " week" : " weeks");
    }
    if (time > 60 * 24 * 30) {
      let unit = Math.floor(time / (60 * 24 * 30));
      timeTx = unit + (unit == 1 ? " month" : " months");
    }

    let MUTED = "MUTED";
    let wasMUTED = "was Muted";
    let TIME = "Time";
    let UNMUTE = "UNMUTED";
    let wasAUTOUNMUTE = "Mute has Timed Out";
    let noperms = $t("CMD.moderationNeeded", P);

    let RESPO = $t("dict.responsible", P);

    let noPermsMe = $t("CMD.unperm", P);

    // Create a new role with data
    const muteRole = ServerDATA.modules.MUTEROLE;
    if (
      !muteRole ||
      (!Server.roles.find((x) => x.id == muteRole) &&
        !Server.roles.find((x) => x.name === "POLLUX-MUTE"))
    ) {
      Server.createRole(
        {
          name: "POLLUX-MUTE",
          color: 0x29305a,
          permissions: 0,
        },
        "No Mute Role found, creating new one!"
      )
        .then(async (role) => {
          message.channel.send(
            `No Mute Role Setup, Creating **POLLUX-MUTE**...`
          );
          DB.servers.set(Server.id, { $set: { "modules.MUTEROLE": role.id } });
          setupMute(role);
          commitMute(role.id, true);
        })
        .catch(console.error);
    } else if (Server.roles.find((x) => x.name === "POLLUX-MUTE")) {
      let r = Server.roles.find((x) => x.name === "POLLUX-MUTE");
      setupMute(r);
      commitMute(r);
    } else if (Server.roles.find((x) => x.id == muteRole)) {
      let r = Server.roles.find((x) => x.id == muteRole);
      setupMute(r);
      commitMute(muteRole);
    }

    async function setupMute(role) {
      Target.addRole(
        role.id,
        "MUTED BY " + message.author.tag + `  (${message.author.id})`
      );
      makeitMute(Target, role, time);
      roleout(time, role);
      logThis(time, timeTx);
      return message.channel.send(
        `**${(Target.user || Target).tag}** was MUTED for ${timeTx}`
      );
    }
    async function roleout(tm, role) {
      if (tm == undefined) return false;
      return setTimeout((f) => {
        Target.removeRole(role.id, "Mute Expired");
        DB.mutes.expire({ S: Target.guild.id, U: Target.id });
      }, tm * 60000);
    }

    function logThis(time, timeTx) {
      let chanpoint;

      let logchan = ServerDATA.modules.LOGCHANNEL;
      let modchan = ServerDATA.modules.MODLOG;

      if (logchan && Server.channels.has(logchan)) {
        chanpoint = Server.channels.get(logchan);
      }
      if (ServerDATA.splitLogs && modchan && Server.channels.has(modchan)) {
        chanpoint = Server.channels.get(modchan);
      }
      //console.log(chanpoint.name)

      if (chanpoint) {
        let id = Target.user.id;
        let mess = message;
        let emb = new RichEmbed();

        emb.setThumbnail(Target.user.avatarURL);
        emb.setTitle(":mute: " + MUTED);
        emb.setDescription(
          `**${
            Target.user.username + "#" + Target.user.discriminator
          }** ${wasMUTED}`
        );
        //emb.addField("Channel",mess.channel,true)
        emb.addField(TIME, timeTx, true);
        emb.addField(RESPO, Author, true);
        //emb.addField("Message",mess.content,true)
        emb.color = 0x102af5;
        var ts = new Date();
        emb.setFooter("Mute", Target.user.avatarURL);
        emb.setTimestamp(ts);

        chanpoint
          .send({
            embed: emb,
          })
          .catch((e) => {
            let a = new Error();
            errLog(e, __filename, a.stack.toString());
          });

        var RevokeEmb = new RichEmbed();

        RevokeEmb.setThumbnail(Target.user.avatarURL);
        RevokeEmb.setTitle(":mute: " + UNMUTE);
        RevokeEmb.setDescription(
          `**${
            Target.user.username + "#" + Target.user.discriminator
          }** ${wasAUTOUNMUTE}`
        );
        RevokeEmb.addField(RESPO, bot.user, true);
        RevokeEmb.color = 0x102af5;
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
      let now = Date.now();
      let time = minutes * 60000;
      let freedom = now + time;
      DB.mutes.add({ S: Mem.guild.id, U: Mem.id, E: freedom });
    }

    async function commitMute(role, first = false) {
      let totChans = Server.channels.filter((c) => (c.type = "text"));
      let erroredChans = 0;
      let promiseBucket = [];
      chanLen = totChans.length;
      return new Promise(async (resolve) => {
        while (chanLen--) {
          let chn = Server.channels.map((c) => c)[chanLen];
          promiseBucket.push(
            chn
              .editPermission(
                role.id,
                0,
                2048,
                "role",
                "UPDATING MUTE OVERRIDES"
              )
              .then()
              .catch((err) => erroredChans++)
          );
        }
        if (first === true) {
          Promise.all(promiseBucket).then((x) => {
            message.channel.send(
              "`Could not edit Mute overrides in " +
                erroredChans +
                " Channels 💔`"
            );
          });
        }
      });
    }

};

module.exports = {
  pub: true,
  cmd: cmd,
  perms: 3,
  init: init,
  cat: "mod",
  botPerms: ["manageChannels", "manageRoles"],
};
