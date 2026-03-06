require("colors");
const version = require("../package.json").version;
const CLUSTER_NAMES = require("@polestar/constants/clusters")?.default;
const CLUSTER_ID          = parseInt(process.env.CLUSTER_ID) || 0;
const TOTAL_SHARDS        = parseInt(process.env.TOTAL_SHARDS) || 1;
const isPRIME             = process.env.PRIME === "true" || process.env.PRIME === true;
const CLIENT_DATA         = process.env.PRIME_FLAVORED_CLIENT;

const UNIT = isPRIME ? `⭐ PRIME (${CLIENT_DATA.name})` : CLUSTER_NAMES[CLUSTER_ID] || `Cluster ${CLUSTER_ID}`;

const ascii = function () {
  const a = isPRIME ? "yellow" : "green";
  const b = "red";

  const text = `${"                                                                "[a][b]
    }\n${"                                                                "[a][b]
    }\n${"  ,ggggggggggg,                                                 "[a][b]
    }\n${" dP\"\"\"88\"\"\"\"\"\"Y8,      ,dPYb, ,dPYb,                            "[a][b]
    }\n${" Yb,  88      `8b      IP'`Yb IP'`Yb                            "[a][b]
    }\n${"  `\"  88      ,8P      I8  8I I8  8I                            "[a][b]
    }\n${"      88aaaad8P\"       I8  8' I8  8'                            "[a][b]
    }\n${"      88\"\"\"\"\",ggggg,   I8 dP  I8 dP  gg      gg     ,gg,   ,gg  "[a][b]
    }\n${"      88    dP\"  \"Y8gggI8dP   I8dP   I8      8I    d8\"\"8b,dP\"   "[a][b]
    }\n${"      88   i8'    ,8I  I8P    I8P    I8,    ,8I   dP   ,88\"     "[a][b]
    }\n${"      88  ,d8,   ,d8' ,d8b,_ ,d8b,_ ,d8b,  ,d8b,,dP  ,dP\"Y8,    "[a][b]
    }\n${"      88  P\"Y8888P\"   8P'\"Y888P'\"Y888P'\"Y88P\"`Y88\"  dP\"   \"Y8   "[a][b]
    }\n${"                                                                "[a][b]
    }\n` + `     v${version}                                 ${"Powered by Eris".gray
    }\n${"                                                                "[a][b]
    }\n${`> STARTING UP...  ${UNIT}                                              `.magenta
    }\n${"                                                                "[a][b]}`;

  return text;
};
module.exports = { ascii };
// _"[color][colorBg]+"\n\u001b
