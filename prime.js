process.env.PRIME = true;
process.env.SHARDS_PER_CLUSTER = 1
process.env.CLUSTER_ID = 1
process.env.TOTAL_SHARDS = 1
process.env.PRIME_FLAVORED_CLIENT = "prime"
process.env.FLAVOR_SWARM_CONFIG = JSON.stringify(require("../../flavored_swarm.config.js")); // check template at index 
console.log(process.env.FLAVOR_SWARM_CONFIG )
require("./pollux.js");
