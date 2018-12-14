const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;


const responses = new Schema({

  trigger:  {type:String,required: true},
  response: String,
  server: {type:String,required: true,index:{unique:false}},  
  id: {type:String,required: true,index:{unique:true}},
  embed: Mixed,
  type: String // EMBED, STRING, FILE
  
})

let MODEL = mongoose.model('responses', responses, 'responses');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;