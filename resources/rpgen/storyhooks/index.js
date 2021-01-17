const Utils = require("../utils");

const generate = (storyhookBank) => {
  const storyhooks = require(`./${storyhookBank}.json`);
  return Utils.parseTemplate(Utils.pick(storyhooks));
};

const functions = {
  npcActs: () => generate("npc_acts"),
  pcRelated: () => generate("pc_related"),
};

module.exports = functions;
