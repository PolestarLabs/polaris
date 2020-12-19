const moment = require("moment");
const ECO = require("../../archetypes/Economy");
const YesNo = require("../../structures/YesNo");
const Timed = require("../../structures/TimedUsage");

const init = async (msg, args) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const v = {
    last: $t("responses.transfer.lastdly", P),
    next: $t("responses.transfer.next", P),
  };

  // y
  const reject = (message, Daily, r) => {
    P.remaining = moment.utc(r).fromNow(true);
    const dailyNope = $t("responses.give.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description = _emoji("nope") + dailyNope;
    return message.channel.send({ embed });
  };

  // y
  const info = async (message, Daily) => {
    const { last } = await Daily.userData(message.author);
    const dailyAvailable = await Daily.dailyAvailable(message.author);

    const embe2 = new Embed();
    embe2.setColor("#e35555");
    embe2.description = `
    ${_emoji("time")} ${_emoji("offline")} **${v.last}** ${moment
  .utc(last)
  .fromNow()}
    ${_emoji("future")} ${
  dailyAvailable ? _emoji("online") : _emoji("dnd")
} **${v.next}** ${moment
  .utc(last)
  .add(2, "hours")
  .fromNow()}
        `;
    return message.channel.send({ embed: embe2 });
  };

  // y
  const precheck = async (message) => {
    const Target = message.mentions[0] || await PLX.getTarget(message.args[1]);
    console.log({ Target });
    if (!Target) {
      await message.channel.send($t("responses.errors.target404", P));

      message.command.invalidUsageMessage(message, message.args);
      return false;
    }
    if (Target.id === message.author.id) return message.channel.send($t("responses.give.not2self", P)).then(() => false);
    const preRarity = args[0] ? args[0].toUpperCase() : null;

    const [userData, targetData, Boxes] = await Promise.all([
      DB.users.getFull({ id: message.author.id }),
      DB.users.getFull({ id: Target.id }),
      DB.items.find({ type: "box" }),
    ]);

    const userBoxList = Boxes.filter((box) => userData.hasItem(box.id));
    const boxColor = ["⬜", "🟩", "🟦", "🟪", "🟧", "🟥"];

    const boxtats = (list, R, cbx) => `\`\`\`md\n${
      list
        .map(
          (box, i) => `${box.tradeable ? ">-" : "> "}${
            boxColor[["C", "U", "R", "SR", "UR", "XR"].indexOf(box.rarity)]
          }${
            i === R || box === cbx ? "✔️" : `[${i}]`
          }${box.tradeable ? "[" : " "}${box.name}${box.tradeable ? "]" : " "}\n`,
        )
        .join("")
    }\`\`\``;

    const invEmpty = userBoxList.length == 0;

    const embed = {};
    P.userB = `<@${Target.id}>`;
    embed.description = `
    ${invEmpty ? "" : $t("responses.transfer.transferboxto", P)}   
    ${invEmpty ? `*\`\`\`${rand$t("responses.inventory.emptyJokes", P)}\`\`\`*` : boxtats(userBoxList)}
    ${invEmpty ? "" : $t("responses.generic.selectIndex", P)}
    `;
    embed.thumbnail = { url: Target.avatarURL };
    embed.footer = { text: message.author.tag, icon_url: message.author.avatarURL };

    const prompt = await message.channel.send({ embed });
    if (invEmpty) return false;

    const timeout = () => {
      embed.color = 0xffc936;
      embed.description = $t("responses.transfer.timeout", P);
      embed.thumbnail = {};
      embed.image = {
        url:
        `${paths.CDN}/build/TRANSFER_BOX_timeout_1.gif`,
      };
      embed.footer.text = "🕑";
      prompt.edit({ embed });
      return false;
    };
    const cancel = () => {
      embed.color = 0xff3636;
      embed.description = $t("responses.transfer.cancel", P);
      embed.thumbnail = {};
      embed.image = {
        url:
        `${paths.CDN}/build/TRANSFER_BOX_nope_4.gif`,
      };
      embed.footer.text = "❌";
      prompt.edit({ embed });
      return false;
    };

    async function boxTransfer(CHOSENBOX, r) {
      if (CHOSENBOX.tradeable) {
        P.boxname = CHOSENBOX.name;
        embed.description = `
           ${$t("responses.transfer.transferthisboxto", P)}    

            ${boxtats(userBoxList, r, CHOSENBOX)}

            ${$t("responses.trade.confirm10s", P).toUpperCase()}    
            `;
        await prompt.edit({ embed });
        const yes = async () => {
          const audit = await ECO.arbitraryAudit(
            message.author.id,
            Target.id,
            `[${CHOSENBOX.id}]`,
            "BOX",
            ">",
          );
          await ECO.pay(message.author.id, 250, "Lootbox Transfer Tax");

          userData.removeItem(CHOSENBOX.id);
          targetData.addItem(CHOSENBOX.id);

          embed.description = `
                ${_emoji("yep")}${$t("responses.transfer.success", P)}    

                ${$t("terms.TransactionFee")} **${250}${_emoji("RBN")}**
                ${$t("terms.TransactionID")} \`${audit.transactionId}\`
                `;
          embed.color = 0x2deb88;
          embed.image = {
            url:
            `${paths.CDN}/build/TRANSFER_BOX_1.gif`,
          };
          prompt.edit({ embed });
          return true;
        };

        return YesNo(prompt, message, yes, cancel, timeout, { time: 10e3 });
      }
      embed.color = 0xff3636;
      embed.description = `
            **${CHOSENBOX.name}** cannot be transferred!

            ${boxtats(userBoxList, r).replace("✔️", "❌")}

            `;
      embed.image = {
        url:
          `${paths.CDN}/build/TRANSFER_BOX_nope_4.gif`,
      };
      prompt.edit({ embed });
      return false;
    }

    if (
      preRarity
      && userBoxList.find((box) => box.tradeable && box.rarity === preRarity)
    ) {
      return boxTransfer(
        userBoxList.find((box) => box.tradeable && box.rarity === preRarity),
      );
    }

    const responses = await message.channel.awaitMessages(
      (msg2) => msg2.author.id === message.author.id
        && Math.abs(Number(msg2.content)) < userBoxList.length,
      { maxMatches: 1, time: 30e3 },
    );

    if (!responses[0]) return timeout();

    responses[0].delete().catch(() => null);
    const R = Math.abs(Number(responses[0].content));
    return boxTransfer(userBoxList[R], R);
  };

  const after = async () => {
    console.log("ok");
  };

  msg.author.looting = true;
  try {
    await Timed.init(msg, "transfer_box", { day: 2 * 60 * 60 * 1000 }, after, reject, info, precheck);
  } catch (error) {
    msg.author.looting = false;
    throw error;
  }
  msg.author.looting = false;
};

module.exports = {
  init,
  pub: false,
  cmd: "givebox",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "transfer", opt: "economy" }); },
};
