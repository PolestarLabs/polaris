const DB = require('../database/db_ops');

const CURRENCIES = {
  RBN: "rubines",
  JDE: "jades",
  SPH: "sapphires",
  LCL: false,
  AMY: "amethysts",
  EMD: "emeralds",
  TPZ: "topazes"
}


function checkFunds (user,amt, currency = "RBN"){
  const uID = user.id || user;
  if(typeof amt != 'number') return false;
  amt = parseInt(amt);
  
  return new Promise(async (resolve,reject)=>{
    let userData = await DB.users.get(uID,{["modules."+CURRENCIES[currency]]:1});
    console.log(userData.modules[CURRENCIES[currency]])
    if (userData.modules[CURRENCIES[currency]] < amt) return resolve(false);
    else resolve(true);    
  })
};

function pay(user,amt,type = "OTHER",currency = "RBN"){
  if(amt == 0) return;
  const uID = user.id || user;
  return new Promise(async (resolve,reject)=>{   
    
    if(typeof amt != 'number') resolve("Amount informed is not a Number");
    amt = parseInt(amt);    
           
    checkFunds(user,amt,currency).then(async ok=>{
      let now = Date.now();
      let payload = {
        subtype: "PAYMENT",
        type: type,
        currency,
        transaction: "-",
        from: uID,
        to: "271394014358405121",
        timestamp:now,
        transactionId: `${currency}${now.toString(32).toUpperCase()}`,
        amt
      }
      await Promise.all([
         DB.users.set(uID,{$inc:{["modules."+CURRENCIES[currency]]:-amt}})
        ,DB.users.set("271394014358405121",{$inc:{["modules."+CURRENCIES[currency]]:+amt}})
        ,DB.audits.new(payload)
      ]);
      resolve(payload);  
    }).catch(err=>{
      reject("No Funds"); 
    });
    
  });
};

function receive(user,amt,type = "OTHER",currency = "RBN"){
  if(amt == 0) return;
  const uID = user.id || user;
  return new Promise(async (resolve,reject)=>{
    
    if(typeof amt != 'number') reject("Amount informed is not a Number");
    amt = parseInt(amt);    
    
    let now = Date.now();
    let payload = {
      subtype: "INCOME",
      type: type,
      currency,
      transaction: "+",
      from: "271394014358405121",
      to: uID,
      timestamp:now,
      transactionId: `${currency}${now.toString(32).toUpperCase()}`,
      amt
    }
    await Promise.all([
         DB.users.set("271394014358405121",{$inc:{["modules."+CURRENCIES[currency]]:-amt}})
        ,DB.users.set(uID,{$inc:{["modules."+CURRENCIES[currency]]:+amt}})
        ,DB.audits.new(payload)
    ]);
    resolve(payload);    
  });
};

function transfer(userFrom,userTo,amt,type = "SEND",currency = "RBN"){
  if(amt == 0) return;
  const fromID = userFrom.id || userFrom;
  const toID   = userTo.id   || userTo;
  return new Promise(async (resolve,reject)=>{
    
    if(typeof amt != 'number') reject("Amount informed is not a Number");
    amt = Math.abs(parseInt(amt));
   
    checkFunds(userFrom,amt,currency).then(async ok=>{
      let now = Date.now();
      let payload = {
        subtype: "TRANSFER",
        type: type,
        currency,
        transaction: ">",
        from: fromID,
        to: toID,
        timestamp:now,
        transactionId: `${currency}${now.toString(32).toUpperCase()}`,
        amt
      }
      await Promise.all([        
         DB.users.set(fromID,{$inc:{["modules."+CURRENCIES[currency]]:-amt}})
        ,DB.users.set(toID  ,{$inc:{["modules."+CURRENCIES[currency]]:+amt}})
        ,DB.audits.new(payload)
      ]);
      resolve(payload);  
    }).catch(err=>{
      reject("No Funds"); 
    });
  });
};

async function arbitraryAudit(from,to,type,tag="OTH",trans){
  let now = Date.now();
      let payload = {
        subtype: "ARBITRARY",
        type: type,
        currency: "OTH",
        transaction: trans || "!!",
        from: from.id||from,
        to: to.id||to,
        timestamp:now,
        transactionId: `${tag}${now.toString(32).toUpperCase()}`,
        amt
      }
      await DB.audits.new(payload);
};

module.exports= {
  checkFunds,
  pay,
  receive,
  transfer,
  arbitraryAudit,
  CURRENCIES
}
