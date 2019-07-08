exports.init = (msg,args,userID) => {
    
    console.log(msg);
    msg.edit({content:"xxx",embed:{description: Math.random().toString(32) }} )
};