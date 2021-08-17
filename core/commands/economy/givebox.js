const { TimedUsage } = require("@polestar/timed-usage");
const ECO = require("../../archetypes/Economy");
const YesNo = require("../../structures/YesNo");

const day = 12 * 60 * 60e3;

/**
 * @param {import("eris").Message} msg
 * @param {string[]} args
 */
const init = async (msg, args) => {

  const P = { lngs: msg.lang, prefix: msg.prefix };

  const v = {
    last: $t("responses.transfer.lastdly", P),
    next: $t("responses.transfer.next", P),
  };

  const Daily = await new TimedUsage("transfer_box", { day }).loadUser(msg.author);

  if (["status", "stats"].includes(args[0].toLowerCase())) {
    const { dailyAvailable, userDaily: { last } } = Daily;

    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description(`${_emoji} ${_emoji("offline")} **${v.last}** <t:${~~(last/1000)}:R>\n`
      + `${_emoji("future")} ${dailyAvailable ? _emoji("online") : _emoji("dnd")} **${v.next}** <t:${~~((last)/1000) + 7200}:R>`);
    return msg.channel.createMessage({ embed });
  }

  Daily.precheck = async () => {
    const Target = msg.mentions[0] || await PLX.getTarget(args[1]);

    if (!Target) return msg.channel.send($t("responses.errors.target404", P)).then(() => false);
    if (Target.id === msg.author.id) return msg.channel.send($t("responses.give.not2self", P)).then(() => false);

    const [userData, targetData, Boxes] = await Promise.all([
      DB.users.getFull({ id: msg.author.id }),
      DB.users.getFull({ id: Target.id }),
      DB.items.find({ type: "box" }),
    ]);

    if (!userData.prime?.active){
      return msg.reply({
        embed:{
          //color: _UI.red,
          color: numColor(_UI.colors.red),
          description: "Direct-transfers are exclusive to Prime players. Try `plx!prime` for more info."
        }
      });
    }

    const userBoxList = Boxes.filter((box) => userData.hasItem(box.id));
    const boxColor = ["⬜", "🟩", "🟦", "🟪", "🟧", "🟥"];

    const boxtats = (list, R, cbx) => `\`\`\`md\n${list
        .map(
          (box, i) => `${box.tradeable ? ">-" : "> "}${boxColor[["C", "U", "R", "SR", "UR", "XR"].indexOf(box.rarity)]
            }${i === R || box === cbx ? "✔️" : `[${i}]`
            }${box.tradeable ? "[" : " "}${box.name}${box.tradeable ? "]" : " "}\n`,
        )
        .join("")
      }\`\`\``;

    const invEmpty = userBoxList.length === 0;

    /** @type {Required<import("eris").EmbedOptions>} */
    const embed = {};
    P.userB = `<@${Target.id}>`;
    embed.description = `
    ${invEmpty ? "" : $t("responses.transfer.transferboxto", P)}   
    ${invEmpty ? `*\`\`\`${rand$t("responses.inventory.emptyJokes", P)}\`\`\`*` : boxtats(userBoxList)}
    ${invEmpty ? "" : $t("responses.generic.selectIndex", P)}
    `;
    embed.thumbnail = { url: Target.avatarURL };
    embed.footer = { text: msg.author.tag, icon_url: msg.author.avatarURL };

    const prompt = await msg.channel.send({ embed });
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
            msg.author.id,
            Target.id,
            0,
            `[${CHOSENBOX.id}]`,
            "BOX",
            ">",
          );

          await ECO.pay(msg.author.id, 250, "lootbox_transfer_tax");
          await userData.removeItem(CHOSENBOX.id);
          await targetData.addItem(CHOSENBOX.id);

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

        return YesNo(prompt, msg, yes, cancel, timeout, { time: 10e3 });
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

    const preRarity = args[0]?.toUpperCase() || null;
    if (
      preRarity
      && userBoxList.find((box) => box.tradeable && box.rarity === preRarity)
    ) {
      return !!boxTransfer(
        userBoxList.find((box) => box.tradeable && box.rarity === preRarity),
      );
    }

    const responses = await msg.channel.awaitMessages(
      (msg2) => msg2.author.id === msg.author.id
        && Math.abs(Number(msg2.content)) < userBoxList.length,
      { maxMatches: 1, time: 30e3 },
    );

    if (!responses[0]) return timeout();

    responses[0].delete().catch(() => null);
    const R = Math.abs(Number(responses[0].content));
    return !!boxTransfer(userBoxList[R], R);
  };

  if (!Daily.available) {
    P.remaining = `<t:${~~(Daily.availableAt/1000)}:R>`;
    const dailyNope = $t("responses.give.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description = _emoji("nope") + dailyNope;
    return msg.channel.send({ embed });
  }

  msg.author.looting = true;
  try {
    const run = await Daily.process();
    // TODO[epic=flicky] Implement success message - could probably do with moving some of the stuff in precheck to here
    // REVIEW[epic=mitchell] is this needed? the yesno visual feedback seems enough
  } finally {
    msg.author.looting = false;
  }
};

module.exports = {
  init,
  pub: false,
  //TODO[epic=Unfinished Commands] Still needs a few tweaks;
  disabled: true,
  cmd: "givebox",
  perms: 3,
  argsRequired: true,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
  invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "transfer", opt: "economy" }); },
};
