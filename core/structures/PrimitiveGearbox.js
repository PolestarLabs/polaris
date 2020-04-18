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

   dbSetter : function(query,alter, options = {}){
     return new Promise(async resolve=>{
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof alter) resolve (null);
       if(!options.upsert) options.upsert = true; 
       if(['guilds','sv_meta'].includes(this.cat)) options.upsert = false;
       
       return resolve(this.updateOne(query,alter,options).lean().exec());
     })
   },

   dbChecker : async function(query){
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof alter) resolve (false);
       else resolve (true);
   },

   dbGetter : function(query,project,avoidNew){
     return new Promise(async resolve=>{
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof project) project = {_id:0};
       let data = await this.findOne(query,project).lean().exec();
   
       if (!data && !!this.cat) return resolve(  await this.new(PLX[this.cat].find(u=>u.id === query.id)) );
       if (data === null) return resolve(null);//return resolve( this.new(PLX.users.find(u=>u.id === query.id)) );
       return resolve(data);
     })
   },

   dbGetterFull : function(query,project,avoidNew){
     return new Promise(async resolve=>{
       if(['string','number'].includes(typeof query)){
         query = {'id':query.toString()};
       };
       if(!typeof project) project = {_id:0};
       let data = await this.findOne(query,project);
   
       if (!data && !!this.cat) return resolve(  await this.new(PLX[this.cat].find(u=>u.id === query.id)) );
       if (data === null) return resolve(null);//return resolve( this.new(PLX.users.find(u=>u.id === query.id)) );
       return resolve(data);
     })
   }

}
