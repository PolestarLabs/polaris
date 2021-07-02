const ComponentPaginator = require('../../structures/ComponentPaginator.js');

const init = async function (msg){

let mess = await msg.channel.send("---");
const pagi = new ComponentPaginator(mess,1,150,25,{userMessage:msg});

pagi.on("page", ([m,pag,rpp,tot])=>{
    console.log(pag,rpp,tot);
    m.edit(`${pag}/${ Math.ceil(tot/rpp) } - [${rpp*(pag-1)+1}-${rpp*pag}/${tot}]`);
});

//msg.channel.send("```js\n"+ require('util').inspect(pagi,0,0,0) +"```");

}
module.exports={
    init
    ,pub:0
    ,cmd:'test'
    ,cat:'_botStaff'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}