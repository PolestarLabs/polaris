
/*

                         __    _                                   
                    _wr""        "-q__                             
                 _dP                 9m_     
               _#P                     9#_                         
              d#@                       9#m                        
             d##                         ###                       
            J###                         ###L                      
            {###K                       J###K                      
            ]####K      ___aaa___      J####F                      
        __gmM######_  w#P""   ""9#m  _d#####Mmw__                  
     _g##############mZ_         __g##############m_               
   _d####M@PPPP@@M#######Mmp gm#########@@PPP9@M####m_             
  a###""          ,Z"#####@" '######"\g          ""M##m            
 J#@"             0L  "*##     ##@"  J#              *#K           
 #"               `#    "_gmwgm_~    dF               `#_          
7F                 "#_   ]#####F   _dK                 JE          
]                    *m__ ##### __g@"                   F          
                       "PJ#####LP"                                 
 `                       0######_                      '           
                       _0########_                                   
     .               _d#####^#####m__              ,              
      "*w_________am#####P"   ~9#####mw_________w*"                  
          ""9@#####@M""           ""P@#####@M""                    


 VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD 

######################################################################
######################################################################
####                                                              ####
####             THIS IS DIRECT PORT OF OLD CODE                  ####
####                                                              ####
####     AND SHOULD _NOT_ BE USED WITH THE NEW CODEBASE           ####
####                                                              ####
######################################################################
####                                                              ####
####                THINGS TO BE PROPERLY PORTED:                 ####
####                                                              ####
####     -- Proper use of async/await                             ####
####     -- Proper use of SUBCOMMANDS utility                     ####
####     -- Database: EVENT INVENTORY                             ####
####     -- Vanilla asset paths that might not be available       ####
####                                                              ####
######################################################################
######################################################################
*/


const moment = require("moment");

const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 
const Picto = require('../../utilities/Picto.js')

const oldBuildPath = "https://pollux.amarok.kr/build/"


const init = async function (msg){

  const P = {lngs: msg.lang };
  moment.locale(msg.lang[0]);

  const Author = msg.author  
  const Target = await PLX.getTarget(msg.args[0],msg.guild,false,true) || msg.member;
  
  const USERDATA = await DB.users.findOne({ id: Author.id });
  const eventData = await EV.userData(Author);

  
  //if (Author.dailing === true) return message.channel.send("There's already a collect request going on!");

  
  if (msg.args[0] == "equip"){
    if ( Number(msg.args[1]) <= eventData.inventory.length ){
        if( msg.author.trading ==true )return msg.addReaction(_emoji("nope").reaction);

        let thisItem = eventData.inventory[Number(msg.args[1])-1];
        if (!thisItem) return msg.addReaction(_emoji("nope").reaction),null;
        let previousItem = eventData.inventory.find(x=>x.type===thisItem.type && x.equipped === true);
        if(previousItem){
          await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.id':previousItem.id},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();
        }
        await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.id':thisItem.id},{$set:{'eventData.halloween20.inventory.$.equipped':true}}).lean().exec();
        await DB.users.updateOne({id:Author.id},{$set:{['eventData.halloween20.'+thisItem.type]:thisItem.id}}).lean().exec();

       return msg.addReaction(_emoji("yep").reaction), null;

    }
  }  

  if (msg.args[0] == "unequip"){
    if ( Number(msg.args[1]) <= eventData.inventory.length ){

        let thisItem = eventData.inventory[Number(msg.args[1])-1]
          await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.id':thisItem.id},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();   
          await DB.users.updateOne({id:Author.id},{$set:{['eventData.halloween20.'+thisItem.type]:null}}).lean().exec();
      
      msg.addReaction(_emoji("yep").reaction);

    }else if(["head","body","legs"].includes(msg.args[1])){
      let thisItem = eventData.inventory.find(x=>x.id==eventData[msg.args[1]] )
      //msg.reply("```"+JSON.stringify(thisItem)+"```")
      await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.id':thisItem.id},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();   
      await DB.users.updateOne({id:Author.id},{$set:{['eventData.halloween20.'+msg.args[1]]:null}}).lean().exec();
      msg.addReaction(_emoji("yep").reaction);
      
      
    }else if(msg.args[1]=="all"){
       await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.equipped':true},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();   
       await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.equipped':true},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();   
       await DB.users.updateOne({id:Author.id,'eventData.halloween20.inventory.equipped':true},{$set:{'eventData.halloween20.inventory.$.equipped':false}}).lean().exec();   
       await DB.users.updateOne({id:Author.id},{$set:
           {
             'eventData.halloween20.head':null,
             'eventData.halloween20.legs':null,
             'eventData.halloween20.body':null
           }});
      msg.addReaction(_emoji("yep").reaction);
      
    }
    return;
  }
  
  if (msg.args[0] == "set" || msg.args[1] == "gender"){
    
    let resolve = msg.args[2] || msg.args[1]
    if (!resolve) return msg.reply("Missing parameter");
    if(["girl","female","gal","woman"].includes(resolve.toLowerCase()))
          await DB.users.set(Author.id,{$set: {"eventData.halloween20.gender": "girl"}});
    else if (["boy","male","guy","man"].includes(resolve.toLowerCase()))
          await DB.users.set(Author.id,{$set: {"eventData.halloween20.gender": "boy"}});
    else
      return msg.reply("Invalid Gender");
    
    msg.addReaction(_emoji("yep").reaction);
    return;

    }
  

let base = eventData.gender || "girl";
//let skin = [message.args[0]||false,message.args[1]||false,message.args[2]||false]
let equipH = (eventData.inventory||[]).find(x=>x.id == eventData.head)||{};
let equipB = (eventData.inventory||[]).find(x=>x.id == eventData.body)||{};
let equipF = (eventData.inventory||[]).find(x=>x.id == eventData.legs)||{};

const embed = {}


embed.color = 0x3b6987;
let setBonus = 0
let equippeds = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.spook||0)
let equippeds2 = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.aspectBonus||0)
equippeds.push(0)
equippeds2.push(0)
let aspectBonus = equippeds2.reduce((a,b)=>a+b);
if(equipH.costume == equipB.costume && equipB.costume == equipF.costume && equipH.costume != null ) setBonus = Math.floor(aspectBonus/3)+10;

let totalSpook =  equippeds.length > 0 ? setBonus + equippeds.reduce((a,b)=>a+b)+aspectBonus : 0


 
if(Target.id == "271394014358405121"){
  equipH = {rarity:"XR",name:"Fancy Lace Headpiece" , id:"---", aspectBonus: 40, spook: 100}
  equipB = {rarity:"XR",name:"Cute Maid Dress" , id:"---", aspectBonus: 40, spook: 100}
  equipF = {rarity:"XR",name:"Techy Robot Legs" , id:"---", aspectBonus: 40, spook: 100}
  totalSpook = 1000
}


let spookPowa = $t("events:halloween18.keywords.spookPowa",P)
/*
embed.fields = [
  { name: "**`🎩 Head  \u200b`**\u200b*`"+`[${equipH.spook||0}](+${equipH.aspectBonus||0})\`*`,
    value: equipH.id?_emoji(equipH.rarity)+equipH.name:"---",
    inline: true
  },
  { 
    name: "**`👕 Body  \u200b`**\u200b*`"+`[${equipB.spook||0}](+${equipB.aspectBonus||0})\`*`,
    value: equipB.id?_emoji(equipB.rarity)+equipB.name:"---",
    inline: true
  },
  { 
    name: "**`👞 Legs  \u200b`**\u200b*`"+`[${equipF.spook||0}](+${equipF.aspectBonus||0})\`*`,
    value: equipF.id?_emoji(equipF.rarity)+equipF.name:"---",
    inline: true
  },
  {
    name: "\u200b"+(setBonus?`\\⭐ +${setBonus} \`SET\``:""),
    value: `${spookPowa}: **${totalSpook}**\n\u200b`,
    inline: true
  }
]
*/
embed.author = {name: Target.tag+"'s Outfit", avatar_url: Target.avatarURL };
embed.description = `\`${msg.prefix}costume equip [#]\` Equip from Wardrobe
\`${msg.prefix}costume unequip [head,body,feet]\` Remove one item
\`${msg.prefix}costume set [boy,girl]\` Change character`

const canvas = Picto.new(850, 600);
const ctx = canvas.getContext('2d');  
///================= 


let skin = [
  equipH.costume,
  equipB.costume,
  equipF.costume
]

let top =  skin[0]? `${base}_${skin[0]}_head` : "none";
let mid =  skin[1]? `${base}_${skin[1]}_body` : "none";
let bot =  skin[2]? `${base}_${skin[2]}_legs` : "none";

let _base;

if(Target.id=="271394014358405121"){
  _base = await Picto.getCanvas(paths.Build+'events/halloween20/bodies/poly.png');
   }else{ 
  _base = await Picto.getCanvas(paths.Build+'/events/halloween20/bodies/'+base+'_base.png');
}

//TEST
_frame = await Picto.getCanvas(paths.Build+'/events/halloween20/frame.png');
_bar = await Picto.getCanvas(paths.Build+'/events/halloween20/rainbow_bar.png');



const _top =  await Picto.getCanvas(paths.Build+`events/halloween20/bodies/${top}.png` );
const _mid =  await Picto.getCanvas(paths.Build+`events/halloween20/bodies/${mid}.png` );
const _bot =  await Picto.getCanvas(paths.Build+`events/halloween20/bodies/${bot}.png` );    
const _cask =  await Picto.getCanvas(oldBuildPath+'event/halloween18/casket_cls.png' );    
//const _candy =  await Picto.getCanvas(oldBuildPath+'event/halloween18/casket_cls.png' );    
const _candy =  await Picto.getCanvas("https://cdn.discordapp.com/emojis/366437119658557440.png" );

let rarCols = {
  XR : "#ff3664",
  UR : "#Efa947",
  SR : "#ba6bff",
  R : "#3b90ff",
  U : "#70d473",
  C : "#beb9cc",
}
 


const BAR_MAX = 223;
const MAX_SPOOK = 100;
const MAX_ASPECT = 40;
const _d = {};
   _d.H_spook_w     =((equipH.spook||0) / (MAX_SPOOK)) * BAR_MAX;
   _d.H_aspect_w    = ((equipH.aspectBonus||0) / (MAX_ASPECT) * BAR_MAX);

   _d.B_spook_w     =((equipB.spook||0) / (MAX_SPOOK)) * BAR_MAX;
   _d.B_aspect_w    = ((equipB.aspectBonus||0) / (MAX_ASPECT) * BAR_MAX);

   _d.F_spook_w     =((equipF.spook||0) / (MAX_SPOOK)) * BAR_MAX;
   _d.F_aspect_w    = ((equipF.aspectBonus||0) / (MAX_ASPECT) * BAR_MAX);

let rainbow = ctx.createLinearGradient(520, 0, 743, 0 );
rainbow.addColorStop(0, "#9da0b8");
rainbow.addColorStop(.3, "#3dfcad");
rainbow.addColorStop(.4, "#458bDf");
rainbow.addColorStop(.6, "#a742ff");
rainbow.addColorStop(.8, "#ffaa42");
rainbow.addColorStop(1, "#ff304f");

 
ctx.fillStyle = rainbow;
 

 function drawBars(item, x,y){
  let widthA = _d[item+"_aspect_w"];    
  let widthS = _d[item+"_spook_w"];
  
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillRect(x,y,widthS,25);
  ctx.fillRect(x,y+50,widthA,25);
  ctx.globalCompositeOperation = 'source-over'
  Picto.setAndDraw( ctx,
    Picto.tag(ctx,eval('equip'+item+'.spook||0'),'600 36px "Panton"',"#DDF")
    , x-10,y,52,'right')
  
  Picto.setAndDraw( ctx,
    Picto.tag(ctx,eval('equip'+item+'.aspectBonus||0'),'600 36px "Panton"',"#DDF")
    , x-10,y+38,52,'right')
  
 } 

ctx.drawImage(_frame,0,0);

const [x,y,w,h] = [-10,70-85,426,511];

ctx.drawImage(_base,x,y,w,h);
ctx.drawImage(_bot, x,y,w,h);
if(equipH.costume !== 'duck') ctx.drawImage(_top, x,y,w,h);  //=====================================//
ctx.drawImage(_mid, x,y,w,h);                                //   DUCK HAS ISSUES WITH HEAD ORDER   //
if(equipH.costume === 'duck') ctx.drawImage(_top, x,y,w,h);  //=====================================//


drawBars('H',520,115)
drawBars('B',520,260)
drawBars('F',520,400)




const _power =   Picto.tag(ctx,totalSpook,'900 36px "Panton Black"',"#CCD");  
const _tspook =   Picto.tag(ctx,spookPowa,'600 24px "Panton"',"#CCD");  

// DRAW EQUIP
Picto.popOutTxt(ctx,equipH.name||"---",  
411,
75,
'600 26px "Panton"',rarCols[equipH.rarity],
320,{style:'#15161b',line:8});

Picto.popOutTxt(ctx,equipB.name||"---",  
411,
75+144,
'600 26px "Panton"',rarCols[equipB.rarity],
320,{style:'#15161b',line:8});

Picto.popOutTxt(ctx,equipF.name||"---",  
411,
70+144*2,
'600 26px "Panton"',rarCols[equipF.rarity],
320,{style:'#15161b',line:8});


//TEXT

Picto.popOutTxt(ctx,(eventData.caskets||"0").toString().padStart(2,'\u2002'),
426,523,
'600 32px "Panton"',"#FFF",
320,{style:'#15161b',line:8});


Picto.popOutTxt(ctx,(eventData.candy||"0").toString().padStart(4,'\u2002'),
620,519,
'600 32px "Panton"',"#FFF",
320,{style:'#15161b',line:8});

////
ctx.save()
ctx.rotate(.20534)
Picto.popOutTxt(ctx,(totalSpook||"0").toString().padStart(3,'\u2002'),  
180,406,
'600 80px "Panton Black"',"#FFF",
320,{style:'#EE6522',line:10},0);
ctx.restore()
ctx.save()
ctx.rotate(-.084)
Picto.popOutTxt(ctx, spookPowa+"!",  
50,540,
'600 32px "Panton Black"',"#FFF",
320,{style:'#fc5a03',line:8},0);
ctx.restore()

//RARS
const [rarH,rarB,rarF] = await Promise.all([
  equipH.rarity? Picto.getCanvas(paths.CDN+`/build/tiers/mobage/${equipH.rarity}.png`):"",
  equipB.rarity? Picto.getCanvas(paths.CDN+`/build/tiers/mobage/${equipB.rarity}.png`):"",
  equipF.rarity? Picto.getCanvas(paths.CDN+`/build/tiers/mobage/${equipF.rarity}.png`):"",
]);

if (equipH.rarity) ctx.drawImage(rarH, 390-25, 85-25,50,50) ;
if (equipB.rarity) ctx.drawImage(rarB, 390-25, 85-25+143,50,50) ;
if (equipF.rarity) ctx.drawImage(rarF, 390-25, 85-25+143+143,50,50) ;

ctx.translate(0,-40)

//drawImage(_base,-10,70);



/*
ctx.fillStyle = "#282a31"
ctx.fillRect(0,0,400,200)
ctx.fillStyle = "rgba(55, 60, 70, 0.49)"
ctx.fillRect(10,10,180,180)
ctx.fillRect(200,10,190,30)
ctx.fillRect(200,50,190,30)
ctx.fillRect(200,90,190,30)
ctx.fillRect(200,130,190,60)
x=55
y=10
w=125
h=150

let ww
let MW = 180
ctx.drawImage(_tspook.item, _power.width + 40,165)
ctx.drawImage(_power.item, 30,150)
ww= _hat.width > MW ? MW : _hat.width
ctx.drawImage(_hat.item,205, 20, ww ,_hat.height);
ww= _bod.width > MW ? MW : _bod.width
ctx.drawImage(_bod.item,205, 60, ww ,_bod.height);
ww= _leg.width > MW ? MW : _leg.width
ctx.drawImage(_leg.item, 205,100, ww ,_leg.height);

ctx.drawImage(_cask, 200,135, 45,45);
ctx.drawImage(_txcaskr.item,26+  230,150);
ctx.drawImage(_candy, 300,143, 28,28);
ctx.drawImage(_txcandy.item,45+ 290,150);
*/

let attc = "attachment://costume.png"



//embed.setThumbnail(Target.displayAvatarURL())
embed.image = {url:attc};
embed.footer = {text:"Pollux Halloween Event 2020", icon_url:"https://pollux.amarok.kr/medals/pumpxd.png"};

msg.channel.send({embed},{
  file: canvas.toBuffer(),
  name: "costume.png",
})





}
module.exports={
  init
  ,pub:false
  ,cmd:'costume'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:['cst']
}





 