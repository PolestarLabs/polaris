const axios = require("axios");

const getAllCommands = (guild) => {
    if (guild) return PLX.requestHandler.request("GET",`/applications/${PLX.user.id}/guilds/${guild}/commands`,true);
    else  return PLX.requestHandler.request("GET",`/applications/${PLX.user.id}/commands`,true);
}

const disableCommand = (commandID,guild) => {
    if (guild) return PLX.requestHandler.request("DELETE",`/applications/${PLX.user.id}/guilds/${guild}/commands/${commandID}`,true);
    else  return PLX.requestHandler.request("DELETE",`/applications/${PLX.user.id}/commands/${commandID}`,true);
}

const createCommand = (payload,guild) => {
    console.log(payload,'payload')
    if (guild) return PLX.requestHandler.request("POST",`/applications/${PLX.user.id}/guilds/${guild}/commands`,true, payload);
    else  return PLX.requestHandler.request("POST",`/applications/${PLX.user.id}/commands`,true, payload);
}

exports.proc = function(cmdFile){
    
    if (cmdFile?.slashOptions?.guilds){
        console.log('guilds');
        cmdFile.slashOptions.guilds.forEach( async guild=>{
            console.log({guild})
            let guildCommands = await getAllCommands(guild);
            let currentCommand = guildCommands.find(c=>c.name === cmdFile.cmd);
            if (currentCommand){
                if (cmdFile.disabled){
                    await disableCommand( currentCommand.id , guild );
                }
            }else{
                await createCommand( {
                    name: cmdFile.cmd,
                    description: cmdFile.slashOptions.description || $t(`commands:help.${cmdFile.cmd}`,"No Command Description"),
                    options:  cmdFile.slashOptions.options

                } , guild);
            }
        })
    }
    
}