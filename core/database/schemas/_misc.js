const mongoose = require('mongoose');
const Schema = mongoose.Schema 
const Mixed = Schema.Types.Mixed;
const utils = require('../../structures/PrimitiveGearbox.js');

const Audit = new Schema({
  from: String,
  to: String,
  type: String,
  currency: String,
  transaction: String,
  amt: Number,
  timestamp: Number,
  transactionId: String 
});

const Buyable = new Schema({
  id:String,
  price_USD:Number,
  price_BRL:Number,
  sendTo:String,
  name:String,
  description:String  ,
  img:String  ,
  filter:String,
  other : Mixed
});

const Globals = new Schema({
  id:{type:Number,default:0,unique:true},
  data:Mixed
});

const FanartModel = new Schema({
        id:String,
        src:String,
        thumb:String
        ,title:String
        ,description:String
        ,date:Date
        ,author:String
        ,author_ID:String
        ,publish:Boolean,extras:Mixed
},{ strict: false });

  const audit     = mongoose.model('Audit', Audit, 'transactions');
      audit.set     =  utils.dbSetter;
      audit.get     =  utils.dbGetter; 
      audit.new = payload => {
          let aud = new audit(payload);
          aud.save((err) => {
            if (err) return console.error(err);
            console.log("[NEW AUDIT]".blue,payload);
          });
       }    

  const global    = mongoose.model('Global', Globals, 'globals');
      global.set  = function(alter){
        if(!typeof alter) console.warn( "Invalid Alter Object");
        return this.updateOne({id:0},alter);
      };
      global.get  = async function(){
        try{
          return (await this.findOne()).data;
        }catch(e){
          return (await this.findOne());
        }
      };

  const fanart    = mongoose.model('fanart', FanartModel, 'fanart');
      fanart.set    =  utils.dbSetter;
      fanart.get    =  utils.dbGetter; 
  const buyables  = mongoose.model('buyables', Buyable, 'buyables');
      buyables.set  =  utils.dbSetter;
      buyables.get  =  utils.dbGetter; 

module.exports={ audit,global,fanart,buyables };
