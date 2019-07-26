const gear = require("../utilities/Gearbox/global");
module.exports = {
    run: async function yesNo(m,message,yes=false,no=false,timeout=false,options){
    options = options || {}
    let embed = options.embed|| (m.embeds||[])[0] || false;
    let avoidEdit = options.avoidEdit || !embed  || false;
    let time = options.time || 15000;
    let deleteFields = typeof options.deleteFields ? options.deleteFields : true;
    console.log(avoidEdit)
    let strings = options.strings || {}
        strings.confirm =strings.confirm|| "OK"
        strings.timeout   =strings.timeout|| "TIMEOUT"
        strings.cancel    =strings.cancel|| "CANCEL"

        
    let YA = {
      r: ":yep:339398829050953728",
      id: '339398829050953728'
    }
    let NA = {
      r: ":nope:339398829088571402",
      id: '339398829088571402'
    }
  
    await m.addReaction(YA.r);
          m.addReaction(NA.r);
    const reas = await m.awaitReactions( {
        maxMatches: 1,
        authorOnly:message.author.id,
        time
      }  
    ).catch(e => {
    m.removeReactions().catch();
    if(embed && !avoidEdit){
      embed.color =16499716;
      if(deleteFields===true) embed.fields = [];
      embed.footer ={text: strings.timeout};
      
      m.edit({embed});
    }
    if (timeout && typeof timeout == 'function')  return timeout();
    else if (timeout)  return timeout;
  });
  if (!reas || reas.length === 0 ) return;

  function cancellation(){
    m.removeReactions().catch();
    if(embed && !avoidEdit){
      embed.color = 16268605
      if(deleteFields===true) embed.fields = [];
      embed.footer ={text: strings.cancel};
      
      m.edit({embed}) 
    }
    if (no && typeof no == 'function')  return no();
    else if (no)  return no;
  }
  
  if (reas.length === 1 && reas[0].emoji.id == NA.id) {
    return cancellation();
  }
  
  if (reas.length === 1 && reas[0].emoji.id == YA.id) {
    if(embed && !avoidEdit){
      m.removeReactions().catch();
      embed.color = 1234499;
      if(deleteFields===true) embed.fields = [];
      embed.footer ={text: strings.confirm};
      m.edit({embed});
    }
      if (yes && typeof yes == 'function')  return yes(cancellation);
      else if (yes)  return yes;
  } 
  }
}