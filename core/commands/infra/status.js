// TRANSLATE[epic=translations] status

const { inspect } = require("util");
const os = require("os");

const init = async function (msg) {
  const moment = require("moment");
  moment.locale(msg.lang[0] || "en");

  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  const emb = new Embed();

  emb.color("#e83774");

  // let SHARDATA=(await globalDB.get()).shardData;

  const server_estimate_count = PLX.guilds.size / PLX.shards.size * PLX.options.maxShards;
  const user_estimate_count = PLX.users.size / PLX.shards.size * PLX.options.maxShards;
  const ping = `${msg.guild.shard.latency}ms`;
  const duration = moment(Date.now() + PLX.uptime) - moment();
  const s = Math.floor((duration / 1000) % 60);
  const m = Math.floor((duration / 1000 / 60) % 60);
  const h = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const d = Math.floor(duration / (1000 * 60 * 60 * 24));
  const uptime = `${(d ? `${d}D ` : "") + (duration >= 3.6e+6 ? `${h}h ` : "") + (duration >= 60000 ? `${m}m ` : "") + s}s`;

  const ram_usage = `${Math.round(inspect(process.memoryUsage().heapUsed) / 1000000)}~${Math.round(inspect(process.memoryUsage().heapTotal) / 1000000)}`;

  emb.thumbnail(PLX.user.avatarURL);

  emb.field("\u200b", "𝚂𝚘𝚌𝚒𝚊𝚕 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗 ", false);

  emb.field(`${_emoji("mobo")}  Estimated Servers`, `\`\`\`ml\n~${miliarize(server_estimate_count, true)}\`\`\``, true);
  emb.field(":busts_in_silhouette:   Active Users", `\`\`\`ml\n~${miliarize(user_estimate_count)}\`\`\``, true);

  emb.field("\u200b", "𝚃𝚎𝚌𝚑𝚗𝚒𝚌𝚊𝚕 𝚂𝚝𝚊𝚝𝚞𝚜 ", false);
  emb.field(`${_emoji("cog")}  Websocket Latency`, `\`\`\`ml\n${ping}\`\`\``, true);
  emb.field(`${_emoji("memslot")}  Memory Heap`, `\`\`\`ml\n${ram_usage} MB\`\`\``, true);

  emb.field("\u200b", "\u200b", false);
  // emb.field(_emoji('mobo')+'   Servers in this Shard              \u200b',"```css\n"+(`[${getShardCodename(POLLUX,Number(msg.guild.shard.id)+1)} Shard] `)+(bot.guilds.filter(x=>x.shard.id==msg.guild.shard.id).size)+"```", true)
  emb.field(`${_emoji("mobo")}  Cluster Svs         \u200b`, "```css\n" + (`[${PLX.cluster.name}-${process.env.CLUSTER_ID}] ${PLX.guilds.size}`) + "```", true);
  emb.field(`${_emoji("cpu")}   Cluster Uptime`, `\`\`\`ml\n${uptime}\`\`\``, true);

  emb.field("\u200b", "𝙻𝚒𝚗𝚔𝚜 ", false);
  emb.field("Donate", "<a:polluxYAY:482436838523404288>  [Pollux on Patreon](https://patreon.com/Pollux)", true);
  emb.field("Invite", `:love_letter:  [Pollux.gg/invite](${paths.DASH}/invite)     \u200b`, true);
  emb.field("Commands", `:gear:  [Pollux.gg/commands](${paths.DASH}/commands)`, true);
  emb.field("Support Server", `:question:  [Pollux's Mansion](${paths.DASH}/support)    \u200b`, true);
  emb.field("Twitter", "<:twitter:510526878139023380>  [@maidPollux](https://twitter.com/maidPollux)    \u200b", true);
  emb.field("Subreddit", "<:reddit:510526878038360074>   [/r/Pollux](https://reddit.com/r/Pollux)    \u200b", true);

  emb.footer(`Falkenstein - DE\u2003❤ Powered by ${os.cpus().length}x ${os.cpus()[1].model}`, `${paths.CDN}/build/guessing/guessflags/germany.png`);

  msg.channel.send({ embed: emb });
};
module.exports = {
  init,
  pub: true,
  cmd: "status",
  perms: 3,
  cat: "infra",
  botPerms: ["embedLinks"],
  aliases: [],
};
