// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg){
    
    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const userData = await DB.users.findOne({id:msg.author.id});
    const BGData = (await DB.cosmetics.find({type:'background', code:{$in:userData.modules.bgInventory}}))
    const bgTarget=msg.args[0];
    const FragConvert = function FragConvert(item){
        let multi = 1;
        if(item.type = 'medal') multi=1;
        if(item.type = 'background') multi=1.5;
        let ruler = {C:10, U:20, R:30, SR:40, UR:50, XR:100}
        return Math.ceil(ruler[item.rarity]*multi);
    }

   msg.author.crafting = true;
    if(bgTarget == 'last'){
        //if(userData.modules.bgInventory.includes(bgTarget)){
            //thebg = BGData.find(x=>x.code==bgTarget); 
            thebg = BGData[BGData.length-1]

            P.rarity_emoji = _emoji(thebg.rarity);
            P.count = FragConvert(thebg);

            const embed = new Embed()
            .thumbnail(`${paths.CDN}/backdrops/${thebg.code}.png`)
            .description(`
            ${$('interface.synthfrag.disenchant',P)}
            \`Code:\`\u200b***\`${thebg.code}\`***
            `)
            
            const YesNo = require('../../structures/YesNo');
            msg.channel.send({embed}).then(m=>{

                positive = async function(cancel){
                    
                    DB.users.set(msg.author.id, {$pull:{'modules.bgInventory':thebg.code}});
                    userData.addItem('cosmo_fragment', fragAmt)
                    
                    msg.reply('ok1')
                }


                YesNo.run(m,msg,positive,null,null,{
                    strings:{
                        cancel:"Cancel",
                        confirm:"OK",
                        timeout:"Timeout"
                    }
                }).then(c=> msg.author.crafting = false)
            })
                

      //  }
            
    }



msg.channel.send("ok")



   
}
module.exports={
    init
    ,pub:true
    ,cmd:'fragment'
    ,perms:3
    ,cat:'cosmetics'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:["frag"]
}


