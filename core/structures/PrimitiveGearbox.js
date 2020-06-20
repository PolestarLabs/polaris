const fs = require("fs");

module.exports = {

  getDirs: async function getDirs(rootDir) {
    fs.readdir(rootDir, (err, files) => {
      const dirs = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (file[0] !== ".") {
          const filePath = `${rootDir}/${file}`;
          fs.stat(filePath, (error, stat) => {
            if (stat.isDirectory()) {
              dirs.push(this.file);
            }
            if (files.length === (this.index + 1)) {
              return dirs;
            }
            return null;
          });
        }
      }
    });
  },

  dbSetter(query, alter, options = {}) {
    return new Promise((resolve) => {
      if (["string", "number"].includes(typeof query)) {
        query = { id: query.toString() };
      }
      if (!alter) resolve(null);
      if (!options.upsert) options.upsert = true;
      if (["guilds", "sv_meta"].includes(this.cat)) options.upsert = false;

      return resolve(this.updateOne(query, alter, options).lean().exec());
    });
  },

  async dbChecker(query) {
    if (["string", "number"].includes(typeof query)) {
      query = { id: query.toString() };
    }
    if (!alter) resolve(false);
    else resolve(true);
  },

  dbGetter(query, project) {
    return new Promise((resolve) => {
      if (["string", "number"].includes(typeof query)) {
        query = { id: query.toString() };
      }
      if (!project) project = { _id: 0 };
      return this.findOne(query, project).lean().exec().then((data) => {
        if (!data && !!this.cat) return this.new(PLX[this.cat].find((u) => u.id === query.id).then(resolve));
        if (data === null) return resolve(null);// return resolve( this.new(PLX.users.find(u=>u.id === query.id)) );
        return resolve(data);
      });
    });
  },

  dbGetterFull(query, project) {
    return new Promise((resolve) => {
      if (["string", "number"].includes(typeof query)) {
        query = { id: query.toString() };
      }
      if (!project) project = { _id: 0 };
      return this.findOne(query, project).then((data) => {
        if (!data && !!this.cat) return this.new(PLX[this.cat].find((u) => u.id === query.id).then(resolve));
        if (data === null) return resolve(null);// return resolve( this.new(PLX.users.find(u=>u.id === query.id)) );
        return resolve(data);
      });
    });
  },

};
