const NAMES = require(`${paths.LISTS}/colors.json`);

colName = {

  init() {
    let color; let rgb; let
      hsl;
    for (let i = 0; i < NAMES.length; i += 1) {
      color = `#${NAMES[i][0]}`;
      rgb = this.rgb(color);
      hsl = this.hsl(color);
      NAMES[i].push(rgb, hsl);
    }
  },
  nameReverse(name) {
    return NAMES.find((col) => col[1].toLowerCase() === name.toLowerCase())
      || NAMES.find((col) => col[1].toLowerCase().includes(name.toLowerCase()))
      || NAMES.find((col) => col[1].toLowerCase().includes(name.split(" ")[0].toLowerCase()))
      || null;
  },
  name(color) {
    const substr = (num) => color.substr(num, 1);
    color = color.toUpperCase();
    if (color.length < 3 || color.length > 7) return null;
    if (color.length % 3 === 0) color = `#${color}`;
    if (color.length === 4) color = `#${substr(1)}${substr(1)}${substr(2)}${substr(2)}${substr(3)}${substr(3)}`;

    const rgb = this.rgb(color);
    const r = rgb[0]; const g = rgb[1]; const
      b = rgb[2];
    const hsl = this.hsl(color);
    const h = hsl[0]; const s = hsl[1]; const
      l = hsl[2];
    let ndf1 = 0; ndf2 = 0; ndf = 0;
    let cl = -1; let
      df = -1;
    color = color.replace(/#/g, "");
    for (let i = 0; i < NAMES.length; i += 1) {
      if (color === `${NAMES[i][0]}`) return [`${NAMES[i][0]}`, NAMES[i][1], true];

      ndf1 = ((r - NAMES[i][2][0]) ** 2) + ((g - NAMES[i][3][1]) ** 2) + ((b - NAMES[i][4][2]) ** 2);
      ndf2 = ((h - NAMES[i][5][0]) ** 2) + ((s - NAMES[i][6][1]) ** 2) + ((l - NAMES[i][7][2]) ** 2);
      ndf = ndf1 + ndf2 * 2;

      if (df < 0 || df > ndf) {
        df = ndf;
        cl = i;
      }
    }
    return (cl < 0 ? null : [`${NAMES[cl][0]}`, NAMES[cl][1]]);
  },

  hsl(color) {
    const rgb = [
      parseInt(`0x${color.substring(1, 3)}`, 10) / 255,
      parseInt(`0x${color.substring(3, 5)}`, 10) / 255,
      parseInt(`0x${color.substring(5, 7)}`, 10) / 255,
    ];
    let h; let s;
    const r = rgb[0]; const g = rgb[1]; const
      b = rgb[2];

    const min = Math.min(r, Math.min(g, b));
    const max = Math.max(r, Math.max(g, b));
    const delta = max - min;
    const l = (min + max) / 2;

    s = 0;
    if (l > 0 && l < 1) s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));

    h = 0;
    if (delta > 0) {
      if (max === r && max !== g) h += (g - b) / delta;
      if (max === g && max !== b) h += (2 + (b - r) / delta);
      if (max === b && max !== r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [parseInt(h * 255, 10), parseInt(s * 255, 10), parseInt(l * 255, 10)];
  },

  rgb(color) {
    return [parseInt(`0x${color.substring(1, 3)}`, 10), parseInt(`0x${color.substring(3, 5)}`, 10), parseInt(`0x${color.substring(5, 7)}`, 10)];
  },

};

colName.init();
module.exports = colName;
