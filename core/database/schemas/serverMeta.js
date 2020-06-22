const mongoose = require("mongoose");
const utils = require("../../structures/PrimitiveGearbox.js");

const { Mixed } = mongoose.Schema.Types;

const ServerSchema = new mongoose.Schema({
  id: { type: String, required: true, index: { unique: true } },
  name: String,
  size: Number,
  roles: Array,
  adms: Array,
  channels: Array,
  icon: String,
});

const MODEL = mongoose.model("ServerMetadata", ServerSchema, "sv_metadata");

MODEL.set = utils.dbSetter;
MODEL.get = utils.dbGetter;
MODEL.cat = "sv_meta";

module.exports = MODEL;
