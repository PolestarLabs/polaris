



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

const Commends = new Schema({
  id:{type:String, required: true,index:{unique:true}},
  whoIn: Array,
  whoOut: Array
})


const Globals = new Schema({
  id:{type:Number,default:0,unique:true},
  data:Mixed
},{ strict: false });

const Control = new Schema({
  id:{type:String,unique:true},
  data:Mixed
},{ strict: false });

const ReactionRoles = new Schema({
  channel:String,
  message:String,
  server:String,
  rolemoji:Array,  
},{ strict: false });

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


const MarketplaceModel = new Schema({
  id:String,
  item_id: String,
  item_type: String,
  price: Number,
  currency: String,
  author: String,
  timestamp: Number
},{ strict: false });


const RelationShipModel = new Schema({
  id:String,
  users: Array,
  ring: String,
  initiative: Number,
  since: Number,
  lovepoints: Number,
  type: String, // MARRIAGE / PARENTS / CHILDREN
  
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

  const control    = mongoose.model('Control', Control, 'control');
        control.set    =  utils.dbSetter;
        control.get    =  utils.dbGetter; 

  const reactRoles    = mongoose.model('ReactionRoles', ReactionRoles, 'ReactionRoles');
        reactRoles.set    =  utils.dbSetter;
        reactRoles.get    =  utils.dbGetter; 
        
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

  const marketplace    = mongoose.model('marketplace', MarketplaceModel, 'marketplace');
      marketplace.set    =  utils.dbSetter;
      marketplace.get    =  utils.dbGetter; 
      marketplace.new = payload => {
        marketplace.findOne({
          id: payload.id
        }, (err, newUser) => {
          if (err) {
            console.error(err)
          }
          if (newUser) {
            // Nothing
          } else {
            let cmmd = new marketplace({
              id: payload.id,
            });
            cmmd.save((err) => {
              if (err) return console.error(err);
              console.log("[NEW MARKET POST]".blue);
            });
          }
        })
      }

  const relationships    = mongoose.model('Relationship', RelationShipModel, 'relationships');
        relationships.set    =  utils.dbSetter;
        relationships.get    =  utils.dbGetter; 
        relationships.create  = function(type,users,initiative,ring){
          return new Promise(async (resolve,reject)=>{

            let rel = await relationships.find({type,users:{$all:users}});
            if (rel.length>0) return reject("Duplicate Relationship: \n" + JSON.stringify(rel,null,2) );

            relationship =  new relationships({
              type,users,initiative,ring
            });
            relationship.save((err,item) => {
              resolve (item);
            })
          })
        }

  const fanart    = mongoose.model('fanart', FanartModel, 'fanart');
      fanart.set    =  utils.dbSetter;
      fanart.get    =  utils.dbGetter; 

  const buyables  = mongoose.model('buyables', Buyable, 'buyables');
      buyables.set  =  utils.dbSetter;
      buyables.get  =  utils.dbGetter; 
      
  const commends  = mongoose.model('commends', Commends, 'commends');
      commends.set  =  utils.dbSetter;
      commends.get  =  utils.dbGetter; 
      commends.new = payload => {
        commends.findOne({
          id: payload.id
        }, (err, newUser) => {
          if (err) {
            console.error(err)
          }
          if (newUser) {
            // Nothing
          } else {
            let cmmd = new commends({
              id: payload.id,
            });
            cmmd.save((err) => {
              if (err) return console.error(err);
              console.log("[NEW COMMEND]".blue);
            });
          }
        })
      }

module.exports={ audit,global,fanart,buyables,commends, control,reactRoles,marketplace,relationships }; 
