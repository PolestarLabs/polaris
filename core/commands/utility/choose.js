const init = async function (msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const target = Number.isNaN(Number(msg.args[0])) ? 1 : parseInt(msg.args.shift());
  let trueArgs = msg.args.length < 2 ? args.join(" ").split(/, ?/g) : args.join(" ").split(/, ?/g);

  const rolefind = (x) => msg.guild.roles.find((rl) => args.slice(x).join(" ").toLowerCase() === rl.name.toLowerCase() || rl.id == args[x]);
  if (
    msg.args[0] === "role" && msg.args[1] && (msg.roleMentions.length > 0 || rolefind(1))
    || msg.args[1] === "role" && msg.args[2] && (msg.roleMentions.length > 0 || rolefind(2))
  ) {
    trueArgs = msg.guild.members.filter((memb) => memb.roles.some((rl) => msg.roleMentions.includes(rl) || (rolefind(1) || rolefind(2))?.id === rl)).map((m) => m.user.tag);
  }

  if (trueArgs.length < 2) {
    return msg.channel.send($t("interface.shuffle.lessthan2", P));
  }
  trueArgs = shuffle(trueArgs);

  const embed = new Embed();
  embed.thumbnail(`${paths.CDN}/build/shuffle.gif`);
  embed.color("#ee52c2");
  embed.title = $t("interface.shuffle.picking", P);

  if (trueArgs.length < 6) {
    while (trueArgs.length > target) {
      trueArgs = shuffle(trueArgs);
      trueArgs.pop();
      trueArgs = shuffle(trueArgs);
    }
    P.list_item = trueArgs.join(", ");
    return msg.channel.send($t("interface.shuffle.ichoose", P));
  }

  sendArgs(trueArgs, 0).then((m1) => {
    sendArgs(m1.array, 1, m1.msg).then((m2) => {
      sendArgs(m2.array, 2, m2.msg).then(async (m3) => {
        await wait(2);
        const pick = shuffle(m3.array).slice(0, target).join(", ");
        P.list_item = pick;
        embed.fields = [];
        embed.field("\u200b", $t("interface.shuffle.ichoose", P), true);
        embed.field("\u200b   \u200b", "\u200b    \u200b", true);
        embed.title = $t("interface.shuffle.complete", P);
        m3.msg.edit({ embed });
      });
    });
  });

  function phabricate(arr) {
    arr = shuffle(arr);
    arr1 = arr.slice(0, Math.floor(arr.length / 2));
    arr2 = arr.slice(Math.floor(arr.length / 2), arr.length);
    embed.fields = [];
    embed.field("\u200b", arr1.slice(0, 20).join("\n"), true);
    embed.field("\u200b", arr2.slice(0, 20).join("\n"), true);
    return { embed };
  }

  async function sendArgs(a, i, m) {
    if (target === a.length) return { msg: await m.edit(phabricate(a)), array: shuffle(a) };
    if (target > a.length) {
      a_len = target - a.length;
      while (a_len--) {
        a.push(trueArgs.filter((x) => !a.includes(x))[a_len]);
      }
      return { msg: await m.edit(phabricate(a)), array: shuffle(a) };
    }
    await wait(0.85);
    if (!m && a.length <= 3) m = await msg.channel.send(phabricate(a));
    if (a.length === 2) return { msg: await m.edit(phabricate(a)), array: shuffle(a) };
    if (a.length === 3) {
      a = shuffle(a);
      a.pop();
      return { msg: m, array: a };
    }
    await wait(0.85);
    res = {};
    shuffle(a);
    a = i ? a.slice(0, Math.floor(a.length / 2) || 2) : a;
    if (m) res.msg = await m.edit(phabricate(a));
    else res.msg = await msg.channel.send(phabricate(a));
    res.array = a;

    return res;
  }
};
module.exports = {
  init,
  argsRequired: true,
  pub: true,
  cmd: "choose",
  perms: 3,
  cat: "utility",
  botPerms: ["embedLinks"],
  aliases: [],
};
