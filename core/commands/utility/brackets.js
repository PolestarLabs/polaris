const init = async (msg, args) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  N = Math.abs(parseInt(msg.args[0]) || parseInt(msg.args[1])) || 0;
  ENTS = msg.args[2] ? msg.args : null;

  const rolefind = (x) => msg.guild.roles.find((rl) => args.slice(x).join(" ").toLowerCase() === rl.name.toLowerCase());
  if (
    msg.args[0] === "role" && msg.args[1] && (msg.roleMentions.length > 0 || rolefind(1))
        || msg.args[1] === "role" && msg.args[2] && (msg.roleMentions.length > 0 || rolefind(2))
  ) {
    ENTS = msg.guild.members.filter((memb) => memb.roles.some((rl) => msg.roleMentions.includes(rl) || (rolefind(1) || rolefind(2) || {}).id === rl)).map((m) => m.user.tag);
  }
  iterations = 0;
  display_RR = false;
  display_FF = false;
  while (["-bk", "-rr", "-full", "role"].includes(msg.args[0]) || iterations > 5) {
    if (msg.args[iterations] === "-rr") display_RR = true;
    if (msg.args[iterations] === "-full") display_FF = true;
    msg.args.shift();
    iterations++;
  }
  if (msg.args.length >= 3) {
    ENTS = msg.args.join(" ").split(",");
  }

  N = N || ENTS?.length || 0;

  if (N > 16 && display_RR) {
    return msg.channel.send($t("interface.brackets.maxRR", P));
  }
  if (N > 32) {
    return msg.channel.send($t("interface.brackets.maxBK", P));
  }

  ENTS = ENTS ? shuffle(ENTS) : ENTS;
  ROUNDROBIN = RR(N, ENTS, P);
  BRACKETS = BK(N, ENTS, P);
  BRACKET_MATCHES = BRACKETS.matches;

  embed = new Embed();
  embed.color("#ee2052");
  embed.title = $t("interface.brackets.RRt");
  embed2 = new Embed();
  embed2.color("#20c2ee");
  embed2.title = $t("interface.brackets.BKt");

  for (j = 0; j < ROUNDROBIN.length; j++) {
    round = [];
    for (i = 0; i < ROUNDROBIN[j].length; i++) {
      round.push(`\u200b \u2003 \`${$t("interface.brackets.match", P)} ${i + 1}\`\u2003 🔸 **${ROUNDROBIN[j][i][0]} \u2000** × **\u2000 ${ROUNDROBIN[j][i][1]}** `);
    }
    embed.field(`${$t("interface.brackets.round", P)} ${j + 1}`, round.join("\n"), true);
  }

  wingmap = (v, i, t, s, e) => `\u200b  \`${t} ${s + i + 1}\`\n\u2003 ${e || ""} **${v[0]} \u2000**×**\u2000 ${v[1]}**`;
  if (BRACKETS.byes.length > 0) {
    embed2.field(`${$t("interface.brackets.preround", P)} (PRE)`, BRACKETS.byes.slice(0, BRACKETS.byes.length / 2).map((v, i) => wingmap(v, i, "PRE", 0, "▫")).join("\n"), true);
    embed2.field("\u200b", BRACKETS.byes.slice(BRACKETS.byes.length / 2).map((v, i) => wingmap(v, i, "PRE", Math.floor(BRACKETS.byes.length / 2), "▫")).join("\n"), true);
    embed2.field("\u200b", "\u200b", false);
  }
  P.AB = "A";
  embed2.field($t("interface.brackets.bracketX", P), BRACKET_MATCHES.slice(0, BRACKET_MATCHES.length / 2).map((v, i) => wingmap(v, i, $t("interface.brackets.match"), 0, ":red_circle:")).join("\n"), true);
  P.AB = "B";
  embed2.field($t("interface.brackets.bracketX", P), BRACKET_MATCHES.slice(BRACKET_MATCHES.length / 2).map((v, i) => wingmap(v, i, $t("interface.brackets.match"), BRACKET_MATCHES.length / 2, ":blue_circle:")).join("\n"), true);

  if (display_RR) {
    embed2 = null;
    msg.channel.send({ embed });
  } else {
    embed = null;
    msg.channel.send({ embed: embed2 });
  }
};

module.exports = {
  init,
  argsRequired: true,
  pub: true,
  cmd: "brackets",
  perms: 3,
  cat: "util",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["bkt", "bracket", "tournament"],
  argsReqed: true,
};

function RR(n, entrants, P) {
  const res = [];
  if (!entrants) {
    entrants = [];
    for (let k = 1; k <= n; k++) { P.X = k; entrants.push($t("interface.brackets.team", P)); }
  }

  for (j = 0; j < n - 1; j++) {
    res[j] = [];
    for (i = 0; i < n / 2; i++) {
      if (entrants[i] !== -1 && entrants[n - 1 - i] !== -1) res[j].push([entrants[i], entrants[n - 1 - i]]);
    }
    entrants.splice(1, 0, entrants.pop());
  }
  return res;
}

function BK(n, entrants, P) {
  const res = [];
  if (!entrants) {
    entrants = [];

    for (let k = 1; k <= n; k++) { P.X = k; entrants.push($t("interface.brackets.team", P)); }
  }

  isPowerOf = (n, p) => {
    while (n != 0 && n % p === 0) { n /= p; }
    return n === 1;
  };

  let roundzero;
  if (!isPowerOf(n, 2)) {
    const next = [];
    let n2 = entrants.length;
    while (!isPowerOf(n2++, 2)) {
      next.push(entrants[0]);
      entrants.shift();
    }
    roundzero = entrants;
    entrants = next;
  }

  for (i = 0; roundzero && i < roundzero.length / 2; i++) {
    entrants.push(`\u200b**▫**\`PRE #${i + 1}\`** ${$t("interface.brackets.winner", P)} **\u200b`);
    n--;
  }

  entrants = shuffle(entrants);

  for (i = 0; i < (n / 2); i++) {
    res.push([entrants[0], entrants[1]]);
    entrants = entrants.slice(2);
  }
  const byes = [];

  n2 = (roundzero || []).length;
  for (i = 0; i < (n2 / 2); i++) {
    byes.push([roundzero[0], roundzero[1]]);
    roundzero = roundzero.slice(2);
  }

  return { byes, matches: res };
}
