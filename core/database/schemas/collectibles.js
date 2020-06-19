const mongoose = require("mongoose");

const { Schema } = mongoose;
const utils = require("../../structures/PrimitiveGearbox.js");

const { Mixed } = Schema.Types;

const collectibles = new Schema({
  name: String,
  id: { type: String, index: { unique: true } },
  rarity: String,
  icon: String,
  emoji: String,
  attribs: Mixed,

});

const MODEL = mongoose.model("collectibles", collectibles, "collectibles");

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;
