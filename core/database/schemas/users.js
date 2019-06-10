let mongoose = require('mongoose');
let utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = mongoose.Schema.Types.Mixed;

const UserSchema = new mongoose.Schema({
  id: {type:String,required: true,index:{unique:true}},
  name: String,
  personalhandle: {type: String, trim: true, index: true, unique: true, sparse: true},
  meta:Mixed,

  //PREMIUM
  switches:Mixed,
  spdaily:Mixed,
  rewardsMonth:Number,
  rewardsClaimed: Boolean,

  //CONTROL
  personal:Mixed,
  tag:  String,

  //COUNTERS
  eventDaily:Number,
  eventGoodie:Number,

  cherries:Number,
  cherrySet:Mixed,
  lastUpdated: { type: Mixed },

  //OLD BL
  blacklisted:String,
  married:Array,
  eventThing:Mixed,

  //MODULES
  counters: Mixed,
  modules: {
      powerups:Mixed,
      lovepoints:Number,
      PERMS: {type:Number,default:3},

      //LEVEL
      level: {type:Number,default:0,index:true},
      exp: {type:Number,default:0, min:0,index:true},

      //PROFILE
      persotext: {type:String, default:"I have no personal text because I'm too lazy to set one."},
      tagline:{type:String, default:"A fellow Pollux user"},
      rep:{type:Number,default:0},
      repdaily:{type:Number,default:0},

      favcolor: {type:String,default:"#eb497b"},
      inventory: {type:Array,default:["lootbox_dev"]},
      bgID:{type:String,default:"5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6"},
      sticker:String,
      bgInventory:{type:Array,default:["5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6"]},
      skins: Mixed,
      skinInventory: [String],
      //skin: {type: String, default:'default'},
      //skinsAvailable: Array,
      achievements: Array,

      //FINANCES
      sapphires: {type:Number,default:0},
      rubines:  {type:Number,default:500, index:true},
      jades:    {type:Number,default:2500, index:true},
      coins:  {type:Number,default:0},

      dyStreakHard:  {type:Number,default:0},
      daily:  {type:Number,default:1486595162497},

      flairTop: { type: String ,default:'default'},
      flairDown: { type: String ,default:'default'},
      flairsInventory:  Array,

      //cosmetics

           //----MEDALS
              medals: {type:Array,default:[0,0,0,0,0,0,0,0,0]},
              medalInventory: Array,

           //-/---CARDS
              //cards: Array,
              //cardInventory: Array,
              //cardCollection: Array,
           //----STAMPS
              //stampInventory: Array,
              //stampCollection: Array,
           //----STICKERS
              stickerInventory: Array,
              stickerCollection: Array,
           //----FISHES
              fishes: Array,
              fishCollection: Array,
           //----ELEMENTS
              //elements: Array,
              //elementCollection: Array,
           //----FLOWERS
              //flowers: Array,
              //flowerCollection: Array,

      //-------------------------------

      // MIS


      /*
      build: {
          STR: {type:Number,default:10},
          DEX: {type:Number,default:10},
          CON: {type:Number,default:10},
          INT: {type:Number,default:10},
          WIS: {type:Number,default:10},
          CHA: {type:Number,default:10},
          weaponA: {type:String,default:'none'},
          weaponB: {type:String,default:'none'},
          shield: {type:String,default:'none'},
          armor: {type:String,default:'none'},
          invent: Array,
          skills: Array,
          HP: {type:Number,default:100},
          MP:{type:Number,default:100}
      },
      */
     commend:Number,
     commended:Number,
      fun: {
          waifu: Mixed,
          lovers: Mixed,
          shiprate: Mixed
      },
      statistics: Mixed
  },

  partner:Boolean,
  polluxmod:Boolean,
  donator:String,
  donatorActive:String,
  limits:Mixed

    },{ strict: false });

UserSchema.pre(/^update/, function() {
  this.update({},{ $set: { lastUpdated: new Date() } });
});

UserSchema.methods.addItem = function receiveItem(itemId,amt=1){
  const items = require('./items.js');
  return items.receive(this.id,itemId,amt);
}

UserSchema.methods.upCommend = function upCommend(USER,amt=1){
  const miscDB = require('./_misc.js');
  return new Promise(async resolve=>{
    await Promise.all([
      miscDB.commends.new(this),
      miscDB.commends.new(USER),
    ]);
    await Promise.all([
      miscDB.commends.updateOne({'id': this.id , 'whoIn.id':{$ne:USER.id}},{$addToSet: {'whoIn' : {id:USER.id} }}),
      miscDB.commends.updateOne({'id': USER.id , 'whoOut.id':{$ne:this.id}},{$addToSet: {'whoOut' : {id:this.id} }})
    ]);      
    await Promise.all([
      miscDB.commends.updateOne({id:this.id,'whoIn.id':USER.id},{$inc:{'whoIn.$.count':amt}}),
      miscDB.commends.updateOne({id:USER.id,'whoOut.id':this.id},{$inc:{'whoOut.$.count':amt}})
      ]);

      let res = await miscDB.commends.get(this.id); 
      resolve(res)
    
  })
}

UserSchema.methods.amtItem = function amountItem(itemId){
  return (this.modules.inventory.find(itm=>itm.id == itemId)||{}).count || 0;
}

UserSchema.methods.removeItem = function destroyItem(itemId,amt=1){
  const items = require('./items.js');
  return items.consume(this.id,itemId,amt);
}
UserSchema.methods.addXP = function addXP(amt=1){
  return this.update({},{ $inc: { 'modules.exp': amt } });
}

UserSchema.methods.incrementAttr = function incrementAttr(attr,amt=1,upper=false){
  let attrib = upper ? attr : 'modules.'+attr; 
  return this.model("UserDB").updateOne({id:this.id},{ $inc: { ['modules.'+attr] : amt } });
}

let MODEL = mongoose.model('UserDB', UserSchema, 'userdb');

MODEL.updateMeta = U => {
  return new Promise(async resolve =>
    MODEL.updateOne({id: U.id}, {
      $set: {
        meta: {
          tag: U.tag,
          username: U.username,
          discriminator: U.discriminator,
          avatar: U.displayAvatarURL,
          staticAvatar: (U.displayAvatarURL||"").replace('gif','png')
        }
      }
    })
  );
};


MODEL.new = userDATA => {
  MODEL.findOne({id: userDATA.id}, (err, newUser) => {
    if (err) {
        console.error(err)
    }
    if (newUser) {
      // Nothing
    } else {
        let user = new MODEL({
          id: userDATA.id,
          name:userDATA.username,
          tag:userDATA.tag
        });
        user.save((err) => {
          if (err) return console.error(err);
          //console.log("[NEW USER]".blue,userDATA.tag.yellow,`(ID:${userDATA.id})`);
          MODEL.updateMeta(userDATA);
        });
    }
  });

  return MODEL.findOne({id:userDATA.id})
}




MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;
module.exports = MODEL;
