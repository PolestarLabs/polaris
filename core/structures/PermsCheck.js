const i18node = require('../../utils/i18node');
//const $t = i18node.getT();

exports.run = function(cat,msg,perms){
  
  if (!msg.channel.permissionsOf(POLLUX.user.id).has("sendMessages")){
    return;// 'error chan permis catchcheck'
  }
    
  if(perms&&typeof perms == "object"){
    for(i in perms){
      if (!msg.channel.permissionsOf(POLLUX.user.id).has(perms[i])){
        try{ 
          
          msg.addReaction(":nope:339398829088571402")
      msg.channel.send($t('error.iNeedThesePerms',{lngs:msg.lang,})+`
${"• "+perms.join('\n• ')}
`)
          }catch(e){
            
          }
          return "error1";
          break;
        }
      }
    }
  
  
  if(['img','social','cosmetics'].includes(cat)){    
    if (!msg.channel.permissionsOf(POLLUX.user.id).has("attachFiles")){
      msg.addReaction(":nope:339398829088571402")
      msg.channel.send($t('error.iNeedThesePerms',{lngs:msg.lang,})+`
• \`ATTACH_FILES\`
`)
      return "error2";
    }
  }
  return "ok"
  
}