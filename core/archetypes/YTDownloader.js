global.userLimits = new Map();
const { Bucket } = require("eris");

const ratelimit = (user) => {
  let thisUserBucket = userLimits.get(user);
  if (!thisUserBucket) {
    userLimits.set(user, new Bucket(5, 30 * 60 * 1000, { latencyRef: { latency: 30e3 } }));
    thisUserBucket = userLimits.get(user);
  }
  return thisUserBucket.queue(() => { "OK"; });
};

const ytdl = require("ytdl-core");

function grabYTMusic(URL, user) {
  return new Promise(async (resolve, reject) => {
    const chunks = [];
    let fileBuffer;

    const thisUserBucket = userLimits.get(user);
    const userCooldown = thisUserBucket ? thisUserBucket.tokens < thisUserBucket.tokenLimit : true;
    console.log(thisUserBucket);
    if (!userCooldown) return reject("COOLDOWN");

    ytdl.getInfo(URL).then((a, b) => {
      const { title } = a.videoDetails;
      const max15 = a.formats[0].approxDurationMs < 900000;

      if (!max15) return reject("MAXTIME");
      ratelimit(user);

      const STREAM = ytdl(URL, { quality: "lowestaudio" });

      STREAM.once("error", (err) => {
        console.error(err);
      });

      STREAM.once("end", () => {
        fileBuffer = Buffer.concat(chunks);
        return resolve({ file: fileBuffer, name: `${title}.mp3` });
      });

      STREAM.on("data", (chunk) => {
        chunks.push(chunk);
      });
    });
  });
}

module.exports = grabYTMusic;
