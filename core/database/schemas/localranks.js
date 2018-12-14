let mongoose = require('mongoose');
let utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = mongoose.Schema.Types.Mixed;

const aRANK = new mongoose.Schema({
   server: {type:String,required: true,index:{unique:false}},
   user: {type:String,required: true,index:{unique:false}},
   level: Number,
   exp: Number,
   lastUpdated: Date
});

let MODEL = mongoose.model('Localranks', aRANK, 'localranks');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

MODEL.new = (US) => {
  let U=(US.U||{id:US.U}).id;
  let S=(US.S||{id:US.S}).id;
MODEL.findOne({user:U,server:S}, (err, rank) => {
   if (err) {
      console.error(err)
   }
   if (rank) {
     // Nothing
   } else {
      let rank = new MODEL({
        server: S,
        user: U,
        level: 0,
        exp: 0
      });
      rank.save((err) => {
        if (err) return console.error(err);
        console.log("[NEW RANK]".blue,S.yellow,`(${U}) User`);
      });
   }
});
}

MODEL.incrementExp= (US,X=1) => {
  return MODEL.updateOne({user:US.U,server:US.S},{$inc:{exp:X}});
}
MODEL.incrementLv= (US,X=1) => {
  return MODEL.updateOne({user:US.U,server:US.S},{$inc:{level:X}});
}

module.exports = MODEL;
