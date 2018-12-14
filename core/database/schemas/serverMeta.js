let mongoose = require('mongoose');
let utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = mongoose.Schema.Types.Mixed;

const ServerSchema = new mongoose.Schema({
   id: {type:String,required: true,index:{unique:true}},
   name: String,
   size: Number,
   roles: Array,
   adms: Array,
   channels: Array ,
   icon: String,
});

let MODEL = mongoose.model('ServerMetadata', ServerSchema, 'sv_metadata');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;
module.exports = MODEL;
