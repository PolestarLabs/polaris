const updateGuildSettings = require("../updateGuildSettings");

module.exports = {

  update: async function ServerCacheUPDATE(body, url, res) {
    if (res && !body.id) {
      res.statusCode = 400;
      res.end("No ID provided");
    }
    const query = { id: { $in: PLX.guilds.map((g) => g.id) } };
    if ((body.id || body) !== "all") query.id = body.id;

    return DB.servers.find(query).lean().exec().then((servers) => {
      const map = servers.map((sv) => {
        const thisServer = PLX.guilds.find((_s) => _s.id === sv.id);
        if (!thisServer) return undefined;

        updateGuildSettings(sv.id,sv);

        if (!sv.cluster) DB.servers.set({ id: sv.id }, { cluster: PLX.cluster.id });
        return { meta: thisServer.name, id: sv.id };
      });
      console.log("SERVER CACHE STRINGIFY".bgRed)
      console.log("SERVER CACHE STRINGIFY".bgYellow)
      console.log("SERVER CACHE STRINGIFY".bgRed)
      console.log("SERVER CACHE STRINGIFY".bgYellow)
      if (res) res.end(JSON.stringify(map));
    });
  },
  reload: async function ServerCacheRELOAD() {
    const setserv = await PLX.ServerCacheUPDATE();
    res.statusCode = 200;
    res.end(JSON.stringify(setserv));
  },
  updateChannels: async function ServerCacheUPDATECHANNEL(body, url, res) {
    if (res && !body.id) {
      res.statusCode = 400;
      res.end("No ID provided");
    }

    const query = { id: { $in: Object.keys(PLX.channelGuildMap) } };
    if ((body.id || body) !== "all") query.id = body.id;

    return DB.channels.find(query).lean().exec().then((channels) => {
      const map = channels.map((ch) => {
        const thisChannel = PLX.getChannel(ch.id);
        if (!thisChannel) return undefined;
        thisChannel.LANG = ch.modules.LANGUAGE;
        thisChannel.DISABLED = ch.modules.DISABLED;
        thisChannel.ENABLED = ch.modules.ENABLED;
        return { meta: thisChannel.name, id: ch.id };
      });
      if (res) res.end(JSON.stringify(map));
    });
  },

};
