const axios = require("axios");

const init = async function (msg, args) {
  let imgUrl = args[0] || (await PLX.getChannelImg(msg));

  if(!imgUrl) return msg.command.invalidUsageMessage(msg);

  let response = await axios.get(`https://trace.moe/api/search?url=${imgUrl}`).catchReturn(null);
  //TODO Add better ratelimiting
  //RL = 10 per minute per IP

  const res = response?.data?.docs?.[0];

  if (!res) return msg.addReaction(_emoji("nope").reaction), "Sorry, couldn't find anything over here. :c";
  const {
    mal_id,
    episode,
    title_native,
    title_english,
    season,
    is_adult,
    filename,
    at,
    tokenthumb,
    anilist_id,
    title_romaji 
  } = res;

  const  videoLink = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;  
        
  let embed = {};
  embed.title = title_english || title_native;
  embed.color = is_adult?0xe0c917:0x17c9e0;
  embed.fields = [
    { name: "Episode", value: episode, inline: true },
    { name: "Season", value:  season , inline: true },
    {
        name: "Timestamp",
        value: `${Math.floor(res.at / 60)}:${Math.floor(res.at % 60)}`,
        inline: true,
    },
   
  ];

  //TRANSLATE[epic=translations] What anime
  embed.description = `
Original Name: **${title_native}** (${title_romaji})
${ is_adult?"\n🔞 **Adult warning**\n":"" }
\\⭐ **[MyAnimeList Link](https://myanimelist.net/anime/${mal_id})**
\\🎥 **[Scene Preview](${videoLink})**
`;
  // embed.thumbnail = {url: `https://trace.moe/thumbnail.php?anilist_id=${res.anilist_id}&file=${encodeURIComponent(res.filename)}&t=${res.at}&token=${res.tokenthumb}`}

  msg.channel.send(
    { embed },
    {
      file: await resolveFile(videoLink),
      name: (is_adult ? "SPOILER_" : "") + "pollux_anime_preview.mp4",
    }
  );

};

module.exports = {
  init,
  pub: true,
  cmd: "whatanime",
  cat: "anime",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["wa"],
  cooldown: 10000
};
