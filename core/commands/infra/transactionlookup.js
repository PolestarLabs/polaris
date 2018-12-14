const DB = require(appRoot+"/core/database/db_ops");
const gear = require(appRoot+"/core/utilities/Gearbox");


const init = async function (message) {

  const {Embed} = require('eris')
  const  embed= new Embed
  let filterid=message.args[0]
  let log =  await DB.audits.get({transactionId:filterid});
    let curr
    switch(log.currency){
      case "RBN":
        curr="rubine";
        break;
      case "JDE":
        curr="jade";
        break;
      case "SPH":
        curr="sapphire";
        break;
    }

    let tuser = log.from == "271394014358405121"? (await DB.users.findOne({id:log.to})).meta : (await DB.users.findOne({id:log.from})).meta;
    embed.author(tuser.tag,('https://www.pollux.fun/images/'+"rubine"+'.png'),"https://pollux.fun/profile/"+log.from)
  console.log(embed.author)
    embed.setColor(log.transaction=="+"?'#60c143':'#e23232')
    embed.description(`
  **Transaction Info:**`)
    embed.field("Amount",gear.miliarize(log.amt,true),true)
    embed.field("Type","`"+log.type+"`",true)
    if(log.to!="271394014358405121" && log.from!="271394014358405121") {
      let ouser = (await DB.userDB.findOne({id:log.to})).meta;
      embed.field("Recipient",ouser.tag + " `"+log.to+"`",true);
    }
    if(log.type.includes('give')) embed.field(log.transaction=="+"?"FROM":"TO","**"+tuser.tag+"** `"+log.to+"`",true);
    //embed.setThumbnail('https://www.pollux.fun/images/'+curr+'.png')

    embed.thumbnail(tuser.avatarURL||tuser.avatar)
    let ts = new Date(log.timestamp)
    embed.timestamp= ts
    embed.footer(log.transactionId)

  message.channel.send({embed})


    }

 module.exports = {pub:false,cmd: 'tlookup', perms: 3, init, cat: 'infra', aliases:['tlookup']};
