const gear = require("../../utilities/Gearbox");
const DB = require("../../database/db_ops");

const cmd = 'balance';

//const locale = require(appRoot+'/utils/i18node');
//const $t = locale.getT();

const init = async function (message) {

    const Target = (await gear.getTarget(message))||message.author;
    const emb = new gear.Embed();

    let P={lngs:message.lang}
    if(gear.autoHelper([$t("helpkey",P)],{cmd,message,opt:this.cat}))return;

    const bal =  $t('$.balance',P);
    /*
    const put =  $t('$.lewdery',P);
    const jog =  $t('$.gambling',P);
    const dro =  $t('$.drops',P);
    const tra =  $t('$.trades',P);
    const gas =  $t('$.expenses',P);
    const gan =  $t('$.earnings',P);
    const tot =  $t('$.total',P);
    const exg =  $t('$.exchange',P);
    const don =  $t('$.donation',P);
    const cra =  $t('$.crafts',P);
    const nope = $t('CMD.noDM',P);
    */

    const moment = require ('moment');
    moment.locale(message.lang[0])

    const TARGERDATA= await DB.users.get({id:Target.id});
    emb.color('#ffd156')
    emb.title(bal)

  if(TARGERDATA){

    emb.description =
`${gear.invisibar}
${_emoji('RBN')} ${$t('keywords.RBN_plural',{lngs:message.lang})}: **${gear.miliarize(TARGERDATA.modules.rubines ,true)}**
${_emoji('JDE')} ${$t('keywords.JDE_plural',{lngs:message.lang})}: **${gear.miliarize(TARGERDATA.modules.jades ,true)}**
${_emoji('SPH')} ${$t('keywords.SPH_plural',{lngs:message.lang})}: **${gear.miliarize(TARGERDATA.modules.sapphires ,true)}**
${_emoji('EVT')} ${"Event Tokens"}: **${gear.miliarize(TARGERDATA.eventGoodie || 0 , true)}**`


lastTrans = await DB.audits.find({$or:[{from:TARGERDATA.id},{to:TARGERDATA.id}]}).sort({timestamp:-1}).limit(3);
async function lastTransBuild(x){
if(!x)return "\u200b";

let POLid = '271394014358405121'

let ts = moment(x.timestamp).format("hh:mma | DD/MMM").padStart(16,'\u200b '); 
 if(x.type == "SEND") x.type = "TRANSFER";
  if(x.to == TARGERDATA.id && x.from !==POLid){
    othPart = await DB.users.get(x.from);
    return `↔ \`${ts}\` **${x.amt}**${x.currency}
\u200b\u2003\u2003|   *\`${x.type}\`* from [${othPart.meta.tag}](http://pollux.fun/p/${othPart.id}) \`${othPart.id}\` `
  }
  if(x.from == TARGERDATA.id && x.to !==POLid){
    othPart = await DB.users.get(x.to);
    return `↔  \`${ts}\` **${x.amt}**${x.currency}
\u200b\u2003\u2003|   *\`${x.type}\`* from [${othPart.meta.tag}](http://pollux.fun/p/${othPart.id}) \`${othPart.id}\` `
  }
  if(x.to==POLid){
    return `📤  \`${ts}\` **${x.amt}**${x.currency}
\u200b\u2003\u2003|   *${x.type}*`
  }
  if(x.from==POLid){
    return `📥  \`${ts}\` **${x.amt}**${x.currency}
\u200b\u2003\u2003|   *${x.type}*`
  }
  
  return '\u200b'

}

emb.field("Last Transactions", 
`${await lastTransBuild(lastTrans[0])}
${await lastTransBuild(lastTrans[1])}
${await lastTransBuild(lastTrans[2])}
` , false );

  }else{
    emb.description("User `"+Target.id+"` not found in Pollux Database")
  }
if(Target){
  emb.footer(Target.tag,Target.avatarURL);
}else{
  emb.description = "User `"+Target.id+"` not found anywhere"
  emb.fields = []
  emb.fields = []
}
  message.channel.send({embed:emb})

}
 module.exports = {
    pub:true,
    botPerms: ["embedLinks"],
    aliases: ["bal","sapphires","jades"],
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'cash'
};