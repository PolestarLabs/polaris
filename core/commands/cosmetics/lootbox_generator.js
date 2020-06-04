
const Picto = require('../../utilities/Picto.js');
const Canvas = require("canvas");
const ECO = require("../../archetypes/Economy");

const staticAssets = {}

const VisualsCache = new Map()


staticAssets.load = Promise.all([
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_C.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_U.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_R.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_SR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_UR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_XR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/dupe-tag.png'),
]).then(res=>{
    let [frame_C,frame_U,frame_R,frame_SR,frame_UR,frame_XR,dupe_tag] = res;
    Object.assign(staticAssets,{frame_C,frame_U,frame_R,frame_SR,frame_UR,frame_XR,dupe_tag,loaded:true});
    delete staticAssets.load
})


const init = async function (msg,args){
    
    console.log(staticAssets)
    if(!staticAssets.loaded) await staticAssets.load;
    if(VisualsCache.size > 800) VisualsCache.clear();



    delete require.cache[require.resolve("../../archetypes/Lootbox.js")];
    const LOOT = require("../../archetypes/Lootbox.js");
    const USERDATA = await DB.users.getFull({ id: msg.author.id });
    


    const boxparams = await DB.items.findOne({ id: 'lootbox_C_O' });
    const BOXE = new LOOT.Lootbox(boxparams.rarity,boxparams);
 
    await BOXE.compileVisuals;

    msg.channel.send("```"+JSON.stringify(BOXE,0,1)+"```")

    console.log(VisualsCache)

    const P = {lngs:msg.lang}

    console.log(args)

    if (args[0] === 'bmk'){

        let STT ={R:{},I:{},G:{},C:{}}
        let J = [...new Array(10000)];

        J.forEach(async x=>{
            const BOXE2 = new LOOT.Lootbox(boxparams.rarity,boxparams);
            
 

            BOXE2.content.forEach(y=>{
                if(typeof STT.R[y.rarity] == 'number') STT.R[y.rarity]++;
                else STT.R[y.rarity] = 0;
            })
            BOXE2.content.forEach(y=>{
               // if(!y.invalid) y.calculateGems("RBN");
                if(!y.type)console.log({yundef:y});
                if(typeof STT.I[y.type] == 'number' ) STT.I[y.type]++;
                else STT.I[y.type] = 0;
            })
            BOXE2.content.forEach(y=>{
                if(typeof STT.C[y.collection] == 'number' ) STT.C[y.collection]++;
                else STT.C[y.collection] = 0;
            })
            BOXE2.content.forEach(y=>{
                if(typeof STT.G[y.currency]  == 'number') STT.G[y.currency]++;
                else STT.G[y.currency] = 0;
            })


        })

        return msg.channel.send("```"+JSON.stringify(STT,0,1)+"```");

    }

    
    const canvas = Picto.new(800,600) //margin 14
    const ctx = canvas.getContext('2d')

    let cards = await Promise.all(BOXE.content.map((x,i)=> renderCard(x,BOXE.visuals[i],P)  ));

    cards.forEach((x,i)=>{
        ctx.drawImage(x,i*250-25,0)
    })

    let lootembed = await msg.channel.send( "1", {
        file: canvas.toBuffer(),
        name: "Lootbox.png"
      });
  
 

}




async function renderCard(item,visual,P){

    let W = 350

    const canvas = Picto.new(W,567) //margin 14
    const ctx = canvas.getContext('2d')

    const VisualKey = item.type + (item.objectId||item.currency)

    if(!VisualsCache.get(VisualKey)) VisualsCache.set(VisualKey, await Picto.getCanvas(visual) );

    const itemVisual = VisualsCache.get(VisualKey);
    const backFrame = staticAssets["frame_"+item.rarity];

    ctx.drawImage(backFrame,W/2-backFrame.width/2,0);   


    ctx.rotate(-1.5708)
    ctx.globalCompositeOperation ='overlay'
    P.count= item.type == 'gems'? 2 : 1;
    let itemTypePrint = (item.type !== 'gems' ? $t("keywords."+item.type ,P) : $t("keywords."+item.currency ,P)).toUpperCase()
    Picto.setAndDraw(ctx, 
        Picto.tag(ctx, itemTypePrint, "600 50px 'AvenirNextRoundedW01-Bold'", "#FFF" )
        ,-468,(W-backFrame.width)/2+10,460
    )
    ctx.rotate(1.5708)
    ctx.globalCompositeOperation ='source-over'
    
    ctx.shadowColor = '#2248';
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10

    if(item.type == 'background'){
        ctx.rotate(-.2)
        ctx.translate(45,0)
        Picto.roundRect(ctx,-25,125,240,135,15,"#FFF","#1b1b2b",5)
        ctx.shadowBlur = 0
        Picto.roundRect(ctx,-15,135,220,115,10,itemVisual)
        ctx.shadowBlur = 10
        ctx.translate(-45,0)
        ctx.rotate(.2)
    }else if(item.type == 'medal'){
        let itemW= 150        
        ctx.drawImage(itemVisual,W/2-itemW/2,190-itemW/2,itemW,itemW)

    }else if(item.type == 'boosterpack'){        
        let itemW= 210
        ctx.translate((W/2-itemW/2+30), (190-300/2))
        ctx.rotate(.17)
        ctx.drawImage(itemVisual,0,0,itemW,300)
        ctx.rotate(-.17)
        ctx.translate(-(W/2-itemW/2+30), -(190-300/2))

    }else{        
        let itemW= 200        
        ctx.drawImage(itemVisual,W/2-itemW/2,190-itemW/2,itemW,itemW)
        
    }

    ctx.shadowBlur = 5
 


    itemTitle   =  (item.name || item.amount + "").toUpperCase()
    itemFont    = "900 italic 50px 'Panton Black'"
    itemOptions = {
        textAlign: "center",
        verticalAlign: "middle",
        lineHeight:1.1,
        sizeToFill: !0,
        maxFontSizeToFill: 80,       
        paddingY: 15,
        paddingX: 15,
        stroke:  { style: "#121225", line: 15 }
    }
    
    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,60,230);
    
    itemOptions.stroke = null

    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,60,230);
    

    Picto.setAndDraw(ctx, 
        Picto.tag(ctx,  $t("keywords."+item.rarity,P) +" ", "900 32px AvenirNextRoundedW01-Bold", "#FFF" )
        ,W/2,20,230,'center'
    )
    
 
    
    
    //ctx.drawImage(itemVisual,12,0);

    return canvas;



}




module.exports={
    init
    ,pub:false
    ,cmd:'lootbox_generator'
    ,perms:3
    ,cat:'cosmetics'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['lgen']
}