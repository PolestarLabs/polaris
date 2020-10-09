let reroute;
module.exports = {
  getT: function getT() {
    return reroute;
  },
  setT: function setT(t) {
    reroute = t;
  },

  rand: function rand(string, params) {
    const loc = reroute;
    const options = loc(string, Object.assign({ returnObjects: true },params), params);
    const ran = Math.floor(Math.random() * (options.length));

    return options[ran];
  },
};
