module.exports = async (guild, member) => {
  Promise.all([DB.servers.get(guild.id), DB.users.get(member.id)]).timeout(2800).then(([svData, userData]) => {
    
    if (!svData?.modules.GREET.enabled) return;

    const welcomeTimer = svData.modules.GREET.timer;
    let welcomeText = svData.modules.GREET.text
      .replace(/%pfLink%/g, `${paths.DASH}/profile/${userData.personalhandle || userData.id}`)
      .replace(/%lvGlobal%/g, `${userData.modules.level}`)
      .replace(/%reputation%/g, `${userData.modules.commend || 0}`)
      .replace(/%membernumber%/g, `${guild.memberCount}`)
      .replace(/%user%/g, `<@${member.id}>`)
      .replace(/%userid%/g, `${member.id}`)
      .replace(/%usermention%/g, `<@${member.id}>`)
      .replace(/%mention%/g, `<@${member.id}>`)
      .replace(/%username%/g, member.user.username)
      .replace(/%tag%/g, member.user.tag)
      .replace(/%server%/g, guild.name)
      .replace(/%servername%/g, guild.name)
      .replace(/%serverIcon%/g, `${guild.iconURL}`)
      .replace(/%userAvatar%/g, `${member.user.avatarURL}`)
      .replace(/%userBackground%/g, `${paths.CDN}/backdrops/${userData.modules.bgID}.png`)
      .split("%embed%");

    welcomeText[0] = welcomeText[0].replace(/[^<]#([^ |^>|^"]+)/g,
      (m, p1) => `<#${(guild.channels.find((x) => x.name === p1) || { id: "0000000" }).id}>`);

    let embed;
    try {
      embed = welcomeText[1] ? JSON.parse(welcomeText[1]) : {};
    } catch (err) {
      embed = undefined;
    }

    welcomeText = welcomeText[0] || welcomeText;

    const welcomeChannel = svData.modules.GREET.channel;
    const welcomeSkin = svData.modules.GREET.type;
    const welcomeImage = svData.modules.GREET.image;
    if (embed) {
      embed.image = embed.image?.url ? embed.image : welcomeImage && embed ? { url: "attachment://in.png" } : undefined;
      embed.color = embed.color === 0 ? parseInt((userData.modules.favcolor || "#FF3355").replace("#", ""), 16) : embed.color;
      
    }

    const P = { lngs: [svData.modules.LANGUAGE || "en", "dev"] };
    const txt = $t("logs.userJoin", P).replace(/\*/g, "");

    const url = `${paths.GENERATORS}/userio/in/${member.id}/${welcomeSkin || "minimal"}.png?text=${encodeURIComponent(txt)}`;

    resolveFile(url).then(async (buffer) => {
      const welcomeChannelObj = PLX.getChannel(welcomeChannel);
      if (!welcomeChannelObj.permissionsOf(PLX.user.id).has('viewChannel') || !welcomeChannelObj.permissionsOf(PLX.user.id).has('sendMessages')) return;
      welcomeChannelObj.send({ content: welcomeText, embed }, (welcomeImage ? file(buffer, "in.png") : null)).then((ms) => {
        if (welcomeTimer) ms.deleteAfter(welcomeTimer).catch(() => null);
      }).catch(console.error);
    }).catch(console.error);
  }).catch(err => null);
};
