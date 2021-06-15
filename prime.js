process.env.PRIME = true;
process.env.SHARDS_PER_CLUSTER = 1
process.env.CLUSTER_ID = 1
process.env.TOTAL_SHARDS = 1

require("./pollux.js");
