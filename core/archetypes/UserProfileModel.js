const moment = require("moment");

function XPercent(X, Lv, f = 0.0427899) {
  const toNEXT = Math.trunc(((Lv + 1) / f) ** 2);
  const toTHIS = Math.trunc((Lv / f) ** 2);
  const PACE = toNEXT - toTHIS;
  const PROGRESS = X - toTHIS;
  const percent = PROGRESS / PACE;
  return percent;
}

class UserProfileModel {
  constructor(userDBData, userDiscordData) {
    this.ID = userDiscordData.id;
    this.server = userDiscordData.guild?.id;
    this.localName = userDiscordData.guild ? userDiscordData.nick || userDiscordData.user.username : userDiscordData.tag;
    this.avatar = userDiscordData.avatarURL;
    this.bot = userDiscordData.bot;

    // Pollux User Data
    if (!userDBData || !userDBData.modules) {
      userDBData = { modules: {} };
      this.PARTIAL = true;
    }

    this.favColor = /^#[0-9,A-F,a-f]{6}$/.test(userDBData.modules.favcolor) ? userDBData.modules.favcolor : "#dd5383";
    this.tagline = userDBData.modules.tagline || "";
    this.background = this.bot ? "IlyEEDBj0GLLlFl8n6boPLSkADNuBwke" : userDBData.modules.bgID || "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6";
    this.personalText = userDBData.modules.persotext || "";
    this.exp = userDBData.modules.exp || 0;
    this.level = userDBData.modules.level || 0;
    this.percent = XPercent(this.exp, this.level) || 0;
    this.sticker = userDBData.modules.sticker || null;
    this.flair = userDBData.modules.flairTop || "default";
    this.rubines = userDBData.modules.RBN || 0;
    this.sapphires = userDBData.modules.SPH || 0;
    this.medals = userDBData.modules.medals || [];
    this.marriage = userDBData.marriageData || null;
    this.commend = 0;
    this.countryFlag = userDBData.personal?.country || null;
    this.profileFrame = userDBData.switches?.profileFrame === true ? userDBData.donator : null;

    if (this.medals.length > 0) {
      const validMedals = this.medals.filter((mdl) => mdl && mdl !== "0").map((v) => this.medals.indexOf(v));
      const arrange = validMedals.length <= 4 ? validMedals.length : 9;
      this.medalsArrangement = { style: arrange, valid: validMedals };
    }
  }

  get globalRank() {
    return DB.users
      .find({ "modules.exp": { $gt: this.exp } }, {}).countDocuments().exec().then(res => {
        this.rank = res;
      });

  }

  get commends() {
    return new Promise((resolve) => {
      DB.commends.parseFull(this.ID)
        .then(res => {
          this.commend = res.totalIn;
          resolve(res.totalIn)
        })
    })
  }

  get localData() {
    return new Promise((resolve) => {
      if (!this.server) {
        this.thx = "---";
        this.localRank = "---";
        return resolve(false);
      }

      return DB.localranks.get({ user: this.ID, server: this.server }).then(async (svRankData) => {
        this.thx = svRankData?.thx || 0;
        this.localRank = await DB.localranks
          .find({ server: this.server, exp: { $gt: svRankData?.exp || 0 } }, {}).countDocuments().exec();
        return resolve(true);
      });
    });
  }

  get wifeData() {
    return new Promise(async (resolve) => {
      if (this.wife) return resolve(this.wife);
      let marriage = this.marriage || await DB.relationships.findOne({ type: "marriage", _id: this.marriage });
      if (!this.marriage) return resolve(null);

      const wifeID = marriage?.users?.find((usr) => usr !== this.ID);
      if (!wifeID) return resolve(null);
      const discordWife = PLX.users.get(wifeID)
        || (await PLX.resolveUser(wifeID))
        || { username: "Unknown", avatar: PLX.users.get(this.ID).defaultAvatarURL };

      this.wife = {
        ring: marriage.ring,
        initiative: marriage.initiative === this.ID,
        lovepoints: marriage.lovepoints || 0,
        since: moment.utc(marriage.since).fromNow(true),
        wifeName: discordWife.username,
        wifeAvatar: (discordWife.avatarURL || discordWife.avatar).replace("size=512", "size=64"),
      };

      return resolve(this.wife);

    });
  }
}

module.exports = UserProfileModel;
