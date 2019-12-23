const ECO = require("../../archetypes/Economy");
const YesNo = require("../../structures/YesNo");
const Timed = require("../../structures/TimedUsage");
const moment = require("moment");


const init = async function(msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const v = {
    last: $t("responses.transfer.lastdly", P),
    next: $t("responses.transfer.next", P)
  };
  let reject = function(msg, Daily, r) {
    P.remaining = moment.utc(r).fromNow(true);
    let dailyNope = $t("responses.give.cooldown", P);
    let embed = new Embed();
    embed.setColor("#e35555");
    embed.description = _emoji("nope") + dailyNope  ;
    return msg.channel.send({ embed: embed });
  };
  let info = async function(msg, Daily,r) {
    let { last } = await Daily.userData(msg.author);
    let dailyAvailable = await Daily.dailyAvailable(msg.author);

    let embe2 = new Embed();
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
    return msg.channel.send({ embed: embe2 });
  };
  let precheck = async function(msg, Dly) {
      
    const Target = msg.mentions[0] || PLX.findUser(args[1] || "");
    const preRarity = args[0]?args[0].toUpperCase():null;
    

    const [userData, targetData, Boxes] = await Promise.all([
      DB.users.getFull({ id: msg.author.id }),
      DB.users.getFull({ id: Target.id }),
      DB.items.find({ type: "box" })
    ]);

    const userBoxList = Boxes.filter(box => userData.hasItem(box.id));

    const boxtats = (list, R, cbx) =>
      "```md\n" +
      list
        .map(
          (box, i) =>
            `${box.tradeable ? ">-" : "> "}${
              i == R || box == cbx ? "✔️" : `[${i}]`
            }[${box.name}]\n`
        )
        .join("") +
      "```";

    const embed = {};
    P.userB=`<@${Target.id}>`
    embed.description = `
    ${$t("responses.transfer.transferboxto", P)}   
    ${boxtats(userBoxList)}
    `;
    embed.thumbnail = { url: Target.avatarURL };
    embed.footer = { text: msg.author.tag, icon_url: msg.author.avatarURL };

    let prompt = await msg.channel.send({ embed });

    const timeout = () => {
      embed.color = 0xffc936;
      embed.description = $t("responses.transfer.timeout", P);
      embed.thumbnail = {};
      embed.image = {
        url:
          "https://beta.pollux.gg/build/TRANSFER_BOX_timeout_1.gif"
      };
      embed.footer.text = "🕑";
      prompt.edit({ embed });
      return false;
    };
    const cancel = () => {
      embed.color = 0xff3636;
      embed.description = $t("responses.transfer.cancel", P)
      embed.thumbnail = {};
      embed.image = {
        url:
          "https://beta.pollux.gg/build/TRANSFER_BOX_nope_4.gif"
      };
      embed.footer.text = "❌";
      prompt.edit({ embed });
      return false;
    };

    if (
      preRarity &&
      userBoxList.find(box => box.tradeable && box.rarity == preRarity)
    ) {
      return boxTransfer(
        userBoxList.find(box => box.tradeable && box.rarity == preRarity)
      );
    }

    let responses = await msg.channel.awaitMessages(
      msg2 =>
        msg2.author.id === msg.author.id &&
        Math.abs(Number(msg2.content)) < userBoxList.length,
      { maxMatches: 1, time: 30e3 }
    );

    if (!responses[0]) return timeout();

    responses[0].delete().catch(e => null);
    const R = Math.abs(Number(responses[0].content));
    return boxTransfer(userBoxList[R], R);

    async function boxTransfer(CHOSENBOX, R) {
      if (CHOSENBOX.tradeable) {
        P.boxname = CHOSENBOX.name
        embed.description = `
           ${$t("responses.transfer.transferthisboxto", P)}    

            ${boxtats(userBoxList, R, CHOSENBOX)}

            ${$t("responses.trade.confirm10s", P).toUpperCase()}    
            `;
        await prompt.edit({ embed });
        const yes = async () => {
          let audit = await ECO.arbitraryAudit(
            msg.author.id,
            Target.id,
            `[${CHOSENBOX.id}]`,
            "BOX",
            ">"
          );
          await ECO.pay(msg.author.id, 250, "Lootbox Transfer Tax");

          userData.removeItem(CHOSENBOX.id);
          targetData.addItem(CHOSENBOX.id);

          embed.description = `
                ${_emoji("yep")}${$t("responses.transfer.success", P)}    

                ${$t('terms.TransactionFee')} **${250}${_emoji("RBN")}**
                ${$t('terms.TransactionID')} \`${audit.transactionId}\`
                `;
          embed.color = 0x2deb88;
          embed.image = {
            url:
              "https://beta.pollux.gg/build/TRANSFER_BOX_1.gif"
          };
          prompt.edit({ embed });
          return true;
        };

        return (await YesNo(prompt, msg, yes, cancel, timeout,{time:10e3}));
         
        
      } else {
        embed.color = 0xff3636;
        embed.description = `
            **${CHOSENBOX.name}** cannot be transferred!

            ${boxtats(userBoxList, R).replace("✔️", "❌")}

            `;
        embed.image = {
          url:
            "https://beta.pollux.gg/build/TRANSFER_BOX_nope_4.gif"
        };
        prompt.edit({ embed });
        return false;
      }
    }

  };
  let after = async function(msg, Dly) {
    console.log("ok")
  }
  
  msg.author.looting = true;
  await Timed.init(msg,"transfer_box",{ day: 2 * 60 * 60 * 1000 },after,reject,info,precheck);
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
  invalidUsageMessage:  (msg)=> {PLX.autoHelper( 'force', {msg, cmd: "transfer", opt: "economy" } )}
};
