const axios = require("axios");
const { parseString } = require("xml2js");

exports.get = function get(limit, pid, tags) {
  return new Promise((resolve, reject) => {
    const url = `https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${pid}&tags=${tags}`;
    axios.post(url).then((res) => resolve(res), (err) => reject(err));
  });
};

exports.getLewd = function getLewd(limit, pid, tags) {
  return new Promise((resolve, reject) => {
    const url = `http://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${pid}&tags=${tags}`;
    axios.post(url).then((res) => resolve(res), (err) => reject(err));
  });
};

exports.getRandom = function getRandom(tags) {
  return new Promise((resolve, reject) => {
    exports.get(1, 0, tags).then(({ data }) => {
      const cleanedString = data.replace("\ufeff", "");
      parseString(cleanedString, (err, result) => {
        if (err) return reject(err);
        const randomPid = Math.floor(Math.random() * result.posts.$.count);
        return exports.get(1, randomPid, tags).then((d) => {
          const cleanedString2 = d.data.replace("\ufeff", "");
          parseString(cleanedString2, (err2, result2) => {
            if (err2) return reject(err2);
            try {
              const output = result2.posts.post[0].$;
              return resolve(output);
            } catch (error) {
              return reject(error);
            }
          });
        });
      });
    });
  });
};

exports.getRandomLewd = function getRandomLewd(tags) {
  return new Promise((resolve, reject) => {
    exports.getLewd(1, 0, tags).then(({ data }) => {
      const cleanedString = data.replace("\ufeff", "");
      parseString(cleanedString, (err, result) => {
        if (err) return reject(err);
        const randomPid = (Math.floor(Math.random() * result.posts.$.count) / (result.posts.$.count > 20001 ? 20000 : 1));
        return exports.getLewd(1, randomPid, tags).then((d) => {
          const cleanedString2 = d.data.replace("\ufeff", "");
          parseString(cleanedString2, (err2, result2) => {
            if (err2) return reject(err2);
            try {
              const output = result2.posts.post[0].$;
              return resolve(output);
            } catch (error) {
              return reject(error);
            }
          });
        });
      });
    });
  });
};
