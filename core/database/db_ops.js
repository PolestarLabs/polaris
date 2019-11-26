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
       ,commends       : miscDB.commends
       ,audits         : miscDB.audit
       ,control        : miscDB.control
       ,marketplace    : miscDB.marketplace
       ,reactRoles     : miscDB.reactRoles
       ,relationships  : miscDB.relationships
       ,alerts         : miscDB.alert
       ,feed           : miscDB.feed
       ,usercols       : miscDB.usercols
       ,gifts          : miscDB.gift
   /////////////////////////////////////////////////////
   ,cosmetics     : require('./schemas/cosmetics.js')
   ,collectibles  : require('./schemas/collectibles.js')
   ,items         : require('./schemas/items.js')
   ,achievements  : require('./schemas/achievements.js')
   ,mutes         : require('./schemas/mutes.js')
   
   
   ,users:    userDB
   ,servers:  serverDB
   ,guilds:   serverDB
   ,channels: channelDB
   ,globals:  miscDB.global
   ,marketbase: async function refreshBases(projection){
   
     let [bgBase,mdBase,stBase,itBase] = await Promise.all([
        this.cosmetics.find({type:"background", /*tradeable:true*/}, {type:1, rarity:1, _id:0, id:1, name:1, price:1, code:1,}).lean().exec()
        ,this.cosmetics.find({type:"medal",      /*tradeable:true*/}, {type:1, rarity:1, _id:0, id:1, name:1, price:1, icon:1,}).lean().exec()
        ,this.cosmetics.find({type:"sticker",    /*tradeable:true*/}, {type:1, rarity:1, _id:0, id:1, name:1, price:1}).lean().exec()
        ,this.items.find(    {                   /*tradeable:true*/}, {type:1, rarity:1, _id:0, id:1, name:1, price:1, icon:1}).lean().exec()
    ]);
    bgBase=bgBase.map(itm=> { return {
         name:itm.name,
         img:"/build/backdrops/"+itm.code+".png",
         id:itm.code,
         type:itm.type,
         rarity:itm.rarity,
         price:itm.price
       }
     })
     mdBase=mdBase.map(itm=> { return {
       name:itm.name,
       img:"/medals/"+itm.icon+".png",
       id:itm.icon,
       type:itm.type,
       rarity:itm.rarity,
       price:itm.price
     }
   })
   stBase=stBase.map(itm=> { return {
   
       name:itm.name,
       img:"/build/stickers/"+itm.id+".png",
       id:itm.id,
       type:itm.type,
         rarity:itm.rarity,
         price:itm.price
       }
      })
      itBase=itBase.map(itm=> { return {
        name:itm.name,
         img: itm.type == "boosterpack" ? "/boosters/showcase/"+itm.id.replace("_booster",".png") : "/build/items/"+itm.icon+".png",
         id:itm.id,
         type:itm.type,
         rarity:itm.rarity,
         price:itm.price
       }
      })
      
     
     fullbase = [].concat.apply([],[bgBase,mdBase,stBase,itBase])
      if(projection){
        bgBase    = !projection.bgBase    ? null : bgBase;
        mdBase    = !projection.mdBase    ? null : mdBase;
        stBase    = !projection.stBase    ? null : stBase;
        itBase    = !projection.itBase    ? null : itBase;
        fullbase  = !projection.fullbase  ? null : fullbase;
      }
       return {bgBase,mdBase,stBase,itBase,fullbase};
     }
   
 };