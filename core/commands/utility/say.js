const init = async function (msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  try {
    msg.delete().catch((err) => null);
  } catch (e) {
    // prevent breaking with saytochannel
  }

  const ServerDATA = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, null, ServerDATA);

  let content = args.join(" ");
  // Replace links
  if (!modPass) content = content.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gmi, `\`[${$t(["interface.generic.redactedLink", "REDACTED LINK"], P)}]\``);

  if (args[0] === "embed") {
    if (["?", "help", $t("helpkey", P)].includes(args[1]) || !args[1]) {
      return msg.channel.send({
        embed: {
          description: $t("responses.errors.unparsable", { ...P, link: `[Pollux Embed Architect](${paths.DASH}/embedarchitect)` }),
        },
      });
    }
    let embedstr = msg.content.substr(msg.content.indexOf("embed") + 5).trim();

    // Check for hex colour representation
    const match = embedstr.match(/"color":\s*((0[xX]|#)([0-9a-f]{3}(?=[\s}])|[0-9a-f]{6}))/i);
    if (match) { // Parse the match to decimal
      if (match[2].length === 3) match[2] = `0x${match[2][0]}${match[2][0]}${match[2][1]}${match[2][1]}${match[2][2]}${match[2][2]}`;
      const decimal = Math.max(parseInt(match[2]) - 1, 0); // 0xFFF = black
      embedstr = embedstr.replace(match[0], match[0].replace(match[1], decimal.toString()));
    }

    let userEmbed;
    try {
      userEmbed = JSON.parse(embedstr);
      if (userEmbed.embed) userEmbed = { embed: userEmbed.embed };
    } catch (e) {
      return msg.channel.send({ embed: { description: $t("responses.errors.unparsable", { ...P, link: `[Pollux Embed Architect](${paths.DASH}/embedarchitect)` }) } });
    }

    if (!modPass) {
      delete userEmbed.embed.image;
      delete userEmbed.embed.thumbnail;
      delete userEmbed.embed.author;
    }

    if (userEmbed.content?.length > 2000) return msg.channel.send("I can't send messages longer than 2000 characters!"); // TRANSLATE

    msg.channel.send(userEmbed);
  } else {
    if (!modPass) content = content.replace(/<@[!&]?\d*>/gmi, `\`[${$t(["interface.generic.redactedMention", "REDACTED MENTION"], P)}]\``);
    if (content.length > 2000) return msg.channel.send("I can't send messages longer than 2000 characters!"); // TRANSLATE

    msg.channel.send(content);
  }

  await DB.control.collection.insert({
    type: "say-tracking",
    user: msg.author.id,
    channel: msg.channel.id,
    server: msg.guild.id,
    id: msg.id,
    timestamp: msg.timestamp,
    date: new Date(msg.timestamp),
    content: msg.content,
    attachments: msg.attachments,
    embed: msg.embeds,
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "say",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: [],
};
