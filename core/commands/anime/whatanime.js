const axios = require("axios");

const init = async function (msg, args) {
  let imgUrl = args[0] || (await PLX.getChannelImg(msg.referencedMessage||msg));

  if (!imgUrl) return msg.command.invalidUsageMessage(msg);

  const URL = `https://api.trace.moe/search?url=${imgUrl}&anilistInfo=1`;
  let response = await axios.get(URL).catch(err=>{
    console.log('err')
    console.log(err)
  });
  //TODO Add better ratelimiting
  //RL = 10 per minute per IP

  const res = response?.data?.result?.[0];
  console.log ({URL,res,response})

  if (!res) return msg.addReaction(_emoji("nope").reaction), "Sorry, couldn't find anything over here. :c";
  const {
    video,
    image,
    mal_id,
    episode,
    season,
    filename,
    at,
    tokenthumb,
    anilist_id,
    anilist,

  } = res;
  
  const is_adult = res.anilist.isAdult
  const title_native = res.anilist.title.native
  const title_english = res.anilist.title.english
  const title_romaji = res.anilist.title.romaji

  const videoLink = video; //`https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;

  let embed = {};
  embed.title = title_english || title_native;
  embed.color = is_adult ? 0xe0c917 : 0x17c9e0;
  embed.fields = [
    { name: "Episode", value: "\u200b" + episode, inline: true },
   // { name: "Season", value: "season", inline: true },
    {
      name: "Timestamp",
      value: `${Math.floor(res.from / 60)}:${Math.floor(res.from % 60)}`,
      inline: true,
    },

  ];

  //TRANSLATE[epic=translations] What anime
  embed.description = `
Original Name: **${title_native}** (${title_romaji})
${is_adult ? "\n🔞 **Adult warning**\n" : ""}
\\⭐ **[MyAnimeList Link](https://myanimelist.net/anime/${anilist.idMal})**

`;
  // embed.thumbnail = {url: `https://trace.moe/thumbnail.php?anilist_id=${res.anilist_id}&file=${encodeURIComponent(res.filename)}&t=${res.at}&token=${res.tokenthumb}`}

  let fileobj;
  try{
    fileobj = {
      file: await resolveFile(videoLink),
      name: (is_adult ? "SPOILER_" : "") + "pollux_anime_preview.mp4",
      description: `Short anime preview scene for ${title_english||title_romaji}.`
    };

  }catch(err){
   console.log(videoLink) 
  }

  Progression.emit("action.whatanime.success",{userID:msg.author.id, msg});
  msg.channel.send(
    { embed },
    fileobj
  );

};

module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "whatanime",
  cat: "anime",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["wa"],
  cooldown: 10000
};
