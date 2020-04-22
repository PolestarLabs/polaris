let mongoose = require('mongoose');
let utils = require('../../structures/PrimitiveGearbox.js');
const Mixed = mongoose.Schema.Types.Mixed;

const TEMPROLE = new mongoose.Schema({
   server: {type:String,required: true,index:{unique:false}},
   user: {type:String,required: true,index:{unique:false}},
   role: {type:String,required: true,index:{unique:false}},
   expires: Number,
});

let MODEL = mongoose.model('TempRoles', TEMPROLE, 'TempRoles');

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

MODEL.new = (US) => {
    let R=(US.R);
    let U=US.U?.id || US.U;
    let S=US.S?.id || US.S;
    let E=US.E || 0

MODEL.findOne({user:U,server:S}, (err, mute) => {
   if (err) {
      console.error(err)
   }
   if (mute) {
      MODEL.updateOne({user:U,server:S},{$set:{expire:E} });
     console.log("[TEMPROLE UPDATED]".blue,S.yellow,`(${U}) User`);
   } else {
      let mute = new MODEL({
        server: S,
        user: U,
        expires:E,
        role: R,
      });
      mute.save((err) => {
        if (err) return console.error(err);
        console.log("[NEW TEMPROLE]".blue,S.yellow,`(${U}) User`);
      });
   }
});
}

MODEL.add= (US) => {
  return MODEL.new(US);
}
MODEL.expire= (US) => {
    if(typeof US === 'number'){
        return MODEL.deleteMany({expires:{$lte:US}});
    }else{
        return MODEL.deleteOne({user:US.U,server:US.S});
    }
}

module.exports = MODEL;
