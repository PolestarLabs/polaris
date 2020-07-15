const axios = require("axios");

module.exports = {

  randomOne: async (gallery, dlink) => {
    let Url = `${paths.CDN}/random/${gallery}`;

    if (dlink) {
      Url = `${paths.CDN}/random/redir/${gallery}?json=1`;
      const response = await axios.get(Url);
      return response.data;
    }
    const response = await axios.get(Url, {
      headers: { Accept: "*" },
      responseType: "arraybuffer",
    });
    return response.data;
  },

  randomOneIndexed: async (gallery, url = false) => {
    Url = `${paths.CDN}/random/${gallery}`;
    const preRes = await axios.get(`${Url}/size`, {
      headers: { Accept: "json" },
      responseType: "json",
    });
    const rand = randomize(0, preRes.data - 1);

    if (url) {
      return Promise.resolve({ file: `${Url}/${rand}`, index: rand });
    }
    const response = await axios.get(`${Url}/${rand}`, {
      headers: { Accept: "*" },
      responseType: "arraybuffer",
    });
    return Promise.resolve({ file: response.data, index: rand });
  },

  indexedOne: async (gallery, index = 0) => {
    Url = `${paths.CDN}/random/${gallery}/${index}`;
    const response = await axios.get(Url, {
      headers: { Accept: "*" },
      responseType: "arraybuffer",
    });
    return response.data;
  },
  filteredOne: async (gallery, filter) => {
    Url = `${paths.CDN}/random/${gallery}/filter/${filter}?json=1`;
    const response = await axios.get(Url, {
      headers: { Accept: "json" },
      responseType: "json",
    });
    return response.data;
  },

};
