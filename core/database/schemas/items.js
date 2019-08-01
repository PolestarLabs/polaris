const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;



const Item = new Schema({
  name:         String,
  id:           {type:String,index:{unique:true}},
  rarity:       {type:String,default:"C"},
  icon:         {type:String,default:"item"},
  emoji:        {type:String,default:":package:"},
  price:        {type:Number,default:1000},
  altEmoji:     {type:String,default:":package:"},
  event:        String,
  event_id:     Number,
  type:         {type:String,default:'item'},
  tradeable:    {type:Boolean,default:true},
  buyable:      {type:Boolean,default:true},
  destroyable:  {type:Boolean,default:true},
  usefile:      {type:String,default:'notusable'},
  code:         String,
  misc:         Mixed,
  subtype:       String,
  series:       String,
  filter:       String,
  crafted:       Boolean,
  color:String,
  exclusive:String,
  public:Boolean,
  materials: Array,
  gemcraft: {
    rubines: Number,
    jades: Number,
    sapphires :Number
  }

},{ strict: false });


let MODEL = mongoose.model('Item', Item, 'items');

MODEL.getAll    = async function(){return (await MODEL.find({}))};
MODEL.get    = async function(id){
  return (await MODEL.findOne({id:id}))
};

MODEL.cat    = async function(cat){
  return (await MODEL.findOne({type:cat}))
};

const itemOperation = (user,item,amt) => {
  if(user && user.user && user.item && user.amt){
    user = user.user
    item = user.item
    amt  = user.amt
  };
  const userDB = require('./users.js');
  return new Promise(async resolve => {
    await userDB
      .updateOne({'id': user.id || user, 'modules.inventory.id':{$ne:item}},{$addToSet: {'modules.inventory' : {id:item} }}).then(y=>{
      userDB.updateOne({'id': user.id || user,'modules.inventory.id': item}, {//
        $inc: {'modules.inventory.$.count': amt}
    }).then(res=>{
      return resolve(res)
    });
    })
  })
};

MODEL.consume = function (user, item, amt=1) {
  return itemOperation(user,item,-amt)
};
MODEL.destroy = MODEL.consume;


MODEL.receive = function (user, item, amt=1) {
  return itemOperation(user,item,amt)
};
MODEL.add = MODEL.receive;


MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;