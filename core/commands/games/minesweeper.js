const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    minesTot = parseInt(msg.args[1]) || 10
    SQ = parseInt(msg.args[0]) || 8
    let arrGrid = [...Array(SQ)].map(e => Array(SQ));
    let ir = 0
    while (minesTot > 0){
        
        for(let i = 0;i<SQ;i++){
            for (let j = 0;j<SQ;j++){
                let rand = gear.randomize(0,SQ+5)
                if(minesTot <= 0) rand = 0;
                if(arrGrid[i][j]=="||<a:aaaaaaaaaaa:432063835201994762>||") continue;
                arrGrid[i][j] = (rand==1?"||<a:aaaaaaaaaaa:432063835201994762>||":"||:zero:||")
                if(rand==1) minesTot--;
            }
        }
        ir++
        console.log({minesTot,roll:ir})
    } 

    for(i = 0;i<SQ;i++){
        for (j = 0;j<SQ;j++){
            if(arrGrid[i][j]=="||<a:aaaaaaaaaaa:432063835201994762>||") continue;
            let around = 0
            if((arrGrid[i]||[])[j-1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // N
            if((arrGrid[i]||[])[j+1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // S

            if((arrGrid[i-1]||[])[j]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // W
            if((arrGrid[i+1]||[])[j]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // E

            if((arrGrid[i-1]||[])[j-1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // NW
            if((arrGrid[i-1]||[])[j+1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // SW

            if((arrGrid[i+1]||[])[j-1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // NE
            if((arrGrid[i+1]||[])[j+1]=="||<a:aaaaaaaaaaa:432063835201994762>||") around++ // SE

            switch(around){
                case 1:
                    arrGrid[i][j]= "||:one:||"
                    break;
                case 2:
                    arrGrid[i][j]= "||:two:||"
                    break;
                case 3:
                    arrGrid[i][j]= "||:three:||"
                    break;
                case 4:
                    arrGrid[i][j]= "||:four:||"
                    break;
                case 5:
                    arrGrid[i][j]= "||:five:||"
                    break;
                case 6:
                    arrGrid[i][j]= "||:six:||"
                    break;
                case 7:
                    arrGrid[i][j]= "||:seven:||"
                    break;
                case 8:
                    arrGrid[i][j]= "||:eight:||"
                    break;
                default:
                    arrGrid[i][j]= "||:zero:||"
                    break;

            }
        }
    }
    for (i in arrGrid){
        arrGrid[i]= arrGrid[i].join("\u0020");
    }
    
    msg.channel.send(arrGrid.join("\n"))

}
module.exports={
    init
    ,pub:true
    ,cmd:'minesweeper'
    ,perms:3
    ,cat:'games'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['mswp','mines']
}