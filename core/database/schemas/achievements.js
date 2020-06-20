const mongoose = require("mongoose");

const { Schema } = mongoose;
const utils = require("../../structures/PrimitiveGearbox.js");

const { Mixed } = Schema.Types;

const Achievement = new Schema({

  name: String,
  icon: String,
  exp: Number,
  reveal_level: Number,
  reveal_requisites: Array,
  flavor_text_id: { type: String, index: { unique: true } },
  condition: { type: String, required: true },
  advanced_conditions: Array,
  id: { type: String, required: true, index: { unique: true } },

});

const MODEL = mongoose.model("achievements", Achievement, "achievements");

MODEL.award = (user, achiev) => {
  const userDB = require("./users.js");
  return new Promise(async (resolve) => {
    await userDB
      .updateOne({ id: user.id || user }, { $push: { "modules.achievements": { id: achiev, unlocked: Date.now() } } }).then((res) => resolve(res));
  });
};

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;
