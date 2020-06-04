const {Member} = require('eris');
const moment = require("moment");
// const DB = require('../database/db_ops')

class UserProfileModel{
    constructor(userData,discordMember){
      console.log({discordMember})
      // Discord Data
      if(!discordMember) discordMember = PLX.users.get(userData.id||userData);
      
      if(userData?.constructor.modelName !== "UserDB" && userData?.type!="udata" ) discordMember = userData;
      if(typeof discordMember === 'string') discordMember = PLX.users.get(discordMember);
      const notMember = discordMember && discordMember.constructor != Member;
  
      this.ID = discordMember.id;
      this.server = notMember ? null : discordMember.guild.id;
      this.localName = notMember ? discordMember.tag : discordMember.nick || discordMember.user.username;
      this.avatar = notMember ? discordMember.avatarURL : discordMember.user.avatarURL;
      this.bot = discordMember.bot;
      
      // Pollux User Data
      if(!userData || !userData.modules) {
        userData = {modules:{}};
        this.PARTIAL = true;
      }
  
      this.favColor     = /^#[0-9,A-F,a-f]{6}$/.test(userData.modules.favcolor) ? userData.modules.favcolor : "#dd5383";
      this.tagline      = userData.modules.tagline  || ""; 
      this.background   = this.bot ? "IlyEEDBj0GLLlFl8n6boPLSkADNuBwke" : userData.modules.bgID || "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6"; 
      this.personalText = userData.modules.persotext|| "";
      this.exp          = userData.modules.exp      || 0;
      this.level        = userData.modules.level    || 0;
      this.percent      = XPercent(this.exp,this.level) || 0;
      this.sticker      = userData.modules.sticker  || null;
      this.flair        = userData.modules.flairTop || 'default';
      this.rubines      = userData.modules.rubines  || 0;
      this.sapphires    = userData.modules.sapphires  || 0;
      this.medals       = userData.modules.medals   || [];
      this.marriage     = userData.featuredMarriage || null;
      this.commend      = userData.modules.commend  || 0;
      this.countryFlag  = userData.personal?.country || null;
      this.profileFrame = userData.switches?.profileFrame === true ? userData.donator : null;
      
      if(this.medals.length>0){
        let valid_medals = this.medals.filter(mdl=>mdl&&mdl!="0").map(v=> this.medals.indexOf(v) );
        let arrange = valid_medals.length <= 4 ? valid_medals.length : 9; 
        this.medalsArrangement = {style:arrange,valid:valid_medals}
      }      
    }
  
    get globalRank (){
       return DB.users
          .find({"modules.exp": {$gt: this.exp} },{} ).countDocuments().exec();
    }
  
    get localData (){
      return new Promise(async resolve=>{
        if (!this.server){
          this.thx = "---"
          this.localRank = "---"
          return resolve(false);
        }
      
        let svRankData = await DB.localranks.get({user:this.ID,server:this.server});
        this.thx = svRankData?.thx || 0;
        this.localRank = await DB.localranks
          .find({server:this.server,exp:{$gt:svRankData?.exp||0}},{}).countDocuments().exec();
        return resolve(true);
      })
    }
  
    get wifeData (){
      return new Promise(async resolve=>{
        if (this.wife) return resolve(this.wife);
        if (!this.marriage) return resolve(null);
        const marriage = await DB.relationships.findOne({type:'marriage', _id: this.marriage });
        if (!marriage) return resolve(null);
        const wifeID = marriage.users.find(usr=>usr!=this.ID);
        if (!wifeID) return resolve(null);
        let discordWife = PLX.users.get(wifeID) || (await DB.users.get(wifeID)).meta || {username: "Unknown", avatar: PLX.users.get(userID).defaultAvatarURL };
  
        this.wife = {
          ring: marriage.ring,
          initiative: marriage.initiative === this.ID,
          lovepoints: marriage.lovepoints||0,
          since:  moment.utc(marriage.since).fromNow(true),
          wifeName: discordWife.username,
          wifeAvatar: (discordWife.avatarURL || discordWife.avatar).replace("size=512","size=64")
        }
        resolve(this.wife);
      });
    }
  
  }

  function XPercent(X, Lv, f = 0.0427899) {
    let toNEXT = Math.trunc(Math.pow((Lv + 1) / f, 2));
    let toTHIS = Math.trunc(Math.pow(Lv / f, 2));
    let PACE = toNEXT - toTHIS;
    let PROGRESS = X - toTHIS
    let percent = PROGRESS / PACE;
    return percent;
  }

module.exports = UserProfileModel  