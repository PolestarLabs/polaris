const Picto = require("../../utilities/Picto");

const PROJECTION = {
  id: 1, "modules.level": 1, "modules.exp": 1, "modules.bgID": 1, "modules.favcolor": 1, "modules.tagline": 1,
};

function fetchGlobalRanks() {
  return DB.users.find({}, PROJECTION).sort({ "modules.exp": -1 })
    .limit(5)
    .lean();
}
async function fetchLocalRanks(server) {
  const lRanks = await DB.localranks.find({ server }).sort({ exp: -1 })
    .limit(5);
  const dbRankData = await DB.users.find({ id: { $in: lRanks.map((u) => u.user) } }, PROJECTION).lean();
  return lRanks.map((usr) => {
    const thisUser = dbRankData.find((u) => usr.user === u.id);
    if (!thisUser) return null;
    thisUser.modules.exp = usr.exp;
    thisUser.modules.level = usr.level;
    return thisUser;
  });
}

const mFrame = Picto.getCanvas(`${paths.BUILD}/rank_mainframe.png`);

const init = async (msg, args) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const Canvas = Picto.new(718, 570);
  const ctx = Canvas.getContext("2d");

  // DATA NEEDED

  const _LOCAL = [ "server", "local", "sv", "here" ].includes(args[0]);

  const [ localRanks, userData, selfLocal ] = await Promise.all([
    // DB.servers.get(Server.id),
    fetchLocalRanks(msg.guild.id),
    DB.users.get(msg.author.id),
    DB.localranks.get({ server: msg.guild.id, user: msg.author.id }),
  ]);

  async function parseUserPosition() {
    return 1 + (_LOCAL
      ? await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).count()
      : await DB.users.find({ "modules.exp": { $gt: userData.modules.exp } }, { _id: 1 }).count());
  }

  let localUserRanks; let userRanks;
  if (_LOCAL) {
    localUserRanks = Promise.all(localRanks.map(async (index) => {
      console.log({ index });
      if (!index) return;
      const discordMember = await PLX.resolveMember(msg.guild.id, index.id);
      index.discordData = discordMember;
      return index;
    }));
  } else {
    userRanks = Promise.all((await fetchGlobalRanks()).map(async (index) => {
      const discordUser = await PLX.resolveUser(index.id);
      index.discordData = discordUser;
      return index;
    }));
  }

  userData.discordData = msg.author;
  const [ Ranks, selfRank, myPos ] = await Promise.all([
    Promise.all(_LOCAL ? (await localUserRanks).map(rankify) : (await userRanks).map(rankify)),
    rankify(userData, "self"),
    parseUserPosition(),
  ]);

  async function rankify(usr, self) {
    if (!usr) return;

    const [ avatar, bg ] = await Promise.all([
      Picto.getCanvas(usr.discordData?.avatarURL || "https://cdn.discordapp.com/embed/avatars/0.png"),
      Picto.getCanvas(`${paths.CDN}/backdrops/${usr.modules?.bgID || "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6"}.png`),
    ]);

    return new Object({
      id: usr.id,
      name: _LOCAL ? usr.discordData?.nick || usr.discordData?.user?.username : usr.discordData?.username || "Unknown",
      avatar,
      exp: self === "self" && _LOCAL ? selfLocal.exp : usr.modules.exp,
      level: self === "self" && _LOCAL ? selfLocal.level : usr.modules.level,
      tagline: usr.modules.tagline,
      color: usr.modules.favcolor,
      rubines: 0, // usr.modules.RBN,
      bg,
      ACV: 0, // (usr?.modules.achievements || []).length,
      DLY: 0, // usr.modules?.counters?.daily.streak || 0,
    });
  }

  function rankBack(usr, sec) {
    const res = Picto.new(656, sec ? 80 : 100);
    if (!usr) return res;
    const ct = res.getContext("2d");

    ct.fillStyle = usr.color;
    ct.fillRect(0, 1, 45, sec ? 80 : 100);
    ct.drawImage(usr.avatar, 90, 2, sec ? 80 : 90, sec ? 80 : 90);
    try {
      if (sec) ct.globalAlpha = 0.5;
      ct.drawImage(usr.bg, 255, -50, 400, 206);
      ct.globalAlpha = 1;
    } catch (e) {
      console.error(e);
      console.error("ERRORED BG".bgRed + usr.bg);
    }

    ct.fillStyle = "rgba(45, 63, 77,0.1)";
    ct.fillRect(255, -50, 400, 206);
    const EXP = Picto.tag(ct, usr.exp, `400 ${18 - (sec ? 2 : 0)}px 'Panton'`, "#FFF");
    const maxWidth = Math.min(EXP.width, 100);
    Picto.roundRect(ct, 606 - maxWidth, sec ? 15 : 16, maxWidth + 40, EXP.height + 4, 10, "rgb(48, 53, 67)");
    Picto.setAndDraw(ct, EXP, 610, sec ? 16 : 17, 100, "right");

    return res;
  }
  function rankFront(usr, sec) {
    const res = Picto.new(656, sec ? 80 : 100);
    const ct = res.getContext("2d");
    if (!usr) return res;
    // ct.shadowColor = "rgba(0,0,0,0.8)";
    // ct.shadowBlur = 4;
    const NME = Picto.tag(ct, usr.name, `600 ${26 - (sec ? 2 : 0)}px 'Panton'`, "#FFF");
    const LVL = Picto.tag(ct, usr.level, `900 ${36 - (sec ? 2 : 0)}px 'Panton'`, "#FFF");
    const TAG = Picto.tag(ct, usr.tagline, `400 ${16 - (sec ? 2 : 0)}px 'Panton'`, "#AAA");

    const _lvTag = Picto.tag(ct, "LEVEL", `300 ${14 - (sec ? 2 : 0)}px 'Panton'`, "#FFF");
    const _uid = Picto.tag(ct, `${miliarize(usr.rubines, true, " ")} 💎 | ${usr.id}`, `300 ${12 - (sec ? 2 : 0)}px 'monospace'`, "#FFF5");

    Picto.setAndDraw(ct, _uid, 640, sec ? 70 : 81, 450, "right");
    Picto.setAndDraw(ct, _lvTag, 60, sec ? 18 : 20, 45, "center");
    Picto.setAndDraw(ct, LVL, 60, sec ? 32 : 36, 45, "center");
    Picto.setAndDraw(ct, NME, 192, sec ? 18 : 22, 300);
    Picto.setAndDraw(ct, TAG, 192, (sec ? 15 : 21) + 32, 300);

    return res;
  }

  const YA = 100;
  const YB = 196;
  const YC = 296;
  const YD = 378;

  ctx.fillStyle = "#212329";
  ctx.fillRect(20, 20, 700, 500);
  ctx.drawImage(selfRank.avatar, 650, 485, 58, 58);
  ctx.drawImage(selfRank.bg, 245, 450, 400, 206);
  ctx.fillStyle = selfRank.color;
  ctx.fillRect(127, 450, 45, 100);
  const EXP = Picto.tag(ctx, selfRank.exp, "400 18px 'Panton'", "#FFF");
  const maxWidth = Math.min(EXP.width, 100);
  ctx.fillStyle = "rgb(48, 53, 67)";
  const gap1 = 100;
  const gap2 = 13;
  Picto.roundRect(ctx, gap1 + 506 - maxWidth, gap2 + 498, maxWidth + 40, EXP.height + 4, 10, "rgb(48, 53, 67)");
  Picto.setAndDraw(ctx, EXP, gap1 + 510, gap2 + 500, 110, "right");

  ctx.drawImage(rankBack(Ranks[0]), 57, 0);
  ctx.drawImage(rankBack(Ranks[1]), 57, YA);
  ctx.drawImage(rankBack(Ranks[2]), 57, YB);
  ctx.drawImage(rankBack(Ranks[3], true), 55, YC);
  ctx.drawImage(rankBack(Ranks[4], true), 55, YD);

  ctx.drawImage(await mFrame, 0, 0);

  const NME = Picto.tag(ctx, msg.member.nick || msg.author.username, "600 36px 'Panton'", "#FFF");
  const RNK = Picto.tag(ctx, `${myPos}`, "400 40px 'Panton'", "#FFF");
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  Picto.setAndDraw(ctx, NME, 192, 495, 300);
  Picto.setAndDraw(ctx, RNK, 75, 495, 100, "center");

  ctx.drawImage(rankFront(Ranks[0]), 57, 0);
  ctx.drawImage(rankFront(Ranks[1]), 57, YA);
  ctx.drawImage(rankFront(Ranks[2]), 57, YB);
  ctx.drawImage(rankFront(Ranks[3], true), 57, YC);
  ctx.drawImage(rankFront(Ranks[4], true), 57, YD);

  const FILE = file(await Canvas.toBuffer("image/png", { compressionLevel: 3, filters: Canvas.PNG_FILTER_NONE }), "rank.png");
  const message = _LOCAL ? `:trophy: **Local Leaderboards for ${msg.guild.name}**` : ":trophy: **Global Leaderboards**";
  msg.channel.send(message, FILE);
};
module.exports = {
  pub: true, cmd: "leaderboards", perms: 3, init, cat: "social", aliases: [ "lb", "lead" ],
};
