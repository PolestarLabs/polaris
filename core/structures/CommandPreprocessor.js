const cfg = require('../../config.json');
// const gear = require('../utilities/Gearbox/global');
const readdirAsync = Promise.promisify(require('fs').readdir);

const commandRoutine = require('../subroutines/onEveryCommand');
const CMD_FOLDER = "../commands/"

const POST_EXEC = function CommandPostExecution(msg,args,success){
    if(success) return null;
    return "exec fail"
}
const PERMS_CALC = function CommandPermission(msg){
    let uIDs = msg.command.module == "_botOwner"  
        ? [cfg.owner]
        : msg.command.module == "_boStaff" 
            ? cfg.admins
            : PLX.beta ? [cfg.owner] : cfg.admins;
    let switches = !((msg.guild.DISABLED||[]).includes(msg.command.label) || (msg.guild.DISABLED||[]).includes(msg.command.cat));

    let perms = msg.command.botPerms
    if (perms){
      delete require.cache[require.resolve('./PermsCheck.js')];
      let permchk = require('./PermsCheck.js').run(msg.command.cat, msg, perms)
      if (permchk !== 'ok') return false;
    }


    return (switches && uIDs);
}

const DEFAULT_CMD_OPTS = {
    caseInsensitive: true
    ,invalidUsageMessage: (msg)=> {
        if(msg.command.parentCommand){
            msg.command.cmd = msg.command.parentCommand.cmd
            msg.command.cat = msg.command.parentCommand.cat
        }
        PLX.autoHelper( 'force', {msg, cmd: msg.command.cmd, opt: msg.command.cat} )
    }
    ,cooldown: 2000     
    ,cooldownMessage: "Too Fast"
    ,cooldownReturns: 2
    ,requirements: {custom:PERMS_CALC}
    ,permissionMessage: (msg)=>{msg.addReaction(_emoji('nope').reaction);return false} 
    ,hooks:  {
        preCommand: (m,a) => {
            m.args = a;
            m.lang = [m.channel.LANG || (m.guild || {}).LANG || 'en', 'dev'];
        },
        postCheck: (m,a,chk) => {
            if(!chk) return null;
            m.channel.sendTyping();
            commandRoutine.commLog(m, m.command)
            commandRoutine.updateMeta(m, m.command)
        },
        postCommand: (m,a,response) => {
            commandRoutine.saveStatistics(m, m.command)
            commandRoutine.administrateExp(m.author.id, m.command)
        }
    }
    ,errorMessage: "ERROR! Aaaaa!"
    ,hidden : false
}


const registerOne = (folder, _cmd) => {
    try {
        delete require.cache[require.resolve((`${CMD_FOLDER}/${folder}/${_cmd}`))]
        let commandFile = require(`${CMD_FOLDER}/${folder}/${_cmd}`);
        //commandFile.fill = function (_, $) { !(_ in this) && (this[_] = $) };      
        commandFile.hidden = !commandFile.pub //legacy port

        if(commandFile.noCMD) return null;

        const CMD = PLX.registerCommand(_cmd, commandFile.init, commandFile)
        //console.info("Register command: ".blue, _cmd.padEnd(20, ' '), " ✓".green)
        PLX.commands[CMD.label].cmd = commandFile.cmd
        PLX.commands[CMD.label].cat = commandFile.cat
        PLX.commands[CMD.label].module = folder
        PLX.commands[CMD.label].botPerms = commandFile.botPerms
        if (commandFile.subs) {
            commandFile.subs.forEach(sub => {
                delete require.cache[require.resolve(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`)];
                let subCfile = require(`${CMD_FOLDER}/${folder}/${_cmd}/${sub}`);

                CMD.registerSubcommand(sub, subCfile.init, subCfile)
            })
        }
        if (commandFile.teleSubs) {
            commandFile.teleSubs.forEach(TELE => {
                delete require.cache[require.resolve(`${CMD_FOLDER}/${TELE.path}`)];
                let subCfile = require(`${CMD_FOLDER}/${TELE.path}`);

                CMD.registerSubcommand(TELE.label, (msg,args)=>subCfile.init(msg,args,TELE.pass), subCfile)
            })
        }
        if (commandFile.autoSubs) {
            commandFile.autoSubs.forEach(AUTOSUB => {              
                CMD.registerSubcommand(AUTOSUB.label, AUTOSUB.gen, AUTOSUB.options)
            })
        }
        CMD.registerSubcommand("help", DEFAULT_CMD_OPTS.invalidUsageMessage)

    } catch (e) {
        console.info( " SoftERR ".bgYellow ,_cmd.padEnd(20, ' ').yellow,e.message.red)
        //console.info("Register command: ".blue, _cmd.padEnd(20, ' ').yellow, " ✘".red)
        //console.error("\r                                " + e.message.red)
    }
};
const registerCommands = (rel) => {
    if (rel) {
        Object.keys(PLX.commands).forEach(cmd => PLX.unregisterCommand(cmd))
    }
    readdirAsync('./core/commands').then(modules => {
        modules.forEach(async folder => {
            let commands = (await readdirAsync('./core/commands/' + folder)).map(_c => _c.split('.')[0]);
            commands.forEach(_cmd => registerOne(folder, _cmd));
        })
    })
};


module.exports = {
    registerCommands,
    commandRoutine,
    registerOne,
    DEFAULT_CMD_OPTS
}