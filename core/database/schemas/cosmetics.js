const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;


const cosmetics = Schema({
  id: String,
  name: String,
  tags: String,
  series: String,
  series_id: String,
  type: String,
  icon: String,
  code: String,
  rarity: String,
  price: Number,
  event: String,
  droppable: Boolean,
  buyable: Boolean,
  howto:String,
  category:String,
  items:Array,
  color:String,
  for:String,
  localizer:String,
  exclusive:String,
  public:Boolean,
  filter:String
},{ strict: false });

let MODEL = mongoose.model('cosmetics', cosmetics, 'cosmetics');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

MODEL.bgs      = filter => MODEL.find(filter||{public:true,type:"background"}).sort({_id:1})
MODEL.medals   = filter => MODEL.find(filter||{public:true,type:"medal"}).sort({_id:1})
MODEL.stickers = filter => MODEL.find(filter||{public:true,type:"sticker"}).sort({_id:1})

module.exports = MODEL;