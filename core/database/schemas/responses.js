const mongoose = require("mongoose");

const { Schema } = mongoose;
const utils = require("../../structures/PrimitiveGearbox.js");

const { Mixed } = Schema.Types;

const responses = new Schema({

  trigger: { type: String, required: true },
  response: String,
  server: { type: String, required: true, index: { unique: false } },
  id: { type: String, required: true, index: { unique: true } },
  embed: Mixed,
  type: String, // EMBED, STRING, FILE

});

const MODEL = mongoose.model("responses", responses, "responses");

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;

module.exports = MODEL;
