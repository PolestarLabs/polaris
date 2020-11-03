
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
####     -- Database: INVENTORY here is handled the old way       ####
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
  const P = { lngs: msg.lang };
  moment.locale(msg.lang[0]);

  const Author = msg.author;

  const USERDATA = await DB.users.findOne({ id: Author.id });

  const v = {
    last:
      "<:shovel:504412718871085077> " +
      $t("events:halloween18.dig.lastTomb", P),
    next:
      "<:grave:465902357465661442> " +
      $t("events:halloween18.dig.moreTombs", P),
  };

  //if (Author.dailing === true) return message.channel.send("There's already a dig request going on!");

  //const STREAK_EXPIRE = 1.296e+8*2embed
  const DAY = 5 * 60 * 60000;
  const now = Date.now();

  const userDaily = USERDATA.eventDaily || 1;
  const dailyAvailable = now - userDaily >= DAY;

  const embed = {};
  embed.color = 0xd83668;

  if (msg.content.endsWith("info")) {
    let infoEmbed = {};
    infoEmbed.color = 0xe35555;
    infoEmbed.description =(
      "**" +v.last +"** " +
        moment.utc(userDaily).fromNow() +"\n" +
        v.next + " " +
        moment
          .utc(userDaily)
          .add(DAY / 1000 / 60 / 60, "hours")
          .fromNow()
    );
    return msg.channel.send({embed: infoEmbed});
  }

  if (
    !USERDATA.modules.inventory.includes("shovel") &&
    !USERDATA.modules.inventory.includes("excavator")
  ) {
    P.SHOVEL_LINK = `**[<:shovel:504412718871085077> ${$t(
      "events:halloween18.dig.shovel",
      P
    )}](https://pollux.amarok.kr/crafting#shovel "Pollux Website: Crafting Guide")**`;
    embed.description = 
      ":no_entry_sign: " + $t("events:halloween18.dig.needShovel", P)
    ;

    return msg.reply({ embed });
  }

  if (!dailyAvailable && Author.id != "88120564400553984z") {
    let r = userDaily + DAY;
    P.Xtime = moment.utc(r).fromNow(true);
    let dailyNope = $t("events:halloween18.dig.cooldown", P);
    msg.reply(_emoji("nope") + dailyNope);
    let availabilityEmbed = {};
    availabilityEmbed.color = 0xe35555;
    availabilityEmbed.description = `
${_emoji("time")} **${v.last}** ${moment.utc(userDaily).fromNow()}
    `;

    msg.channel.send({embed: availabilityEmbed});
    shovelocalypse();
    return;
  }

  await DB.users.set(Author.id, { $set: {eventDaily: now}  });

  if (USERDATA.modules.inventory.includes("excavator")) {
    await DB.users
      .updateOne(
        { id: Author.id },
        {
          $inc: {
            eventDaily: +((DAY / 5) * 4),
            "eventData.halloween20.caskets": 2,
          },
        }
      )
      .lean()
      .exec();
    const gotCasket =
      "You excavated 2 Caskets! Next Excavation will be available in 10 hours!";
    msg.channel.send(gotCasket);
  } else {
    await DB.users
      .updateOne(
        { id: Author.id },
        { $inc: { "eventData.halloween20.caskets": 1 } }
      )
      .lean()
      .exec();
    const gotCasket =
      "<:shovel:504412718871085077> " +
      $t("events:halloween18.caskets.gotCasket", P);
    msg.channel.send(gotCasket);
  }

  shovelocalypse();

  async function shovelocalypse() {
    if (USERDATA.modules.inventory.includes("excavator")) {
      if (randomize(0, 100) == 13) {
        await DB.users
          .updateOne(
            { id: Author.id, "modules.inventory": "excavator" },
            { $set: { "modules.inventory.$": "broken_excavator" } }
          )
          .lean()
          .exec();
        msg.channel.send(
          "Something went wrong... Your excavator poofed! :( "
        );
      }

      return;
    }

    if (randomize(0, 20) == 4) {
      await DB.users
        .updateOne(
          { id: Author.id, "modules.inventory": "shovel" },
          { $set: { "modules.inventory.$": null } }
        )
        .lean()
        .exec();
      await DB.users
        .updateOne({ id: Author.id }, { $pull: { "modules.inventory": null } })
        .lean()
        .exec();
      msg.channel.send(
        rand$t("responses.verbose.interjections.ohmy_negative",  P) +
          $t("events:halloween18.dig.shovelbroke", P)
      );
    }
  }
};

 
module.exports={
  init
  ,pub:true
  ,cmd:'dig'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:[]
}