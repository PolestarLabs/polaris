const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const Picto = require('../../utilities/Picto');

const init = async function (msg,args){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    const canvas = Picto.new(800,600);
    ctx = canvas.getContext('2d');

    XYZ ={
            //majors
                LBX:   {y: 160, x: 705, w: 140, h:37 }  
                ,BPK:  {y: 244, x: 705, w: 140, h:0  }  
                ,CSM:  {y: 323, x: 705, w: 130, h:0  }  
                ,MTL:  {y: 322, x: 180, w: 140, h:37 }  
                ,JNK:  {y: 405, x: 180, w: 140, h:0  }  
                ,KEY:  {y: 482, x: 180, w: 140, h:0  }  
            //minis
                ,mBG:    {y: 255, x: 390 }  
                ,mMD:    {y: 220, x: 390 }  
                ,mST:    {y: 220, x: 285 }  
                ,mFL:    {y: 255, x: 285 }  
            //meta
                ,uname:  {y: 122, x: 227}  
                
                ,color1: {y: 127, x: 154, w: 505, h:418 , mw: 0}  
        }

    const Target = msg.mentions[0] ||  msg.author;

    let [_baseline,hex,userData,itemData ] = await Promise.all([    
          Picto.getCanvas(paths.CDN+"/build/invent/inventframe.png")
        , Picto.makeHex(175,Target.avatarURL)        
        , DB.users.findOne({id:Target.id},{
            'modules.inventory'         :1,
            'modules.flairsInventory'   :1,
            'modules.bgInventory'       :1,
            'modules.medalInventory'    :1,
            'modules.stickerInventory'  :1,
            'modules.favcolor'          :1,    
            id:1    
        })
        , DB.items.find().lean().exec()
    ]); 

    ctx.fillStyle = userData.modules.favcolor || "#FFF";
    ctx.fillRect(154,127,500,408)
    ctx.fillRect(427,516,132,60)

    ctx.drawImage(hex,25,25)
    
    ctx.drawImage(_baseline,0,0) 
    
    ctx.rotate(-0.10)   
    
    let fSize = 40 
    let uname_w = Picto.popOutTxt(ctx, Target.username, XYZ.uname.x-10 , XYZ.uname.y+00 ,fSize+"pt 'Panton Black','Corporate Logo Rounded' ","#FFF",400,{style:"#1f1d25",line:14}).w;   
    Picto.popOutTxt(ctx,"#"+Target.discriminator, XYZ.uname.x+uname_w-30 , XYZ.uname.y+20 ,"24pt 'Panton Light'","#FFF",100,{style:"#1f1d25",line:8}).w;
    ctx.rotate(0.10)

    Picto.setAndDraw(ctx,Picto.tag(ctx,"약탈 상자",    "400 22pt 'Panton'","#FFF"),XYZ.LBX.x,XYZ.LBX.y,XYZ.LBX.w,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,"부스터 팩",    "400 22pt 'Panton'","#FFF"),XYZ.BPK.x,XYZ.BPK.y,XYZ.BPK.w,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,"소모품","400 22pt 'Panton'","#FFF"),XYZ.CSM.x,XYZ.CSM.y,XYZ.CSM.w,'right')

    Picto.setAndDraw(ctx,Picto.tag(ctx,"공예 재료",  "400 22pt 'Panton'","#FFF"),XYZ.MTL.x,XYZ.MTL.y,XYZ.MTL.w,'left')
    Picto.setAndDraw(ctx,Picto.tag(ctx,"키",       "400 22pt 'Panton'","#FFF"),XYZ.KEY.x,XYZ.KEY.y,XYZ.KEY.w,'left')
    Picto.setAndDraw(ctx,Picto.tag(ctx,"정크",      "400 22pt 'Panton'","#FFF"),XYZ.JNK.x,XYZ.JNK.y,XYZ.JNK.w,'left')
    
    types = {}
    userData.modules.inventory.forEach(itm=>{
        let itemType = itemData.find(i=>(itm.id||itm)==i.id).type||"other"
        if(!types[itemType]) types[itemType] = 0;
        types[itemType] += (itm.count || 0);
    });

    let  a_csm = xlr99(types.consumables || 0 ,"L")
        ,a_key = xlr99(types.key || 0 )
        ,a_mtl = xlr99(types.material || 0 )
        ,a_jnk = xlr99(types.junk || 0 )
        ,a_bpk = xlr99(types.boosterpack || 0 ,"L")
        ,a_lbx = xlr99(types.box || 0 ,"L");

    function xlr99(x,LR="R"){
        x= LR == "R" ? x>99?"+99":x
                     : x>99?"99+":x;
        return x;
    }

    let a_bg = userData.modules.bgInventory.length
    let a_md = userData.modules.medalInventory.length
    let a_st = userData.modules.stickerInventory.length
    let a_fl = userData.modules.flairsInventory.length
    
    ctx.globalAlpha = .7
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_st,   "600 18pt 'Panton'","#FFF"),XYZ.mST.x,XYZ.mST.y,100,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_fl,   "600 18pt 'Panton'","#FFF"),XYZ.mFL.x,XYZ.mFL.y,100,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_md,   "600 18pt 'Panton'","#FFF"),XYZ.mMD.x,XYZ.mMD.y,100,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_bg,   "600 18pt 'Panton'","#FFF"),XYZ.mBG.x,XYZ.mBG.y,100,'right')
    ctx.globalAlpha = 1    
    
    Picto.setAndDraw(ctx,Picto.tag(ctx,  a_jnk ,  "100 20pt 'Panton Light'","#FFF"),XYZ.JNK.x+180, XYZ.JNK.y,XYZ.JNK.w,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,  a_key ,  "100 20pt 'Panton Light'","#FFF"),XYZ.KEY.x+180, XYZ.KEY.y,XYZ.KEY.w,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,  a_mtl ,  "100 20pt 'Panton Light'","#FFF"),XYZ.MTL.x+180, XYZ.MTL.y,XYZ.MTL.w,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_csm,    "100 24pt 'Panton Light'","#FFF"),XYZ.CSM.x-200, XYZ.CSM.y,XYZ.CSM.w,'left')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_bpk,    "100 24pt 'Panton Light'","#FFF"),XYZ.BPK.x-200, XYZ.BPK.y,XYZ.BPK.w,'left')
    Picto.setAndDraw(ctx,Picto.tag(ctx, a_lbx,    "100 24pt 'Panton Light'","#FFF"),XYZ.LBX.x-200, XYZ.LBX.y,XYZ.LBX.w,'left')

   menumes =  await msg.channel.send( '',gear.file( canvas.toBuffer(),'inventory.png'));
   menumes.target = Target;
   args[10](userData);
   args[11](msg.prefix);
   return menumes;
   //menumes.addReaction(_emoji("LOOTBOX").replace(/(\<:|\>)/g,'') )
   //menumes.addReaction(_emoji("BOOSTER").replace(/(\<:|\>)/g,'') )
   //menumes.addReaction(_emoji("CONSUMABLE").replace(/(\<:|\>)/g,'') )
   //menumes.addReaction(_emoji("MATERIAL").replace(/(\<:|\>)/g,'') )
   //menumes.addReaction(_emoji("KEY").replace(/(\<:|\>)/g,'') )
   //menumes.addReaction(_emoji("JUNK").replace(/(\<:|\>)/g,'') )
    

}

module.exports={
    init
    ,pub:true
    ,cmd:'inventory'
    ,perms:3
    ,cat:'inventory'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['inv']
    ,reactionButtons:[
        {
            emoji: _emoji("LOOTBOX").reaction,
            type: "edit",
            response: require("./lootbox.js").init,

            
        },{
            emoji: _emoji("BOOSTER").reaction,
            type: "edit",
            response: require("./boosterpack.js").init,

            
        },{
            emoji: _emoji("CONSUMABLE").reaction,
            type: "edit",
            response: require("./cmd.js").init,

            
        },{
            emoji: _emoji("MATERIAL").reaction,
            type: "edit",
            response: require("./cmd.js").init,

            
        },{
            emoji: _emoji("KEY").reaction,
            type: "edit",
            response: require("./cmd.js").init,

            
        },{
            emoji: _emoji("JUNK").reaction,
            type: "edit",
            response: (m,a,u)=>console.log({m,a,u}),

            
        }
    ],
    reactionButtonTimeout: 30e3 
}