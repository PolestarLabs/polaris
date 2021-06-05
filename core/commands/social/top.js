// @ts-nocheck

const topServer = (m) => require("./leaderboards.js").init(m, ["local"]);
const topGlobal = (m) => require("./leaderboards.js").init(m, ["global"]);

//FUTURE[epic=anyone] Turn this into a utility function outside of this command
const BANNED_RANGES = [
  "\u0600-\u0FFF"
]
const Sanitizer = (string) => {
  const rangesRegex = new RegExp(`[${BANNED_RANGES.join('')}]`,"g");
  return string.replaceAll(rangesRegex,"\\💩");
}
///////////////////////////////////////////////////////////////////////////

const topCommend = async (m) => {
  const userData = await DB.users.get(m.author.id);

  
  const myCommends = await DB.commends.parseFull(m.author.id);
  const [commendSort,commendedSort, myRankIn,myRankOut] = await
  Promise.all([
    DB.commends.aggregate([{$group:{_id:"$from",total:{$sum:"$count"}}},{$sort:{total:-1}},{$limit:10}]),
    DB.commends.aggregate([{$group:{_id:"$to",total:{$sum:"$count"}}},{$sort:{total:-1}},{$limit:10}]),
    ((await DB.commends.aggregate([{$group:{_id:"$to",total:{$sum:"$count"}}},{$match:{total: {$gt:myCommends.totalIn } }},{$count: "COUNT" }]))[0]?.COUNT || 0 )+1,
    ((await DB.commends.aggregate([{$group:{_id:"$from",total:{$sum:"$count"}}},{$match:{total: {$gt:myCommends.totalOut } }},{$count: "COUNT" }]))[0]?.COUNT || 0 )+1,
  ]);

  let neededUsers = [...new Set( [...commendSort.map(x=>x._id),...commendedSort.map(x=>x._id)] )];
  const usersDiscordData = await Promise.all( neededUsers.map( PLX.resolveUser ) );

  //CommendRank.forEach((usr) => { usr.name = PLX.resolveUser(usr.id)?.username || usr.name; });

  const isUsr = (x) => x.id === m.author.id;

  console.log(usersDiscordData)

  const [listCommend,  listCommenders,  listCommend2,  listCommenders2] = [

    (commendedSort.slice(0, 3).map(
        (x) => {
          let user = usersDiscordData.find(u=>u.id===x._id);
          return `:reminder_ribbon: *\`\u200b${(x.total || 0).toString().padStart(3, "\u2003")} \`\u2003[${
            (isUsr(user) ? "**" : "")
            + Sanitizer(user.username.slice(0, 16)) + ( user.username.length > 15 ? "..." : "")
            + (isUsr(user) ? "**" : "")
          }](${paths.DASH}/p/${x._id})*`
        }
      )),

    (commendSort.slice(0, 3).map(
        (x) => {
          let user = usersDiscordData.find(u=>u.id===x._id);
          return `${_emoji("plxcoin")}*\`\u200b${(x.total || 0).toString().padStart(3, "\u2003")} \`\u2003[${
          (isUsr(user) ? "**" : "")
                    + Sanitizer(user.username.slice(0, 16)) + (user.username.length > 15 ? "..." : "")
                    + (isUsr(user) ? "**" : "")
          }](${paths.DASH}/p/${x._id})*`
        }
      )),

    (commendedSort.slice(3, 10).map(
        (x) => {
          let user = usersDiscordData.find(u=>u.id===x._id);
          return `:reminder_ribbon: *\`\u200b${(x.total || 0).toString().padStart(3, "\u2003")} \`\u2003[${
            (isUsr(user) ? "**" : "")
                      + Sanitizer(user.username.slice(0, 16)) + (user.username.length > 15 ? "..." : "")
                      + (isUsr(user) ? "**" : "")
          }](${paths.DASH}/p/${x._id})*`
        }
      )),

    (commendSort.slice(3, 10).map(
        (x) => {
          let user = usersDiscordData.find(u=>u.id===x._id);
          return `${_emoji("plxcoin")}*\`\u200b${(x.total || 0).toString().padStart(3, "\u2003")} \`\u2003[${
            (isUsr(user) ? "**" : "")
            + Sanitizer(user.username.slice(0, 16)) + (user.username.length > 15 ? "..." : "")
            + (isUsr(user) ? "**" : "")
          }](${paths.DASH}/p/${x._id})*`
        }
      ))
  ];

  console.log(listCommend)

  const embed = {
    thumbnail: { url: `${paths.DASH}/build/rank.png` },
    color: 0x3b9ea5,
    description: `**Your Score** \u2003 :reminder_ribbon: **#${myRankIn}** (${ myCommends.totalIn }) \u2003 | \u2003  ${_emoji("plxcoin")}**#${myRankOut}** (${ myCommends.totalOut })`,
    fields: [
      { name: "Top Commended", value: `${(listCommend).join("\n").slice(0, 1024)}\u200b`, inline: true },
      { name: "Top Commenders", value: `${(listCommenders).join("\n").slice(0, 1024)}\u200b`, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "\u200b", value: `${(listCommend2).join("\n").slice(0, 1024)}\u200b`, inline: true },
      { name: "\u200b", value: `${(listCommenders2).join("\n").slice(0, 1024)}\u200b`, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
    ],
  };

  console.log({ listCommenders, embed });
  return { embed };
};

const topThanks = async (msg) => {
  const rank = await DB.localranks.find({ server: msg.guild.id, thx: { $gt: 0 } }).sort({ thx: -1 }).limit(10).lean();
  const rankmap = rank.map((usr, i) => `${_emoji(`rank${i + 1}`)} - **\`${(usr.thx || 0).toString().padStart(2, " ")}\`**×${_emoji("THX")}\u2002<@${usr.user}> `).join("\n");

  return {
    embed: {
      description: rankmap,
      footer: {
        icon_url: msg.guild.iconURL,
        text: msg.guild.name,
      },
    },
  };
};

module.exports = {
  init: topGlobal,
  pub: true,
  cmd: "top",
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  autoSubs: [
    {
      label: "commend",
      gen: topCommend,
      options: {
        aliases: ["rep", "com", "rec"],
        invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
      },
    },
    {
      label: "thanks",
      gen: topThanks,
      options: {
        aliases: ["thx", "obg", "vlw", "svp"],
        invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "thanks", opt: "social" }); },
      },
    },
    { label: "server", gen: topServer, options: { aliases: ["local", "here", "sv"] } },
    { label: "global", gen: topGlobal, options: { aliases: ["all", "world"] } },
  ],
};
