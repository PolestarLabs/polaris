const mongoose = require("mongoose");
const utils = require("../../structures/PrimitiveGearbox.js");

const { Mixed } = mongoose.Schema.Types;

const aRANK = new mongoose.Schema({
  server: { type: String, required: true, index: { unique: false } },
  user: { type: String, required: true, index: { unique: false } },
  level: Number,
  exp: Number,
  thx: Number,
  lastUpdated: Date,
});

const MODEL = mongoose.model("Localranks", aRANK, "localranks");

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

MODEL.new = (US) => {
  const U = US.U?.id || US.U;
  const S = US.S?.id || US.S;
  MODEL.findOne({ user: U, server: S }, (err, rank) => {
    if (err) {
      console.error(err);
    }
    if (rank) {
      // Nothing
    } else {
      const rank = new MODEL({
        server: S,
        user: U,
        level: 0,
        exp: 0,
      });
      rank.save((err) => {
        if (err) return console.error(err);
        // console.log("[NEW RANK]".blue,S.yellow,`(${U}) User`);
      });
    }
  });
};

MODEL.incrementExp = (US, X = 1) => MODEL.updateOne({ user: US.U, server: US.S }, { $inc: { exp: X } });
MODEL.incrementLv = (US, X = 1) => MODEL.updateOne({ user: US.U, server: US.S }, { $inc: { level: X } });

module.exports = MODEL;
