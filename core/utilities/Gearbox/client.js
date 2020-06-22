global.DB = require("../../database/db_ops");

const CLEAN_ID_REGEX = /[<!@>]/g;
const ID_REGEX = /^\d{17,19}$/;

module.exports = {
  getTarget: async function getTarget(query, guild = null, strict = false, member = false) {
    query = query?.trim();
    if (!query) return null;

    const ID = query.replace(CLEAN_ID_REGEX, "");
    const isID = ID_REGEX.test(ID);
    if (strict && !isID) return Promise.reject("isStrict & isNotID");

    let user;

    switch (true) {
      case guild && !strict:
        user = isID ? await guild.getRESTMember(ID).catch(() => null) : PLX.findMember(query, guild.members);
        if (user) user = Object.assign(PLX.findMember(ID, guild.members), user);
        break;
      case !guild && strict:
        user = await PLX.getRESTUser(ID).catch(() => null);
        break;
      case guild && strict:
        user = await guild.getRESTMember(ID).catch(() => null);
        if (user) user = Object.assign(PLX.findMember(ID, guild.members), user);
        break;
      case !guild && !strict:
      default:
        user = isID ? await PLX.getRESTUser(ID).catch(() => null) : PLX.findUser(query);
    }

    if (user && member && guild) return user;
    if (!user && guild && isID) return await PLX.getRESTUser(ID);
    return user?.user || user;
  },
  // Get IMG from Channel MSGs
  getChannelImg: async function getChannelImg(message, nopool) {
    const hasImageURL = message.content.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g);
    if (hasImageURL) return hasImageURL[0];
    if (message.attachments[0]) return message.attachments[0].url;
    const sevmesgs = message.channel.messages;

    if (nopool) return false;

    const messpool = sevmesgs.filter((mes) => {
      if (mes.attachments?.length > 0) {
        if (mes.attachments[0].url) {
          return true;
        }
      }
      if (mes.embeds?.length > 0) {
        if (mes.embeds[0].type === "image" && mes.embeds[0].url) {
          return true;
        }
      }
      return false;
    });

    if (messpool?.length > 0) {
      return (
        messpool[messpool.length - 1].attachments[0]
            || messpool[messpool.length - 1].embeds[0]
      ).url;
    }
    return false;
  },
  modPass: function modPass(member, extra, sData = false) {
    if (sData?.modules.MODROLE) {
      if (member.hasRole(sData.modules.MODROLE)) return true;
    }
    if (member.permission.has("manageGuild") || member.permission.has("administrator")) {
      return true;
    }
    if (member.permission.has(extra)) return true;

    return false;
  },
  gamechange: function gamechange(gamein = false, status = "online") {
    delete require.cache[require.resolve("../../../resources/lists/playing.js")];
    const gamelist = require("../../../resources/lists/playing.js");
    const max = gamelist.games.length - 1;
    const rand = randomize(0, max);
    const gm = gamein || gamelist.games[rand];
    return PLX.editStatus(status, { name: gm[0], type: gm[1] });
  },
  getPreviousMessage: function getMessage(msg, ID) {
    return new Promise((resolve, reject) => {
      if (ID) {
        msg.channel.getMessage(ID).then(resolve).catch(() => {
          msg.guild.channels.forEach((c) => {
            if (!c.getMessage) return;
            c.getMessage(ID).then((x) => {
              if (x) resolve(x);
            }).catch(() => null);
          });
        });
      } else {
        msg.channel.getMessages(1, msg.id).then((me) => resolve(me[0])).catch(reject);
      }
    });
  },
  autoHelper: function autoHelper(trigger, options) {
    let message; let cmd; let opt;
    if (typeof options === "object") {
      message = options.message || options.msg;
      cmd = options.cmd;
      opt = options.opt;
      scope = options.scope;
      aliases = options.aliases;
    }

    if (trigger.includes(message.content.split(/ +/)[1])
        || message.content.split(/ +/)[1] === "?"
        || message.content.split(/ +/)[1] === "help"
        || (message.content.split(/ +/).length === 1 && trigger.includes("noargs"))
        || trigger === "force"
    ) {
      // this.usage(cmd,message,opt,aliases);
      const usage = require("../../structures/UsageHelper.js");
      usage.run(cmd, message, opt, options);
      return true;
    }
    return false;
  },
  usage: function usage(cmd, m, third, sco) {
    delete require.cache[require.resolve("../../structures/UsageHelper.js")];
    const usg = require("../../structures/UsageHelper.js");
    usg.run(cmd, m, third, sco);
  },

};
