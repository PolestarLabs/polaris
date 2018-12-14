const mongoose = require('mongoose');
const Schema = mongoose.Schema
const utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = Schema.Types.Mixed;


const Achievement = new Schema({

  trigger:  {type:String,required: true},
  response: String,
  server: {type:String,required: true,index:{unique:false}},  
  id: {type:String,required: true,index:{unique:true}},
  embed: Mixed,
  type: String // EMBED, STRING, FILE
  
})

let MODEL = mongoose.model('achievements', Achievement, 'achievements');

MODEL.award = (user,achiev) => {
  const userDB = require('./users.js');
  return new Promise(async resolve => {
    await userDB
      .updateOne({'id': user.id || user},{$addToSet: {'modules.achievements' : achiev}}).then(res=>{
      return resolve(res)
    });
    })    
  }


MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;