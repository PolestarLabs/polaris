const 
    miscDB        = require('./schemas/_misc.js')
   ,serverDB      = require('./schemas/servers.js')
   ,userDB        = require('./schemas/users.js')
   ,channelDB     = require('./schemas/channels.js')
   ,svMetaDB      = require('./schemas/serverMeta.js');


 module.exports = {   
   
   serverDB       
   ,userDB        
   ,channelDB     
   ,svMetaDB      
   ,localranks    : require('./schemas/localranks.js')
   ,responses     : require('./schemas/responses.js')
    ,miscDB /////////////////////////////////////////////
       ,buyables       : miscDB.buyables
       ,fanart         : miscDB.fanart
       ,globalDB       : miscDB.global
       ,audits         : miscDB.audit
   /////////////////////////////////////////////////////
   ,cosmetics     : require('./schemas/cosmetics.js')
   ,collectibles  : require('./schemas/collectibles.js')
   ,items         : require('./schemas/items.js')
   ,achievements  : require('./schemas/achievements.js')
   
   
   ,users:    userDB
   ,servers:  serverDB
   ,guilds:   serverDB
   ,channels: channelDB
   ,globals:  miscDB.global
   
 };