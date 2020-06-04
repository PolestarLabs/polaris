const {Lootbox,rates} = require("../../archetypes/Lootbox.js");
const Picto = require('../../utilities/Picto.js');
const Canvas = require("canvas");
const ECO = require("../../archetypes/Economy");

const staticAssets = {}

const VisualsCache = new Map()

const cardWidth = 270

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
 
    
    const USERDATA = await DB.users.getFull({ id: msg.author.id });    


    const boxparams = await DB.items.findOne({ id: 'lootbox_C_O' });
    const lootbox = new Lootbox(boxparams.rarity,boxparams);
 
    await lootbox.compileVisuals;

    await Promise.all(
        lootbox.visuals.map(async vis =>
            VisualsCache.get(vis) || VisualsCache.set(vis, await Picto.getCanvas(vis) ) && VisualsCache.get(vis)
        )
    );
    
    const P = {lngs:msg.lang}
    
    const canvas = Picto.new(800,600)
    const ctx = canvas.getContext('2d')

    let itemCards = lootbox.content.map((item,i)=> renderCard(item,lootbox.visuals[i],P) );

    itemCards.forEach((card,i)=> {

        let loot = lootbox.content[i];
   
            
        ctx.drawImage(card,8+i*(cardWidth-15)+2,0)
    
    });

    lootbox.content.forEach((loot,i)=>{

        let isDupe = true;

        if(loot.type === 'background')
            USERDATA.modules.bgInventory.includes( loot.id || loot.code); // <- ID/CODE backwards compat
        if(loot.type === 'medal')
            USERDATA.modules.medalInventory.includes( loot.id || loot.icon); // <- ID/ICON backwards compat
        
        if(loot.type != 'gems') isDupe = true;
    
        if(isDupe){
            let dupe= renderDupeTag(loot.rarity,P);
            console.log(dupe)
            ctx.drawImage(dupe, -6+i*(cardWidth-15), -80,cardWidth+40,cardWidth+40)
        }

    })

    let lootembed = await msg.channel.send( {
        embed:{
            description:`
${_emoji(boxparams.rarity)} **${$t(`items:${boxparams.id}.name`,P)}**

    Reroll Cost: **${1000}** ${_emoji('RBN')}
    Rerolls Available: **${5}** 🔁

            `,
            image:{
                url:"attachment://Lootbox.png",
            },
            thumbnail:{url:paths.CDN+"/build/LOOT/openbox.gif"}
            ,color: 0x3585F0
            ,footer:{
                icon_url: msg.author.avatarURL
                ,text: msg.author.tag
            }
            ,timestamp: new Date()
        }
    }, {
        file: canvas.toBuffer(),
        name: "Lootbox.png"
      });
  
 

}




function renderCard(item,visual,P){ 

    const canvas = Picto.new(cardWidth,567)
    const ctx = canvas.getContext('2d')

    const itemVisual = VisualsCache.get(visual);
    const backFrame = staticAssets["frame_"+item.rarity];

    ctx.drawImage(backFrame,cardWidth/2-backFrame.width/2,0);

    ctx.globalCompositeOperation ='overlay'
    ctx.rotate(-1.5708)
    P.count= item.type == 'gems'? 2 : 1;
    let itemTypePrint = (item.type !== 'gems' ? $t("keywords."+item.type ,P) : $t("keywords."+item.currency ,P)).toUpperCase()
    Picto.setAndDraw(ctx, 
        Picto.tag(ctx, itemTypePrint, "600 50px 'AvenirNextRoundedW01-Bold'", "#FFF" )
        ,-468,(cardWidth-backFrame.width)/2+10,460
    )
    ctx.rotate(1.5708)
    ctx.globalCompositeOperation ='source-over'
    
    ctx.shadowColor = '#2248';
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10

    if(item.type == 'background'){
        let ox= -25
        let oy= 125
        let odx= 240
        let ody= 135

        let offset= 10

        ctx.rotate(-.2)
        ctx.translate(0,10)
        Picto.roundRect(ctx, ox,oy ,240,135,15,"#FFF","#1b1b2b",5)
        ctx.shadowBlur = 0
        Picto.roundRect(ctx, ox+offset, oy+offset, odx - (offset*2) ,ody - (offset*2), offset/2 ,itemVisual)
        ctx.shadowBlur = 10
        ctx.translate(0,-10)
        ctx.rotate(.2)
    }else if(item.type == 'medal'){
        let itemW= 150        
        ctx.drawImage(itemVisual,cardWidth/2-itemW/2,190-itemW/2,itemW,itemW)

    }else if(item.type == 'boosterpack'){        
        let itemW= 210
        ctx.translate((cardWidth/2-itemW/2+30), (190-300/2))
        ctx.rotate(.17)
        ctx.drawImage(itemVisual,0,0,itemW,300)
        ctx.rotate(-.17)
        ctx.translate(-(cardWidth/2-itemW/2+30), -(190-300/2))

    }else{        
        let itemW= 200        
        ctx.drawImage(itemVisual,cardWidth/2-itemW/2,190-itemW/2,itemW,itemW)
        
    }

    ctx.shadowBlur = 5

    let itemTitle   =  (item.name || item.amount + "").toUpperCase()
    let itemFont    = "900 italic 50px 'Panton Black'"
    let itemOptions = {
        textAlign:          "center",
        verticalAlign:      "middle",
        lineHeight:         1.1,
        sizeToFill:         true,
        maxFontSizeToFill:  80,
        paddingY:           15,
        paddingX:           15,
        stroke:  {
            style:          "#121225",
            line:           15
        }
    }
    
    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,15,220);
    
    itemOptions.stroke = null

    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,15,220);
    
    Picto.setAndDraw(ctx, 
        Picto.tag(ctx,  $t("keywords."+item.rarity,P) +" ", "900 32px AvenirNextRoundedW01-Bold", "#FFF" )
        ,cardWidth/2,20,230,'center'
    )

    return canvas;

}

function renderDupeTag(rarity,P){
    const canvas = Picto.new(staticAssets.dupe_tag.width,staticAssets.dupe_tag.width)
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width-staticAssets.dupe_tag.width +10,canvas.height/2)
    ctx.rotate(.22)
    let cosmoAward = rates.gems[rarity];
    ctx.shadowColor = '#53F8';
    ctx.shadowBlur = 10
    ctx.drawImage(staticAssets.dupe_tag,0,0)
    ctx.shadowBlur = 0
    Picto.setAndDraw(ctx,Picto.tag(ctx,$t('loot.duplicate',P)+" ! ","900 italic 32px 'PantonBlack'","#ffca82",{line:8,style:'#1b1b32'}),49,5,235)
    Picto.setAndDraw(ctx,Picto.tag(ctx, "+"+cosmoAward ,"900 italic 25px 'PantonBlack'","#FFF",{line:6,style:'#1b1b32'}),175,40,125,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,$t('keywords.cosmoFragment_plural',P).toUpperCase(),"900 17px 'Panton'","#DDF8"),175,48,150)
    
    return canvas

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