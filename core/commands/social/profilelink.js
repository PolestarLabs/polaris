// const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let TARGET = msg.content.split(/ +/).length > 1 ? (await PLX.getTarget(msg)) : msg.author;  
    let userdata= await DB.users.findOne({id:TARGET.id});
    let adress = userdata.personalhandle || userdata.id;
    let mess= "<:Userlocation:338762651423473668> | "+paths.CDN+"/p/"+adress; 
    msg.channel.send(mess)

}
module.exports={
    init
    ,pub:true
    ,cmd:'profilelink'
    ,perms:3
    ,cat:'social'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['pfl']
}