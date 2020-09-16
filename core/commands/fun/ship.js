const Picto = require("../../utilities/Picto");

const init = async function (msg, args) {
  const Canvas = Picto.new(796, 445);
  const ctx = Canvas.getContext("2d");

  let rand = Number(args[2]) || randomize(0, 100);

  const TargetA = await PLX.getTarget(msg.args[0], msg.guild);
  const TargetB = await PLX.getTarget(msg.args[1], msg.guild);

  if (!(TargetA && TargetB)) return $t("responses.ship.needTupipo", { lngs: msg.lang });
  if (TargetA.id === TargetB.id) return $t("responses.ship.need2diffpipo", { lngs: msg.lang });

  const [randPic, mainframe, aviA, aviB] = await Promise.all([
    Picto.getCanvas(`${paths.CDN}/build/ship/${Math.round(rand / 10)}.png`),
    Picto.getCanvas(`${paths.CDN}/build/ship/mainframe.png`),
    Picto.getCanvas(TargetA.avatarURL),
    Picto.getCanvas(TargetB.avatarURL),
  ]);



  ctx.fillStyle = "#ffdeaa";
  ctx.fillRect(87, 105, 630, 190);
  ctx.drawImage(aviA, 87 - 10, 95, 200, 200);
  ctx.drawImage(aviB, 522 - 10, 95, 200, 200);
  ctx.drawImage(randPic, 287, 17);

  ctx.drawImage(mainframe, 0, 0);

  function NameSplitter(name, end) {
    const slice = Math[end ? "floor" : "ceil"](name.split(/ +/)[0].length / 2);
    return name.split(/ +/)[0].slice(end ? slice : 0, end ? undefined : slice);
  }

  const SHIPNAME = NameSplitter(TargetA.username) + NameSplitter(TargetB.username, true);
  Picto.setAndDraw(
    ctx, Picto.tag(
      ctx,
      `❤  ${SHIPNAME}  ❤`, // "Lorem Ipsum dolor sit amet concectetur adipiscing elit ",
      "600 35px 'Panton'",
      "#FFF",
    ),
    400, 318, 540, "center",
  );

  ctx.translate(300, 80);
  ctx.rotate(-0.195);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(30,30,80,.2)";
  const mainW = Picto.popOutTxt(ctx, rand.toString().padStart(3, " "), 0, 0, "80px 'Corporate Logo Rounded'", "#fff", null, { style: "#f69", line: 20 }, -1).w;
  ctx.rotate(0.195 - 0.05);
  Picto.popOutTxt(ctx, "%", mainW - 30, 15, "44px 'Corporate Logo Rounded'", "#fff", null, { style: "#f69", line: 15 }, -1).w;
  ctx.rotate(0.05);
  ctx.translate(-300, -80);
  const response = rand == 69
    ? "Nice."
    : rand == 24 && ["pt", "pt-BR"].includes(msg.lang[0] || msg.lang)
      ? "Mas afinal qual dos dois vem de quatro?"
      : $t(`responses.ship.quotes.${Math.floor(rand / 10)}.${randomize(0, 1)}`, { lngs: msg.lang });
  msg.channel.send(response, file(Canvas.toBuffer(), "ship.png"));
};

module.exports = {
  init,
  pub: true,
  cmd: "ship",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["couple", "lovecalc"],
};
