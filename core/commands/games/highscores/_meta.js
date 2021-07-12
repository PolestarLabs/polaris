async function standingsPrinter(item, i, standFun) {
  if (i === 5) return "";
  let subject;
  if (item.type.includes("solo")) subject = await PLX.resolveUser(item.id);
  else
    subject = await PLX.getRESTGuild(item.id).catch((err) => ({
      name: "Unknown Server",
    }));

  return standFun(item, subject);
}

const defaultStandFun = (item, subject) => {
  return `\
${_emoji(`rank${i + 1}`)} \`\
[${item.type.includes("solo") ? " SOLO " : "SERVER"}]\` \
**${(subject.name || `${subject.username}#${subject.discriminator}`).slice(0,25)}** \ 
${_emoji("__")}${_emoji("__")}  \
Grade ${_emoji(`grade${item.data.grade}`)}\
${"" /*_emoji("__")*/}\
\\Attempts: **\`${(item.data.rounds ? item.data.rounds : item.data.flags)
    .toString()
    .padStart(3, " ")}\`** \
${_emoji("__")}\
**\`${`${item.points}`.padStart(6, " ")}\`**pts.  \
\\⏱ ${item.data.time || "Time Attack"}\
${item.data.mode == "endless" ? "s :: Endless Mode" : ""}`;
};

module.exports = {
  standingsPrinter,
  defaultStandFun,
};
