let mongoose = require('mongoose');
let utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = mongoose.Schema.Types.Mixed;

const ServerSchema = new mongoose.Schema({

        id: {type:String,required: true,index:{unique:true}},
        name: String,
        globalhandle:String,
        globalPrefix:{type:Boolean,default:true},
        respondDisabled:{type:Boolean,default:true},
        event:Mixed,
        eventReg:String,
        partner:{type:Boolean,default:false},
        partnerDetails:Mixed,
        utilityChannels:Mixed,
        logging: {type:Boolean, default:false},
        imgwelcome: {type:Boolean, default:false},
        splitLogs:{type:Boolean, default:false},
        switches: Mixed,
        modules: {
            BUSTER:Mixed,
            shitpostFeed:Mixed,
            GREET: {
                enabled:      {type:Boolean,default:false},
                text:         {type:String,default:"Welcome to the Server **%username%**!"},
                channel:  String,
                timer: {type:Number,default:0}
            },
            FWELL: {
                enabled:{type:Boolean,default:false},
                text:   {type:String,default:"%username% has left us!"},
                channel:  String,
                timer: {type:Number,default:0}
            },
            LVUP:       {type:Boolean, default:true},
            LVUP_local: {type:Boolean, default:false},
            autoRoleStack: {type:Boolean, default:true},
            DROPS:      {type:Boolean, default:true},
            ANNOUNCE:   {type:Boolean, default:true},
            PREFIX:     {type:String,  default:"+"},
            LANGUAGE:   {type:String, default:"en"},
            MODROLE:    String,
            DISABLED:   Array,
            MUTEDUSERS: Array,
            MUTEROLE:   String,
            SELFROLES:  Array,
            AUTOROLES:  Array,
            ROLEMARKET: Array,
            REACTIONS : Mixed,
            ACTLOG:String,
            MODLOG:String,
            ADVLOG:String,
            LOGCHANNEL:String,
            customMedals:Mixed,
            legendaryFish:String,
            pondSize: { type: Number,min: 1},
            background:String,
            bgInventory:  Array,
            UPFACTOR:{type: Number,default:0.1},
            statistics: Mixed,
            putometro_last:{type: Number},
            putometro_max:{type: Number}
        },
        logs: {

            act:{
              userJoin:   {type:Boolean,default:true},
              userLeave:  {type:Boolean,default:true},
              messDel:    {type:Boolean,default:false},
              messEdit:   {type:Boolean,default:false}
            },

            mod:{
              usrBan:     {type:Boolean,default:true},
              usrKick:    {type:Boolean,default:true},
              usrMute:    {type:Boolean,default:true},
              usrUnmute:  {type:Boolean,default:true}
            },

            adv:{
              newChan:    {type:Boolean,default:false},
              newRole:    {type:Boolean,default:false},
              permsEdit:  {type:Boolean,default:false},
              revokeBan:  {type:Boolean,default:true},
              uptRole:    {type:Boolean,default:false},
              delChan:    {type:Boolean,default:false},
              usrNick:    {type:Boolean,default:true},
              usrPhoto:   {type:Boolean,default:false},
              usrRoles:   {type:Boolean,default:false}
            }
          },
        channels: Mixed,
        lastUpdated: Mixed
    },{ strict: false });


ServerSchema.pre(/^update/, function() {
  this.update({},{ $set: { lastUpdated: new Date() } });
});

let MODEL = mongoose.model('ServerDB', ServerSchema, 'serverdb');

let META = require('./serverMeta.js');

META.updateMeta = function (S) {
  return new Promise(async resolve => {
    MODEL.findOne({id:S.id}).then(data=>{
    let admins =S.members.filter(mb=>mb.id===S.ownerID||mb.hasRole({id:data.modules.MODROLE})===true).map(mb=>mb.id);
      let meta = {
              id:S.id,
             name: S.name,
             size: S.members.size,
             roles: S.roles.map(rl=>{return{name:rl.name,color:rl.hexColor,id:rl.id}}),
             adms: admins,
             channels: S.channels.map((rl,index)=>{return{name:rl.name,pos:rl.position,id:rl.id,cat:(rl.parent||{name:"---"+index+"---"}).name,type:rl.type,nsfw:rl.nsfw,topic:rl.topic}}),
             icon: S.iconURL
           }
      META.findOne({id:S.id}, (err, guild) => {
         if (err) {
            console.error(err)
         }
          if (guild) {
            META.updateOne({id: S.id}, {
               $set:{
                 meta
               }
            }).then(x=>{
              resolve(true)
              //resolve(console.log("[DATABASE]".yellow,"Meta updated for ",S.id))
            });
          } else {
            let guild = new META(meta);
            guild.save((err) => {
              if (err) return console.error(err);
              prompt = ["[NEW META]".blue,S.name.yellow,`(${S.members.size})Members`].join(' ')
              //console.log(prompt);
              resolve(prompt)
            });
          }
    });
  });
});
};
MODEL.updateMeta = S=> META.updateMeta(S);
MODEL.meta = S=> META.get

MODEL.new = svDATA => {
MODEL.findOne({id: svDATA.id}, (err, guild) => {
   if (err) {
      console.error(err)
   }
   if (guild) {
     // Nothing
   } else {
      let guild = new MODEL({
         id: svDATA.id,
         meta: svDATA,
         prefix: '+',
         modules:{LANGUAGE: 'en'},
         meta:null
      });
      guild.save((err) => {
        if (err) return console.error(err);
        //console.log("[NEW SERVER]".blue,svDATA.name.yellow,`(${svDATA.members.size})Members`);
        META.updateMeta(svDATA);
      });
   }
});
}

MODEL.cat   = 'guilds'
MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;
module.exports = MODEL;