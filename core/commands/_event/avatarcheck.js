
const PXL = require('pixelmatch');
const Picto = require("../../utilities/Picto");


let frames = {
    dusk: 'https://cdn.discordapp.com/attachments/488142034776096772/768533054033100891/1603302958410.png',
    umbral: 'https://cdn.discordapp.com/attachments/488142034776096772/768533077164032040/1603302964011.png'
}

const init= async function run(msg,args) {

    const P = {lngs: msg.lang,prefix:msg.prefix};
 
  try{

    let propic =  (msg.author.avatarURL)

    const [duskCanvas,umbralCanvas,propicCanvas] = await Promise.all([
        Picto.getCanvas( frames.dusk ), Picto.getCanvas( frames.umbral ), Picto.getCanvas( propic)
    ]);


    const dimensions = [15,15]

    let PROPIC= Picto.new(...dimensions);
    let ca=PROPIC.getContext("2d");
    ca.drawImage(propicCanvas,-5, -5);

    let DUSK= Picto.new(...dimensions);
    let ca2=DUSK.getContext("2d");
    ca2.drawImage(duskCanvas,-5, -5);

    let UMBRAL= Picto.new(...dimensions);
    let ca3=UMBRAL.getContext("2d");
    ca3.drawImage(umbralCanvas,-5, -5);

    
    const [PROPIC_BUFFER,DUSK_BUFFER,UMBRAL_BUFFER] = await Promise.all([
        PROPIC.toBuffer(), DUSK.toBuffer(), UMBRAL.toBuffer()
    ]);

    const checkDUSK = PXL(
      PROPIC_BUFFER,
      DUSK_BUFFER,
      console.log, dimensions[0],dimensions[1],
      {includeAA:false,threshold:.25}
    );
    const checkUMBRA = PXL(
      PROPIC_BUFFER,
      UMBRAL_BUFFER,
      null, dimensions[0],dimensions[1],
      {includeAA:false,threshold:.25}
    );
    
      if (msg.channel.id === "599352130486403079"){
        msg.channel.send(` ${"```c"}
        MATCH UMBRA: ${checkUMBRA}
        MATCH DUSK: ${checkDUSK}
        Threshold: 10%
        AA: false

        ${"```"}`);
        msg.channel.send("PFP BUFFER",{file: PROPIC_BUFFER, name:'test.png'});
        msg.channel.send("DUSK BUFFER",{file: DUSK_BUFFER, name:'test.png'});
        msg.channel.send("UMBRA BUFFER",{file: UMBRAL_BUFFER, name:'test.png'});

      }



    if(args !== true){

      console.log({checkDUSK,checkUMBRA})

      if(checkUMBRA === 0) msg.channel.send(_emoji('yep')+" "+$t("events:halloween20.avatar.night",P)+"\n"+$t("events:halloween20.avatar.fine",P) );
      else if (checkDUSK === 0)  msg.channel.send(_emoji('yep')+" "+$t("events:halloween20.avatar.dusk",P)+"\n"+$t("events:halloween20.avatar.fine",P) );
      else msg.channel.send(_emoji('nope')+" "+$t("events:halloween20.avatar.inad",P));
    }
 
    if(args === true){
        if( checkUMBRA === 0) return  'umbral';
        if (checkDUSK === 0) return 'dusk'
        return 'none';
    }

 
  }catch(e){
    console.error(e)
  }

}
  
  
module.exports = {
    pub: false,
    cmd: "avatarcheck",
    aliases:['checkavatar'],
    perms: 3,
    init: init,
    cat: 'event',
    cool:5000,
};