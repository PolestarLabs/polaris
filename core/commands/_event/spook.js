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
####     -- Timed Command: does not use TimedCommand module       ####
####                                                              ####
####                                                              ####
######################################################################
######################################################################
*/

const moment = require("moment");

const EventData = require("../../archetypes/Events.js");
const EV = EventData.event_details;


const init = async function (msg) {
  const P = { lngs: msg.lang, user: msg.author.tag };
  moment.locale(msg.lang[0]);

  const Author = msg.author;

  const USERDATA = await DB.users.findOne({ id: Author.id }).lean();
  const eventData = await EV.userData(Author);

  const v = {
    last: $t("interface.daily.lastdly", P),
    next: $t("interface.daily.next", P),
    streakcurr: $t("interface.daily.streakcurr", P),
    expirestr: $t("interface.daily.expirestr", P),
  };

  if (Author.dailing === true) return msg.channel.send("Spooky.");

  //const STREAK_EXPIRE = 1.296e+8*2
  const DAY = 2.16e7;
  const now = Date.now();

  const userDaily =
    ((USERDATA.eventData || {}).halloween18 || {}).dailysec || 1;

  msg.reply("usDl: "+userDaily)

  const dailyAvailable = now - userDaily >= DAY;

  const embed = {}
  embed.color = 0xd83668;

  if (!dailyAvailable && Author.id != "88120564400553984zz") {
    let r = userDaily + DAY;
    P.Xhours = moment.utc(r).fromNow(true);
    let dailyNope = $t("events:halloween18.spook.cooldown", P);
    msg.reply(
      _emoji("nope") +
        dailyNope +
        "\n Or get a decoy doll from the Gravekeeper! "
    );
    let embe2 = {}
    embe2.color = 0xe35555;
    embe2.description = `
${_emoji("time")} **${v.last}** ${moment.utc(userDaily).fromNow()}
    `;

    msg.channel.send({
      embed: embe2,
    });

    return;
  }

  let rand = randomize(1, 20);

  let equipH =
    (eventData.inventory || []).find((x) => x.id == eventData.head) || {};
  let equipB =
    (eventData.inventory || []).find((x) => x.id == eventData.body) || {};
  let equipF =
    (eventData.inventory || []).find((x) => x.id == eventData.legs) || {};

  let setBonus = 0;
  let equippeds = (eventData.inventory || [])
    .filter((itm) => [equipH.id, equipB.id, equipF.id].includes(itm.id))
    .map((x) => x.spook || 0);
  let equippeds2 = (eventData.inventory || [])
    .filter((itm) => [equipH.id, equipB.id, equipF.id].includes(itm.id))
    .map((x) => x.aspectBonus || 0);
  equippeds.push(0);
  equippeds2.push(0);
  let aspectBonus = equippeds2.reduce((a, b) => a + b);
  if (
    equipH.costume == equipB.costume &&
    equipB.costume == equipF.costume &&
    equipH.costume != null
  )
    setBonus = Math.floor(aspectBonus / 3) + 10;

  let totalSpook =
    equippeds.length > 0
      ? setBonus + equippeds.reduce((a, b) => a + b) + aspectBonus
      : 0;

  let noise = randomize(-10, +10);
  let candyDrop = totalSpook + noise;
  candyDrop = candyDrop < 0 ? 1 : candyDrop;

  if (totalSpook < 5) {
    return msg.reply($t("events:halloween18.spook.advisor", P));
  }

  let spookText = $t("events:halloween18.spook.spookintro", P);
  let BOO = $t("events:halloween18.spook.BOO", P) + "\n";
  P.count = "<:candy1:366437119658557440> " + candyDrop;
  let spookText2 = $t("events:halloween18.spook.followup", P);
  embed.description = spookText;

  let rfc = { C: 0.185, U: 0.25, R: 0.5, SR: 0.75, UR: 1, XR: 0.8 };
  let rfac = [rfc[equipH.rarity], rfc[equipB.rarity], rfc[equipF.rarity]];

  await DB.users.set(Author.id, {
    $set: {
      "eventData.halloween18.dailysec": now,
    },
    $inc: {
      "eventData.halloween18.candy": candyDrop,
    },
  });

  await DB.users.updateOne(
    {
      id: Author.id,
      "eventData.halloween18.inventory.id": equipH.id,
    },
    {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(
          Math.ceil(1 + noise * rfac[0] || 5)
        ),
        "eventData.halloween18.inventory.$.uses": 1,
      },
    }
  );

  await DB.users.updateOne(
    {
      id: Author.id,
      "eventData.halloween18.inventory.id": equipB.id,
    },
    {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(
          Math.ceil(1 + noise * rfac[1] || 5)
        ),
        "eventData.halloween18.inventory.$.uses": 1,
      },
    }
  );

  await DB.users.updateOne(
    {
      id: Author.id,
      "eventData.halloween18.inventory.id": equipF.id,
    },
    {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(
          Math.ceil(1 + noise * rfac[2] || 5)
        ),
        "eventData.halloween18.inventory.$.uses": 1,
      },
    }
  );

  embed.footer = {text:Author.tag, icon_url: Author.avatarURL};

  msg.channel.send({ embed }).then(async (mes) => {
    await wait(2);
    embed.thumbnail = {url:
      "https://pollux.amarok.kr/build/event/halloween18/spoop/scare%20(" +
      rand +
      ").gif"
    }
    

    embed.description = spookText + BOO;
    mes.edit({ embed });
    await wait(2);
    embed.description = spookText + BOO + spookText2;
    mes.edit({ embed });
  });
};



module.exports={
  init
  ,pub:false
  ,cmd:'spook'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:[]
}