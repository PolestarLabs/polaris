global.DB = require("../../database/db_ops");

module.exports = {
    getTarget: function getTarget(msg, argPos = false, self = true, soft = false, options) {

        if (msg.args[argPos]===false) return self ? msg.author : null;
        let ID = msg.args[argPos].replace(/[^0-9]/g, '');
        let user = PLX.users.find(usr => usr.id === ID);   

        if (!user) {            
            user = msg.guild.members.find(mbr =>
                mbr.username.toLowerCase() == msg.args[argPos].toLowerCase() ||
                (mbr.nick || "").toLowerCase() == msg.args[argPos].toLowerCase()
            ) ||
                msg.guild.members.find(mbr =>
                    soft && (mbr.nick && mbr.nick.toLowerCase().includes(msg.args[argPos].toLowerCase()))
                ) ||
                msg.guild.members.find(mbr =>
                    soft && mbr.username.toLowerCase().includes(msg.args[argPos].toLowerCase())
                ) ||
                msg.guild.members.find(mbr =>
                    soft && mbr.user.tag.toLowerCase().includes(msg.args[argPos].toLowerCase())
                );

            if (!user && self == true) user = msg.author;
            if(user) user.noDB = true;
        }

        if (!user && msg.mentions.length > 0  ) return msg.mentions[argPos]||msg.mentions[0];
        if(options?.force) return PLX.fetchUser(ID);
        if (!user) return null;
        if(user?.noDB) DB.users.new(user.user || user);
        return user.user || user;
    },
    //Get IMG from Channel MSGs
    getChannelImg: async function getChannelImg(message, nopool) {

        const hasImageURL = message.content.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g);
        if (hasImageURL) return hasImageURL[0];
        if (message.attachments[0]) return message.attachments[0].url;
        let sevmesgs = message.channel.messages;

        if (nopool) return false;

        const messpool = sevmesgs.filter(mes => {
            if (mes.attachments?.length > 0) {
                if (mes.attachments[0].url) {
                    return true
                }
            }
            if (mes.embeds?.length > 0) {
                if (mes.embeds[0].type === 'image' && mes.embeds[0].url) {
                    return true
                }
            }
        });

        if (messpool?.length > 0) return (
            messpool[messpool.length - 1].attachments[0] ||
            messpool[messpool.length - 1].embeds[0]
        ).url;
        else return false;
    },
    modPass: function modPass(member, extra, sData = false) {
        if (sData?.modules.MODROLE) {
            if (member.hasRole(sData.modules.MODROLE)) return true;
        }
        if (member.permission.has('manageGuild') || member.permission.has('administrator')) {
            return true;
        }
        if (member.permission.has(extra)) return true;

        return false;

    },
    gamechange: function gamechange(gamein = false, status = "online") {
        delete require.cache[require.resolve("../../../resources/lists/playing.js")];
        let gamelist = require("../../../resources/lists/playing.js");
        let max = gamelist.games.length - 1
        let rand = randomize(0, max)
        let gm = gamein || gamelist.games[rand];
        return PLX.editStatus(status, { name: gm[0], type: gm[1] })
    },
    getPreviousMessage: function getMessage(msg, ID) {
        return new Promise(async (resolve, reject) => {
            if (ID) {
                msg.channel.getMessage(ID).then(resolve).catch(err => {
                    msg.guild.channels.forEach(c => {
                        if (!c.getMessage) return;
                        c.getMessage(ID).then(x => {
                            if (x) resolve(x);
                        }).catch(err => null);
                    });
                });
            } else {
                msg.channel.getMessages(1, msg.id).then(me => resolve(me[0])).catch(reject);
            }
        });
    },
    autoHelper: function autoHelper(trigger, options) {
      let message, P, M, key, cmd, opt;
      if (typeof options == 'object') {
        message = options.message || options.msg;
        M = message.content;
        P = { lngs: message.lang };
        key = options.opt;
        cmd = options.cmd;
        opt = options.opt;
        scope = options.scope;
        aliases = options.aliases;
      };
  
      if (trigger.includes(message.content.split(/ +/)[1])
        || message.content.split(/ +/)[1] == "?"
        || message.content.split(/ +/)[1] == "help"
        || (message.content.split(/ +/).length == 1 && trigger.includes('noargs'))
        || trigger === 'force'
      ) {
        //this.usage(cmd,message,opt,aliases);
        let usage = require("../../structures/UsageHelper.js");
        usage.run(cmd, message, opt, options);
        return true;
      } else {
        return false;
      }
    },
    usage: function usage(cmd, m, third, sco) {
      delete require.cache[require.resolve("../../structures/UsageHelper.js")];
      let usage = require("../../structures/UsageHelper.js");
      usage.run(cmd, m, third, sco);
    },
  
  
}