module.exports = async (guild, member) => {
  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
    if (!svData?.modules.FWELL.enabled) return;

    const fwellTimer = svData.modules.FWELL.timer;
    let fwellText = svData.modules.FWELL.text
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

    let embed;
    if (welcomeText[1]){
      try {
        embed = fwellText[1] ? JSON.parse(fwellText[1]) : null;
      } catch (err) {
        embed = null;
      }
    }
    fwellText = fwellText[0] || fwellText;

    const fwellChannel = svData.modules.FWELL.channel;
    const fwellSkin = svData.modules.FWELL.type;
    const fwellImage = svData.modules.GREET.image;
    if (embed) {
      embed.image = embed.image?.url ? embed.image : fwellImage && embed ? { url: "attachment://out.png" } : undefined;
      embed.color = embed.color === 0 ? parseInt((userData.modules.favcolor || "#FF3355").replace("#", ""), 16) : embed.color;
    }

    const P = { lngs: [svData.modules.LANGUAGE, "dev"] };
    const txt = $t("logs.userLeave", P).replace(/\*/g, "");

    const url = `${paths.GENERATORS}/userio/out/${member.id}/${fwellSkin || "minimal"}.png?text=${encodeURIComponent(txt)}`;

    resolveFile(url).then(async (buffer) => {
      const fwellChannelObj = PLX.getChannel(fwellChannel);
      if (!fwellChannelObj.permissionsOf(PLX.user.id).has('viewChannel') || !fwellChannelObj.permissionsOf(PLX.user.id).has('sendMessages')) return;
      fwellChannelObj.send({ content: fwellText, embed }, (fwellImage ? file(buffer, "out.png") : null)).then((ms) => {
        if (fwellTimer) ms.deleteAfter(fwellTimer).catch(() => null);
      }).catch(console.error);
    }).catch(console.error);
  }).catch(err=>null);
};
