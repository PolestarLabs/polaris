const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;


const promo = new Schema({

  code: {type:String,required: true,index:{unique:true}},  
  used: Boolean,
  activated_by: String,
  prize: Mixed,
})

let MODEL = mongoose.model('promo-codes', promo, 'promo-codes');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;