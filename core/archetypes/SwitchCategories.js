// @ts-check
const readdirAsync = Promise.promisify(require("fs").readdir);

/**
 * Function to load and sort categories
 * - Will not work on dashboard codebase
 */
function loadCategories(route = "") {
  return new Promise((resolve) => {
    readdirAsync(`./core/commands/${route}`).then(async (items) => {
      const obj = {};
      for (const item of items) {
        if (item.endsWith(".js")) {
          try {
            const cmd = require(`../commands/${route}/${item}`);
            if (cmd.hidden || cmd.protected || cmd.pub === false || !cmd.cmd) continue;
            if (!cmd.cat) cmd.cat = "uncategorized";
            if (!obj[cmd.cat]) obj[cmd.cat] = { cmds: [] };
            obj[cmd.cat.toLowerCase()].cmds.push(cmd.cmd.toLowerCase());
          } catch (e) { console.warn(e); }
        } else if (!item.includes(".")) {
          await loadCategories(`${route}/${item}`).then((toApply) => {
            Object.assign(obj, toApply);
          });
        }
      }
      resolve(obj);
    }).catch(() => {
      // Dashboard Fallback
    });
  });
}

/* NOTE For some reason this loads less commands
function loadCategories2() {
  return new Promise((resolve, reject) => {
    const cats = {};
    const cmds = Object.keys(PLX.commands);
    cmds.forEach((cmd, index, arr) => {
      cmd = PLX.commands[cmd];
      if (cmd.hidden || cmd.pub === false || !cmd.cmd) return;
      if (!cmd.cat) cmd.cat = "uncategorized";
      if (!cats[cmd.cat]) cats[cmd.cat] = { cmds: [] };
      cats[cmd.cat.toLowerCase()].cmds.push(cmd.cmd.toLowerCase());
      if (index === arr.length - 1) resolve(cats);
    });
  });
}
*/

class Categories {
  cats = {};

  catsArr = [];

  cmdsArr = [];

  constructor() {
    loadCategories().then((toApply) => {
      this.cats = toApply;
      this.catsArr = Object.keys(this.cats).sort();
      for (const cat of this.catsArr) {
        this.cats[cat].cmds.sort();
        this.cmdsArr = [...this.cmdsArr, ...this.cats[cat].cmds];
      }
    });
  }
}
