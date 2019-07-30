// const gear = require('../../utilities/Gearbox')

// const DB = require('../../database/db_ops')
//const locale = require(appRoot+'/utils/i18node');
//const $t = locale.getT();
const cmd = 'leaderboards';



const init = async function (msg,args) {
    delete require.cache[require.resolve('../../utilities/Picto')]
    const Picto = require('../../utilities/Picto')
    const Server  = msg.guild;
    const Author  = msg.author;
    let P={lngs:msg.lang,prefix:msg.prefix}
  
    let Canvas = Picto.new(718,570);
    let ctx = Canvas.getContext('2d');

    //DATA NEEDED
    let svData    = DB.servers.get(Server.id),
        localRanks= DB.localranks.find({server:msg.guild.id}).sort({'exp':-1}).limit(5),
        userData  = DB.users.get(Author.id),
        userRanks = DB.users.find({}).sort({'modules.exp':-1}).limit(5);
        
        await Promise.all([svdata=await svData, userData=await userData, userRanks=await userRanks,localRanks=await localRanks]);
        let localUsers= await DB.users.find({id:{$in:localRanks.map(u=>u.user)}});

    const localUserRanks = localRanks.map(index=> {

        let SMEM = Server.members.find(mem=>mem.id===index.user);
 
        let us=localUsers.find(u=>u.id===index.user)||SMEM||{};
        if(!us.modules) us.modules={};
        us.modules.exp = index.exp
        us.modules.level = index.level
        us.nick = SMEM.nick 
        us.user = SMEM.user 
        return us;
    });
    const _LOCAL = ['server','local','sv','here'].includes(args[0]);

    const Ranks = _LOCAL ?  localUserRanks.map(rankify) : userRanks.map(rankify);

    const selfLocal = await DB.localranks.get({server:msg.guild.id,user:msg.author.id});
    const selfRank = rankify(userData,"self");

     function rankify(usr,self){
        if(!usr) return ;
        if(!usr.meta) usr.meta = {};
        let aviDummy = {staticAvatarURL:"https://cdn.discordapp.com/embed/avatars/0.png"}
        return new Object({
            id: usr.id,
            name: _LOCAL? usr.nick || usr.name : usr.meta.username||usr.nick||usr.user.username,
            avatar: Picto.getCanvas( self==="self"?(msg.author||aviDummy).staticAvatarURL: (_LOCAL? "https://cdn.discordapp.com/avatars/"+usr.id+"/"+(usr.user||usr).avatar +".png" :(PLX.users.find(u=>u.id==usr.id)||aviDummy).staticAvatarURL) || (usr.meta.avatar||"").replace('gif','png')||"https://pollux.fun/backdrops/5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6.png"),
            exp: usr.modules.exp,
            level: usr.modules.level,
            tagline: usr.modules.tagline,
            color: usr.modules.favcolor,
            rubines: usr.modules.rubines,
            bg: Picto.getCanvas(paths.CDN+"/backdrops/"+((usr.modules||{}).bgID||"5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6")+".png"),
            ACV: (usr.modules.achievements||[]).length,
            DLY: (((usr.modules||{}).counters||{}).daily||{}).streak || 0
        });
    };

    // GATHER IMAGES NEEDED
    let mFrame = Picto.getCanvas(paths.BUILD +"/rank_mainframe.png");
console.log(paths.BUILD+"/rank_mainframe.png")
    async function rankBack(usr,sec){
        
        let res = Picto.new(656, sec?80:100);
        let ct = res.getContext('2d');
        if (!usr)return res;
        ct.fillStyle = usr.color;
        ct.fillRect(0,1,45,sec?80:100);    
    ct.drawImage(await usr.avatar,90,2,sec?80:90,sec?80:90);
    ct.drawImage(await usr.bg,255,-50,400,206);
        ct.fillStyle = "rgba(45, 63, 77,0.1)"
        ct.fillRect(255,-50,400,206);        
        let EXP = Picto.tag(ct,usr.exp,"400 "+(18-(sec?2:0))+"px 'Whitney HTF'","#FFF")
        let ww = EXP.width
        ww=ww>100?100:ww;
        Picto.roundRect(ct,606-ww,sec?15:16,ww+40,EXP.height+4,10,"rgb(48, 53, 67)")
        Picto.setAndDraw(ct,EXP,610,sec?16:17,100,'right');   

        return res;
    }

    async function rankFront(usr,sec){
        let res = Picto.new(656, sec?80:100);
        let ct = res.getContext('2d');
        if(!usr) return res;
        //ct.shadowColor = "rgba(0,0,0,0.8)";
        //ct.shadowBlur = 4;
        let NME = Picto.tag(ct,usr.name,"600 "+(26-(sec?2:0))+"px 'Whitney HTF'","#FFF")
        let LVL = Picto.tag(ct,usr.level,"900 "+(36-(sec?2:0))+"px 'Whitney HTF'","#FFF")
        let TAG = Picto.tag(ct,usr.tagline,"400 "+(16-(sec?2:0))+"px 'Whitney HTF'","#AAA")

        
        let _lvTag  = Picto.tag(ct,"LEVEL","300 "+(14-(sec?2:0))+"px 'Whitney HTF'","#FFF")
        let _uid    = Picto.tag(ct,`${miliarize(usr.rubines,true,' ')} 💎 | `+usr.id,"300 "+(12-(sec?2:0))+"px 'monospace'","#FFF5")
        
        Picto.setAndDraw(ct,_uid,640,sec?70:81,450,'right');
        Picto.setAndDraw(ct,_lvTag,60,sec?18:20,45,'center');
        Picto.setAndDraw(ct,LVL,60,sec?26:30,45,'center');
        Picto.setAndDraw(ct,NME,192,sec?16:20,300);
        Picto.setAndDraw(ct,TAG,192,(sec?16:20)+32,300);
    

        return res;
    }

    const YA=100,
          YB=196,
          YC=296,
          YD=378;

          ctx.fillStyle = "#212329"
          ctx.fillRect(20,20,700,500)      
          ctx.drawImage(await selfRank.avatar,650,485,58,58)
          ctx.drawImage(await selfRank.bg,245,450,400,206);
          ctx.fillStyle = selfRank.color;
          ctx.fillRect(127,450,45,100);   
          let EXP = Picto.tag(ctx,selfRank.exp,"400 18px 'Whitney HTF'","#FFF")
          let ww = EXP.width
          ww=ww>100?100:ww;
          ctx.fillStyle = "rgb(48, 53, 67)"
          dsp = 100
          dsp2 = 13
          Picto.roundRect(ctx,dsp+506-ww,dsp2+498,ww+40,EXP.height+4,10,"rgb(48, 53, 67)")
          Picto.setAndDraw(ctx,EXP,dsp+510,dsp2+500,100,'right');   
          
    ctx.drawImage((await rankBack(Ranks[0])),57,0);
    ctx.drawImage((await rankBack(Ranks[1])),57,YA);
    ctx.drawImage((await rankBack(Ranks[2])),57,YB);
    ctx.drawImage((await rankBack(Ranks[3],true)),55,YC);
    ctx.drawImage((await rankBack(Ranks[4],true)),55,YD);
    ctx.drawImage((await mFrame),0,0);
    
        let myPos = _LOCAL
                    ? await DB.localranks.find({server:msg.guild.id,'exp':{$gt:selfLocal.exp}},{_id:1}).count() 
                    : await DB.users.find({'modules.exp':{$gt:userData.modules.exp}},{_id:1}).count();
            myPos++;
            
        let NME = Picto.tag(ctx,msg.member.nick||msg.author.tag,"600 36px 'Whitney HTF'","#FFF");
        let RNK = Picto.tag(ctx,"#"+myPos,"400 36px 'Whitney HTF'","#FFF");
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        Picto.setAndDraw(ctx,NME,192,490,300);
        Picto.setAndDraw(ctx,RNK,75,490,100,'center');


    ctx.drawImage((await rankFront(Ranks[0])),57,0);
    ctx.drawImage((await rankFront(Ranks[1])),57,YA);
    ctx.drawImage((await rankFront(Ranks[2])),57,YB);
    ctx.drawImage((await rankFront(Ranks[3],true)),57,YC);
    ctx.drawImage((await rankFront(Ranks[4],true)),57,YD);





    let FILE = file(await Canvas.toBuffer(),"rank.png");
    let message = _LOCAL ? ":trophy: **Local Leaderboards for "+msg.guild.name+"**" : ":trophy: **Global Leaderboards**"
    msg.channel.send(message,FILE)
    


}
 module.exports = {pub:true,cmd: cmd, perms: 3, init: init, cat: 'social', aliases:["lb","lead"]};
