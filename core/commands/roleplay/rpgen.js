// const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const RPGen = require('../../../resources/rpgen');

    const Colors = require('name-this-color');
    let hex = (gear.randomize(0,1677720)*10+2).toString(16).padStart(6,"A");
    let color = Colors("#"+hex)[0]

    if(!msg.args[0] || msg.args[0] == "npc"){
        let oneNPC = RPGen.NPCs.generate();
        const fs = require('fs'); 
        fs.readdir(appRoot + "/resources/rpgen/pics/", function (err, files) {
            let archetypes={
                dragonborn: 4,
                dwarf: 2,
                gnome: 2,
                "half-elf":5,
                halfling:1,
                "half-orc":6,
                orc:7,
                tiefling:3,
                elf:1,
                human:0
            }
            files=files.filter(x=>x.includes(archetypes[oneNPC.race]));
            let rand = gear.randomize(0, files.length - 1);
            let filepath = appRoot + "/resources/rpgen/pics/" + files[rand]
            let file = fs.readFileSync(filepath);    
            
            if(oneNPC.race == "dragonborn") oneNPC.race = "Beast";
            const embed = new gear.Embed()
            .title(gear.capitalize(oneNPC.name))
            .field("Race",gear.capitalize(oneNPC.race),true)
            .field("Feature Color",color.title,true)
            .field("Traits","` • "+oneNPC.traits.join("`\n` • ")+"`",true)
            .field("Flaws","` • "+oneNPC.flaws.join("`\n` • ")+"`",true)
            .color(color.hex);
            
            embed.thumbnail("attachment://ava.gif")

                msg.channel.send({embed},{file,name:"ava.gif"});
        })
        return;
    }

    if(['plot','hook','story'].includes(msg.args[0])){
        let flavor;
        if(!msg.args[1] || msg.args[1] == "player"){
            flavor =  (RPGen.Storyhooks.pcRelated());
        }else if (msg.args[1]=="npc"){
            flavor = (RPGen.Storyhooks.npcActs());
        }else{
            flavor =  (RPGen.Storyhooks.pcRelated())
        }
        const embed = new gear.Embed()
            .color(hex)
            .description(flavor);
        return msg.channel.send({embed});
    }

    PLX.autoHelper('force',{cmd:this.cmd,msg,opt:this.cat})
}
module.exports={
    init
    ,pub:true
    ,cmd:'rpgen'
    ,perms:3
    ,cat:'roleplay'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['rpgenerator'] 
}