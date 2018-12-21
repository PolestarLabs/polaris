const NAMES=require(paths.LISTS+"/colors.json");

colName = {

    init: function() {
      var color, rgb, hsl;
      for(var i = 0; i < NAMES.length; i++)
      {
        color = "#" + NAMES[i][0];
        rgb = this.rgb(color);
        hsl = this.hsl(color);
        NAMES[i].push( rgb, hsl );
      }
    },
    nameReverse: function(name){
      return NAMES.find(col=> col[1].toLowerCase()===name.toLowerCase())||
      NAMES.find(col=> col[1].toLowerCase().includes(name.toLowerCase()))||
      NAMES.find(col=> col[1].toLowerCase().includes(name.split(' ')[0].toLowerCase()))||
      null;
    },
    name: function(color) {
      color = color.toUpperCase();
      if(color.length < 3 || color.length > 7)
        return null;
      if(color.length % 3 == 0)
        color = "#" + color;
      if(color.length == 4)
        color = "#" + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);

        
        var rgb = this.rgb(color);
        var r = rgb[0], g = rgb[1], b = rgb[2];
        var hsl = this.hsl(color);
      var h = hsl[0], s = hsl[1], l = hsl[2];
      var ndf1 = 0; ndf2 = 0; ndf = 0;
      var cl = -1, df = -1;
      
      color=color.replace(/#/g,'');
      for(var i = 0; i < NAMES.length; i++)
      { 
        if(color == "" + NAMES[i][0])
        return ["" + NAMES[i][0], NAMES[i][1], true];
        0  
        ndf1 = Math.pow(r - NAMES[i][2], 2) + Math.pow(g - NAMES[i][3], 2) + Math.pow(b - NAMES[i][4], 2);
        ndf2 = Math.pow(h - NAMES[i][5], 2) + Math.pow(s - NAMES[i][6], 2) + Math.pow(l - NAMES[i][7], 2);
        ndf = ndf1 + ndf2 * 2;
        if(df < 0 || df > ndf)
        {
          df = ndf;
          cl = i;
        }
      }
  
      return (cl < 0 ? null : ["" + NAMES[cl][0], NAMES[cl][1]]);
    },
  
    hsl: function (color) {
  
      var rgb = [parseInt('0x' + color.substring(1, 3)) / 255, parseInt('0x' + color.substring(3, 5)) / 255, parseInt('0x' + color.substring(5, 7)) / 255];
      var min, max, delta, h, s, l;
      var r = rgb[0], g = rgb[1], b = rgb[2];
  
      min = Math.min(r, Math.min(g, b));
      max = Math.max(r, Math.max(g, b));
      delta = max - min;
      l = (min + max) / 2;
  
      s = 0;
      if(l > 0 && l < 1)
        s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
  
      h = 0;
      if(delta > 0)
      {
        if (max == r && max != g) h += (g - b) / delta;
        if (max == g && max != b) h += (2 + (b - r) / delta);
        if (max == b && max != r) h += (4 + (r - g) / delta);
        h /= 6;
      }
      return [parseInt(h * 255), parseInt(s * 255), parseInt(l * 255)];
    },

    rgb: function(color) {
      return [parseInt('0x' + color.substring(1, 3)), parseInt('0x' + color.substring(3, 5)),  parseInt('0x' + color.substring(5, 7))];
    },
  
  }
  
  colName.init();
  module.exports = colName;