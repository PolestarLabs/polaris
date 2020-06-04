const YesNo = require("../../structures/YesNo.js");

const init = async function(msg, args) {
    const Target = PLX.findMember(msg.mentions[0]?.id, msg.guild.members);

    const P = {lngs: msg.lang, prefix: msg.prefix};
    const V = {};
    V.needRing = $t('responses.marry.needRing',P)
    V.ringTutorial = $t('responses.marry.ringTutorial',P)
    V.ringUsage = `**${$t('terms.usage',P)}:** \`${msg.prefix}marry @USER [jade|rubine|sapphire|stardust|<other>]\``;


    if(Target.id == msg.author.id ){
        return  $t('responses.marry.cantMarrySelf',P)
    }
    if(Target.id == PLX.user.id ){
        return  $t('responses.marry.cantMarryPollux',P)
    }
    
    const [userData,Rings] = await Promise.all([ DB.users.getFull({id:msg.author.id}), DB.items.find({subtype:'ring'}) ]);
    
    const RING = determineRing(args[0],Rings) || determineRing(args[1],Rings);
    if(!RING) return _emoji('nope') + V.needRing;

    P.userA = msg.member.nick || msg.author.username;
    P.userB = Target.nick     || Target.user.username;

    const marriages = await DB.relationships.find({type:'marriage', users: msg.author.id });
    let mrgPresent = marriages.find(mrg=> mrg.users.includes(Target.id));
    if ( mrgPresent ){
        let RING_B = determineRing(mrgPresent.ring,Rings);
        P.ringA = RING_B.name;
        P.ringB = RING.name
        if( RING_B.misc.rank > RING.misc.rank || RING_B.id === RING.id) return {
            embed:{
                color: 0xfc6858,
                description:  $t('responses.marry.alreadyMarriedInf',P),
                footer: {text: msg.author.tag, icon_url: msg.author.avatarURL}
            }
        };
        
        let upgradePrompt = await msg.channel.send({
            embed:{
                color: 0xfc9d58,
                description:  $t('responses.marry.alreadyMarriedUp',P),
                footer: {text: msg.author.tag, icon_url: msg.author.avatarURL}
            }
        });
        return YesNo(upgradePrompt,msg,function(){
            upgradeMarriage(msg,args,userData,RING,determineRing(mrgPresent.ring,Rings),mrgPresent,upgradePrompt )
        },null,null);
    }     

    const embed = new Embed();
    let proposal;
    if(RING && userData.hasItem(RING.id) ){
        embed.color = 0xf0418b
        P.ringname = RING.name;
        embed.description =  ":love_letter:  " + $t('responses.marry.proposal',P);
        proposal = await msg.channel.send({embed});
    }else{
        return noRingResponse(Rings, userData, P);
    }



    const yeses = [
        "https://66.media.tumblr.com/8f4d21737ad35cbb7c2065b9f1b9b52b/tumblr_ohtwrfvYDk1qaa0sjo1_500.gif",
        "https://66.media.tumblr.com/8b12ccc0367745083139ce78ef9e6cd1/tumblr_or6crb7bun1vikcwho1_400.gif",
        "https://i.gifer.com/JF5m.gif",
        "https://data.whicdn.com/images/279857388/original.gif",


    ]
    const noses = [
        "http://pa1.narvii.com/6533/97d4d824b044238cf4aa0b13d49224c4b0706b86_hq.gif"
        ,"https://giffiles.alphacoders.com/124/124099.gif"
        ,"http://25.media.tumblr.com/97a7d7481496b1d4ff6088d9944814e4/tumblr_mvycx77nnx1sgvgllo1_400.gif"
        ,"https://media1.giphy.com/media/6DwyHF0z7tLna/source.gif"
    ]
    const awkws = [
        "https://funnyfrenzy.nyc3.digitaloceanspaces.com/FunzyPicsCDN/assets/pins/6723576/792847001501375598_.gif"
        ,"https://cdn.discordapp.com/attachments/488142183216709653/606003189883469834/a7e8a3f8c38932ef0c44dbd590bc104caf65ddff53ee5f6c23da4d4325e432fc.gif"
    ]


    let marriageFlow = true;

    const Accept = (cancel)  => {
        embed.description = ":heartpulse: **"+ $t('responses.marry.saidYes',P)+"**\u2003 :champagne:"+_emoji('plxYay')
        marryGif = shuffle(shuffle(yeses))[0]
        embed.image={url: marryGif}
        proposal.edit({embed})
    };
    const Reject = (cancel)  => {
        embed.description = ":broken_heart: *"+ $t('responses.marry.saidNo',P)+"*\u2003 :tumbler_glass:"+_emoji('plxOof')
        marryGif = shuffle(shuffle(noses))[0]
        embed.image={url: marryGif }
        proposal.edit({embed})
        marriageFlow = false;
    };
    const Timeout = (cancel) => {
        embed.description = ":black_heart: *"+ $t('responses.marry.saidNothing',P)+"*\u2003 :cocktail:"+_emoji('PolluxChu')
        marryGif = shuffle(shuffle(awkws))[0]
        embed.image={url: marryGif }
        proposal.edit({embed})
        marriageFlow = false;
    }


    await YesNo(proposal,msg,Accept,Reject,Timeout,{ approver: Target.id, avoidEdit: true});

    if (!marriageFlow) return;
    const THIS_MARRIAGE_ID = (await DB.relationships.create("marriage",[ msg.author.id,Target.id ], msg.author.id ,RING.icon))._id;
    await userData.removeItem(RING.id);
    proposal.removeReactions().catch(e=>null);


    const featPieceLEFT =  (piece)=> `**${P.userB}** `+ (piece || _emoji('loading') + ":black_heart:")
    const featPieceRIGHT = (piece)=> (piece || ":black_heart:  "+ _emoji('loading'))+` **${P.userA}**`
    let pL=featPieceLEFT(),pR=featPieceRIGHT();
    
    const responseMe = {
        content: $t('responses.marry.addToFeatured2',P) ,
        embed: {
            color: 0xbecfcc,
            description: `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`
        }
    }
    const responseThem = {
        content: $t('responses.marry.addToFeatured',P) ,
        embed: {
            description: `${_emoji('loading')} :black_heart: `
        }
    }
    const colorgrade = [0xa7d4cc,0x68d9d1,0x41f0ed]
    let spot = 0;

    let firstRes = responseMe;
        firstRes.content= $t('responses.marry.addToFeatured',P) +"\n"+ $t('responses.marry.addToFeatured2',P) ;

    const featurePrompt  = await msg.channel.send(firstRes);
    let featurePromptState = firstRes;
        firstRes = null;

    let DoFeatMe   = ()=>{ 
        pL = featPieceLEFT( `${_emoji('yep')} :sparkling_heart:`) 
        responseThem.embed.description = `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`
        featurePromptState = responseThem;
        mutateFeaturePrompt(responseThem);
        DB.users.set(Target.id,{'featuredMarriage': THIS_MARRIAGE_ID });
    }  
    let DoFeatThem = ()=>{ 
        pR = featPieceRIGHT( `:sparkling_heart: ${_emoji('yep')}`) 
        responseMe.embed.description = `${featPieceLEFT()}\u2003 \u2003${featPieceRIGHT()}`
        featurePromptState = responseMe;
        mutateFeaturePrompt(responseMe);
        DB.users.set(msg.author.id,{'featuredMarriage': THIS_MARRIAGE_ID });
    } 
    let DontFeat = (m)=>{ 
        return function DoNotFeat(){
            let res = {content: featurePrompt.content, embed:featurePrompt.embeds[0]};
            if(m == msg.author.id) 
                pL = featPieceLEFT(`${_emoji('nope')} :broken_heart:`);
            if(m == Target.id) 
                pR = featPieceRIGHT(`:broken_heart: ${_emoji('nope')} `);
            featurePromptState = res;
            mutateFeaturePrompt(res)
        }
    }

    function mutateFeaturePrompt(res){
        spot++
        res.embed.color = colorgrade[spot]
        res.embed.description = `${pL}\u2003 \u2003${pR}`
        featurePrompt.edit(res)
    }

     await Promise.all([
          YesNo(featurePrompt ,msg,DoFeatThem,DontFeat(Target.id),DoFeatThem,{ clearReacts:false, avoidEdit: true})
         ,YesNo(featurePrompt ,msg,DoFeatMe,DontFeat(msg.author.id),DoFeatMe,{approver: Target.id,clearReacts:false, avoidEdit: true})
     ]);
     featurePrompt.removeReactions().catch(e=>null)
     featurePromptState.content =$t('responses.marry.addToFeatured3',P) 
     featurePromptState.embed.color = 0x41f0ed
     featurePrompt.edit(featurePromptState)
    




};
module.exports = {
  init,
  pub: true,
  cmd: "marry",
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  autoSubs:[
      {label:'upgrade',gen:upgradeMarriage,options:{argsRequired:true}}
  ],
  aliases: [],
  argsRequired: true
};



function noRingResponse(Rings, userData, P) {
    let ringCollection = Rings.map(ring => userData.hasItem(ring.id) ? `${ring.emoji} **${ring.name}**\n` : "").filter(r => r != "");
    if (ringCollection.length > 0)
        ringCollection = ($t('responses.marry.availableRings',P) + "\n\n" + ringCollection.join(""));
    else
        ringCollection = $t('responses.marry.actuallyNone', P);
    return {
        embed: {
            description: `${_emoji('nope') +  $t('responses.marry.noneOfThisRing',P)}
                ${_emoji('__')}${ringCollection}
                `
        }
    };
}

function determineRing(arg,Rings){
    if (!arg || arg == "") return null;
    arg = arg.toLowerCase();    
    let selectRing = Rings.find(ring=>{
        if( ring.id == arg )          return true;
        if( ring.name == arg )        return true;
        if( ring.icon == arg )        return true;
        if( arg.includes(ring.icon) ) return true;
        if( ring.id.endsWith(arg) )   return true;

        return false;        
    });
    if(selectRing) selectRing.misc = selectRing.misc || {rank:0};
    return selectRing || null;
}


 async function upgradeMarriage(msg,args, userData,RING, RING_B,mrgPresent,upgradePrompt){
    const Target = PLX.findMember(msg.mentions[0].id, msg.guild.members);
    if(Target.id == msg.author.id ) return $t('responses.marry.cantMarrySelf',P);
    const P = {lngs: msg.lang, prefix: msg.prefix};
    P.userA = msg.member.nick || msg.author.username;
    P.userB = Target.nick     || Target.user.username;

    if(! (userData?.id == msg.author.id && RING && mrgPresent) ){   
        [userData,Rings] = await Promise.all([ DB.users.getFull({id:msg.author.id}), DB.items.find({subtype:'ring'}) ]);
        RING = determineRing(args[0],Rings) || determineRing(args[1],Rings);
        
        if(!RING) return _emoji('nope') + V.needRing;
        
        const marriages = await DB.relationships.find({type:'marriage', users: msg.author.id });
        mrgPresent = marriages.find(mrg=> mrg.users.includes(Target.id));

        if(mrgPresent) RING_B = determineRing(mrgPresent.ring,Rings);
        else  return msg.addReaction(_emoji('nope').reaction);
    }

    P.ringA = RING_B.name;
    P.ringB = RING.name
    
    if( RING_B.misc.rank > RING.misc.rank || RING_B.id === RING.id ) return {
        embed:{
            color: 0xfc6858,
            description:  $t('responses.marry.alreadyMarriedInf',P),
            footer: {text: msg.author.tag, icon_url: msg.author.avatarURL}
        }
    };

    upgradePrompt = upgradePrompt || await msg.channel.send( _emoji('loading') + "Upgrading Ring" );

    if(userData.hasItem(RING?.id) ){
        await userData.removeItem(RING.id);
        await DB.relationships.set({_id:mrgPresent._id},{$set:{ring:RING.icon}});
        (upgradePrompt).edit("upgrade confirmation");
    }else{
        (upgradePrompt).edit(noRingResponse(Rings, userData, P));
    }

   
    
  
 }