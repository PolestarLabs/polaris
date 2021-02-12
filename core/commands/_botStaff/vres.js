const init = async () => exec("pm2 stop sharding").then(() => exec("pkill -fe vanilla").then(() => exec("pm2 start sharding")));

module.exports = {
  init,
  pub: false,
  cmd: "vres",
  perms: 3,
  cat: "_botStaff",

};
