const axios = require("axios");

const getAllCommands = (guild) => {
    if (guild) return PLX.requestHandler.request("GET", `/applications/${PLX.user.id}/guilds/${guild}/commands`, true);
    else return PLX.requestHandler.request("GET", `/applications/${PLX.user.id}/commands`, true);
}

const disableCommand = (commandID, guild) => {
    if (guild) return PLX.requestHandler.request("DELETE", `/applications/${PLX.user.id}/guilds/${guild}/commands/${commandID}`, true);
    else return PLX.requestHandler.request("DELETE", `/applications/${PLX.user.id}/commands/${commandID}`, true);
}

const createCommand = (payload, guild) => {
    if (guild) return PLX.requestHandler.request("POST", `/applications/${PLX.user.id}/guilds/${guild}/commands`, true, payload);
    else return PLX.requestHandler.request("POST", `/applications/${PLX.user.id}/commands`, true, payload);
}
const updateCommand = (cmdID, payload, guild) => {
    if (guild) return PLX.requestHandler.request("PATCH", `/applications/${PLX.user.id}/guilds/${guild}/commands/${cmdID}`, true, payload);
    else return PLX.requestHandler.request("PATCH", `/applications/${PLX.user.id}/commands/${cmdID}`, true, payload);
}

exports.proc = async function (cmdFile) {

    //console.log('•'.blue, "Register Slash CMD for",cmdFile.cmd?.inverse);
    //return;
    if (cmdFile?.slashOptions?.guilds) {
        
        console.log('    •'.cyan, "Local:".blue);
        
        cmdFile.slashOptions.guilds.forEach(async guild => {
            let guildCommands = await getAllCommands(guild);
            
            console.log('        -', guild?.gray);

            let currentCommand = guildCommands.find(c => c.name === cmdFile.cmd ||c.name === cmdFile?.contextMenu?.name);

            if (currentCommand) {
                if (cmdFile.disabled) {
                    console.log('        •'.red, "Disable...".gray,guild);
                    await disableCommand(currentCommand.id, guild);
                } else {
                    console.log('        •'.yellow, "Update...".gray,guild);
                    
                    if (!cmdFile.slashOptions) return console.log("No Slash options for".red ,cmdFile.cmd);
                    updateCommand(currentCommand.id, {
                        name: cmdFile.cmd,
                        description: cmdFile.slashOptions.description || $t(`commands:help.${cmdFile.cmd}`, "No Command Description"),
                        options: cmdFile.slashOptions.options

                    }, guild);
                }
            }

            if (cmdFile.contextMenu){
                if (currentCommand?.name === cmdFile.contextMenu.name){
                    console.log('       ••'.green, "UPDATE Context Menu...".gray,guild, cmdFile.contextMenu.name);
                    await updateCommand(currentCommand.id, {
                        name: cmdFile.contextMenu.name,
                        type: cmdFile.contextMenu.type,
                    }, guild);
                }else{
                    console.log('       ••'.green, "CREATE Context Menu...".gray,guild, cmdFile.contextMenu.name);
                    await createCommand({
                        name: cmdFile.contextMenu.name,
                        type: cmdFile.contextMenu.type,
                    }, guild);
                }
            }
            
            if (!currentCommand) {
                console.log('        •'.bgGreen, "Create...".green,guild);
                if (!cmdFile.slashOptions) return console.log("No Slash options for".red ,cmdFile.cmd);
                await createCommand({
                    name: cmdFile.cmd,
                    description: cmdFile.slashOptions.description || $t(`commands:help.${cmdFile.cmd}`, "No Command Description"),
                    options: cmdFile.slashOptions.options

                }, guild);
            }
        })
    }

    if (cmdFile?.slashOptions?.global) {
        
        console.log('    •'.cyan, "Global:".yellow);

        let globalCommands = await getAllCommands();
        let currentCommand = globalCommands.find(c => c.name === cmdFile.cmd || c.name === cmdFile.contextMenu?.name);
        if (currentCommand) {
            if (cmdFile.disabled) {
                console.log('       ••'.red, "Disable...".gray, cmdFile.cmd);
                await disableCommand(currentCommand.id);
            } else {
                console.log('       ••'.yellow, "Update...".gray, cmdFile.cmd);
                
                if (!cmdFile.slashOptions) return console.log("No Slash options for".red ,cmdFile.cmd);
                updateCommand(currentCommand.id, {
                    name: cmdFile.cmd,
                    description: cmdFile.slashOptions.description || $t(`commands:help.${cmdFile.cmd}`, "No Command Description"),
                    options: cmdFile.slashOptions.options

                });
            }
        }
        if (cmdFile.contextMenu){
            if (currentCommand?.name === cmdFile.contextMenu.name){
                console.log('       ••'.green, "UPDATE Context Menu...".yellow, cmdFile.contextMenu.name);
                await updateCommand(currentCommand.id, {
                    name: cmdFile.contextMenu.name,
                    type: cmdFile.contextMenu.type,
                });
            }else{
                console.log('       ••'.green, "Create Context Menu...".green, cmdFile.contextMenu.name);
                await createCommand({
                    name: cmdFile.contextMenu.name,
                    type: cmdFile.contextMenu.type,
                });
            }            
        }
        if (!currentCommand) {
            console.log('       ••'.green, "Create...".gray, cmd.cmdFile);
            if (!cmdFile.slashOptions) return console.log("No Slash options for".red ,cmdFile.cmd);
            await createCommand({
                name: cmdFile.cmd,
                description: cmdFile.slashOptions.description || $t(`commands:help.${cmdFile.cmd}`, "No Command Description"),
                options: cmdFile.slashOptions.options

            });
        }

    }

}