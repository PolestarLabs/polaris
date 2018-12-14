const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;


const collectibles = new Schema({
  name: String,
  id: {type:String,index:{unique:true}},
  rarity: String,
  icon: String,
  emoji: String,
  attribs: Mixed

})

let MODEL = mongoose.model('collectibles', collectibles, 'collectibles');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;
