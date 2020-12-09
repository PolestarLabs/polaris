// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');

const init = async function (msg) {
  
  const subcommand = msg.args[0];

  if (subcommand === "personaltxt") {
    msg.args = msg.args.slice(1);
    require("../personaltxt").init(msg);
  }
  if (subcommand === "tagline") {
    msg.args = msg.args.slice(1);
    require("./tagline").init(msg);
  }
  if (subcommand === "frame") {
    msg.args = msg.args.slice(1);
    require("./profile").init(msg);
  }
  if (subcommand === "bg") {
    msg.args = msg.args.slice(1);
    require("../cosmetics/background").init(msg);
  } else if (subcommand) {
    msg.channel.send({
      embed: {
        description:
            `<:Userlocation:338762651423473668> | Go to [the Dashboard or your Public Profile Page](${paths.DASH}/profile/me) to edit these.`,
      },
    });
  }

  delete require.cache[require.resolve("../../structures/ReactionMenu")];
  const ReactionMenu = require("../../structures/ReactionMenu");
  const userData = await DB.users.get(msg.author.id);
  const frameOn = (userData.switches || { profileFrame: "unavailable" }).profileFrame;
  embed = new Embed();
  embed.title(":tools: Profile Quick Edit");
  embed.description = "\u200b";
  embed.color(userData.modules.favcolor);
  embed.field("✏ " + "Change Personal Text",
    `\u200b \u2003  *"${userData.modules.tagline}"*`, true);
  embed.field(`${frameOn === true ? "🔴" : frameOn === false ? "🔵" : "🚫"} ${"Toggle Propic Frame"}`,
    `${frameOn === true ? `${_emoji("yep")} **ON**` : frameOn === false ? `${_emoji("nope")}**OFF**` : "🚫"}`, true);
  embed.field("📝 " + "Change Personal Text",
    ` \`\`\`${userData.modules.persotext}\`\`\``);
  embed.field("🖌 " + "Change Fav Color",
    ` \`${userData.modules.favcolor}\``, true);
  embed.field(`🖼 ${"Change BG"}`,
    `\`${userData.modules.bgID}\``, true);
  embed.field(`🌐  ${"Change Profile vanity link"}`,
    `\`${paths.DASH}/profile/\`\u200b**\`${userData.personalhandle || userData.id}\`**`, true);
  embed.field("\u200b", `🗃 ${"Change Medals/Sticker/Flair"}  `,
    true);
  embed.image(`${paths.CDN}/backdrops/${userData.modules.bgID}.png`);

  men = await msg.channel.send({ embed });

  ReactionMenu(men, msg, ["✏", (frameOn ? "🔴" : frameOn !== "unavailable" ? "🔵" : null), "📝", "🖌", "🖼", "🌐", "🗃"], { time: 20000 }).then((res) => {
    if (!res) return "CANCELLED!";

    if (res.index === 0) {
      PROCESS_SUBRESPONSE(msg, "**TEXT** `One line of text`").then((res) => {
        require("./tagline").init(res.forward,res.forward.args);
        msg.channel.send({ embed: { description: `Launching command \`${msg.prefix}tagline ${res ? res.string : ""}\`` } });
        men.deleteAfter(3000);
      });
    }

    if (res.index === 1) {
      const forward = msg;
      forward.content = "+cmd frame toggle";
      require("./profile").init(forward,res.forward.args).then((r) => men.addReaction(yep).catch()).catch((err) => console.log(err));
      msg.channel.send({ embed: { description: `Launching command \`${msg.prefix}profile frame toggle\`` } });
      men.deleteAfter(3000);
    }
    if (res.index === 2) {
      PROCESS_SUBRESPONSE(msg, "**TEXT** `150 Characters of Text`").then((res) => {
        require("./personaltext").init(res.forward,res.forward.args);
        msg.channel.send({ embed: { description: `Launching command \`${msg.prefix}personaltxt ${res ? res.string : ""}\`` } });
        men.deleteAfter(3000);
      });
    }
    if (res.index === 3) {
      PROCESS_SUBRESPONSE(msg, "**HEXCOLOR** `#000000`").then((res) => {
        require("../cosmetics/favcolor").init(res.forward,res.forward.args);
        msg.channel.send({ embed: { description: `Launching command \`${msg.prefix}favcolor ${res ? res.string : ""}\`` } });
        men.deleteAfter(3000);
      });
    }
    if (res.index === 4) {
      PROCESS_SUBRESPONSE(msg, "**SEARCH** `bg name or code`").then((res) => {
        require("../cosmetics/background").init(res.forward,res.forward.args);
        msg.channel.send({ embed: { description: `Launching command \`${msg.prefix}bg ${res ? res.string : ""}\`` } });
        men.deleteAfter(3000);
      });
    }
    if (res.index === 5) {
      return msg.channel.send({ embed: { description: "This feature is only available for *Iridium+* Donators." } });
      PROCESS_SUBRESPONSE(msg, "**HANDLE** `one word, no special characters allowed`").then((res) => {
        // require("../cosmetics/background").init(res.forward);
        // msg.channel.send({embed:{description:"Launching command `"+msg.prefix+"bg "+(res?res.string:"")+"`"}});
        // men.deleteAfter(3000)
      });
    }
    if (res.index === 6) {
      msg.channel.send({
        embed: {
          description:
                `<:Userlocation:338762651423473668> | Go to [the Dashboard or your Public Profile Page](${paths.DASH}/profile/me) to edit these.`,
        },
      });
      men.deleteAfter(3000);
    }
  });
};

async function PROCESS_SUBRESPONSE(msg, format) {
  const [ms2, response] = await Promise.all([
    msg.channel.send(`Type what you want to set here... (${format})`),
    msg.channel.awaitMessages((msgInb) => msgInb.author.id === msg.author.id, { maxMatches: 1, time: 10000 }),
  ]);
  if (response[0]) {
    ms2.delete();
    const string = response[0].content;
    const forward = msg;
    forward.args = string.split(" ");
    forward.content = `+cmd ${string}`;
    return { forward, string };
  }
  return { string: "" };
}

module.exports = {
  init,
  pub: true,
  cmd: "editprofile",
  argsRequired: true,
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: [],
};
