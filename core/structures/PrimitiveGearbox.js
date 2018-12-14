const fs = require('fs');

module.exports = {

   getDirs : async function getDirs(rootDir) {
     fs.readdir(rootDir, function (err, files) {
       let dirs = [];
       for (let i = 0; i < files.length; ++i) {
         let file = files[i];
         if (file[0] !== '.') {
           let filePath = rootDir + '/' + file;
           fs.stat(filePath, function (err, stat) {
             if (stat.isDirectory()) {
               dirs.push(this.file);
             }
             if (files.length === (this.index + 1)) {
               return dirs;
             }
           }.bind({
             index: i,
             file: file
           }));
         }
       }
     })
   },

   dbSetter : function(query,alter){
     return new Promise(async resolve=>{
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof alter) resolve (null);
       return resolve(this.updateOne(query,alter));
     })
   },

   dbGetter : function(query,project){
     return new Promise(async resolve=>{
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof project) project = {_id:0};
       return resolve(this.findOne(query,project));
     })
   }

}
