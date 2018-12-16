const gear = require("../../utilities/Gearbox");
const DB = require("../../database/db_ops");
const locale = require(appRoot + '/utils/i18node');
const $t = locale.getT();

const cmd = 'mute';

const init = async function (message) {
    console.log(11)
    const Server = message.guild;
    const Author = message.author;
    const Member = Server.member(Author);
    let Target = await gear.getTarget(message, 0, false);
    const bot = message.botUser

    const P = {lngs: message.lang};

    if (gear.autoHelper([$t("helpkey", P), 'noargs', ''], {cmd,message,opt: this.cat})) return;
    if (message.args.length < 1) return gear.autoHelper('force', {cmd,message,opt: this.cat});

    let ServerDATA = await DB.servers.get(Server.id);


    try {
        const modPass = gear.modPass(Member,"kickMembers", ServerDATA);
        if (!modPass) {
            return message.reply($t('CMD.moderationNeeded', P)).catch(console.error);
        };
        
        //-------MAGIC----------------
        
        Target = Server.member(Target)
        let regex = /([0-9]*)[\s+]?([m|h|d|w|y]?)/
        let timing = message.args[1]
        let number = timing.match(regex)[0];
        let unit = timing.match(regex)[1];
        let mult
        switch (unit) {
            case 'y':
                mult = 1000 * 60 * 60 * 24 * 365;
                break;
                case 'w':
                mult = 1000 * 60 * 60 * 24 * 7;
                break;
                case 'd':
                mult = 1000 * 60 * 60 * 24;
                break;
            case 'h':
                mult = 1000 * 60 * 60;
                break;
            default:
            mult = 60000;
                break;  
            }

            message.args[2] = +number * mult / 60000;
            
            if (message.args[2] != undefined && !isNaN(message.args[2]) && Number(message.args[2]) != 0) {
                
                var time = Number(message.args[2])
            var timeTx = message.args[2] + " minutes."
        } else {
            var time = undefined
            var timeTx = "Undetermined Time"
        }
        
        let MUTED = "MUTED"
        let wasMUTED = "was Muted"
        let TIME = "Time"
        let UNMUTE = "UNMUTED"
        let wasAUTOUNMUTE = "Mute has Timed Out"
        let noperms = $t('CMD.moderationNeeded', P)
        
        let RESPO = $t('dict.responsible', P)
        
        let noPermsMe = $t('CMD.unperm', P)
        
        // Create a new role with data
        var muteRole = ServerDATA.modules.MUTEROLE;
        if (!muteRole || (!Server.roles.find(x=>x.id==muteRole) || !Server.roles.find(x => x.name === "POLLUX-MUTE"))) {
            Server.createRole({
                name: 'POLLUX-MUTE',
                color: 0x29305a ,
                    permissions: 0
                },"No Mute Role found, creating new one!")
                .then(async role => {
                    message.channel.send(`No Mute Role Setup, Creating **POLLUX-MUTE**...`);
                    await DB.servers.set(Server.id, {$set: {'modules.MUTEROLE': role.id}});
                    
                    commitMute(role.id)
                    setupMute(role)
                    
                }).catch(console.error)
                
                
            } else if (Server.roles.find(x => x.name === "POLLUX-MUTE" )) {
                console.log(1)
            let r = Server.roles.find(x => x.name === "POLLUX-MUTE"  )
            
            commitMute(r)
            setupMute(r)

        } else if (Server.roles.find(x=>x.id==muteRole)) {
            commitMute(muteRole)
            let r = Server.roles.find(x=>x.id==muteRole);
            setupMute(r)

        }

        function setupMute(role){
            Target.addRole(role.id,"MUTED BY "+message.author.tag+`  (${message.author.id})`);
            makeitMute(Target, role, time)
            roleout(time, role)
            logThis(time, timeTx)
            return message.channel.send(`**${Target.nick||Target.username}** was MUTED for ${timeTx}`)
        }
        function roleout(tm, role) {
            if (tm == undefined) return false;
            return setTimeout(f => {
                Target.removeRole(role.id);
                DB.mutes.expire( {S:Target.guild.id,U:Target.id} );
            }, tm * 60000)
        }


        function logThis(time, timeTx) {

            let chanpoint;

            let logchan = ServerDATA.modules.LOGCHANNEL
            let modchan = ServerDATA.modules.MODLOG

            if (logchan && Server.channels.has(logchan)) {
                chanpoint = Server.channels.get(logchan)
            }
            if (ServerDATA.splitLogs && modchan && Server.channels.has(modchan)) {
                chanpoint = Server.channels.get(modchan)
            }
            //console.log(chanpoint.name)

            if (chanpoint) {
                let id = Target.user.id
                let mess = message
                let emb = new gear.RichEmbed;

                emb.setThumbnail(Target.user.avatarURL)
                emb.setTitle(":mute: " + MUTED);
                emb.setDescription(`**${Target.user.username+"#"+Target.user.discriminator}** ${wasMUTED}`);
                //emb.addField("Channel",mess.channel,true)
                emb.addField(TIME, timeTx, true)
                emb.addField(RESPO, Author, true)
                //emb.addField("Message",mess.content,true)
                emb.setColor("#102af5");
                var ts = new Date
                emb.setFooter("Mute", Target.user.avatarURL)
                emb.setTimestamp(ts)

                chanpoint.send({
                    embed: emb
                }).catch(e => {
                    let a = (new Error);
                    gear.errLog(e, __filename, a.stack.toString())
                })

                var RevokeEmb = new gear.RichEmbed;

                RevokeEmb.setThumbnail(Target.user.avatarURL)
                RevokeEmb.setTitle(":mute: " + UNMUTE);
                RevokeEmb.setDescription(`**${Target.user.username+"#"+Target.user.discriminator}** ${wasAUTOUNMUTE}`);
                RevokeEmb.addField(RESPO, bot.user, true)
                RevokeEmb.setColor("#102af5");
                var ts = new Date
                RevokeEmb.setFooter("Unmute", Target.user.avatarURL)
                RevokeEmb.setTimestamp(ts)

                if (time && typeof time === "number") {

                    setTimeout(f => {
                        chanpoint.sendEmbed(RevokeEmb).catch()
                    }, time * 60000)
                }


            }


        }


        async function makeitMute(Mem, Rol, minutes) {
            let now = Date.now();
            let time = minutes * 60000;
            let freedom = now + time;
            await DB.mutes.add( {S:Mem.guild.id,U:Mem.id,E:freedom} );
        };


        function commitMute(role) {  
            Server.channels.forEach(chn => {
                console.log(chn.id)
                chn.editPermission(
                    role.id,
                    0,
                    2048,
                    "role",
                    'UPDATING MUTE OVERRIDES'
                ).then(x=>console.log(x)).catch(console.error)
            })
        };
        




    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    pub: false,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'mod',
    botperms: ["manageChannels", "manageRoles"]
};