PLX.sendJSON = (channel,object) => {
    return PLX.createMessage(channel,("```json\n"+JSON.stringify(object,null,2)).slice(0,1990)+"```");
}