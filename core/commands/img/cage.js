const init = async function (msg) {
  const cage = randomize(5, 30);
  const cage2 = randomize(5, 30);

  msg.channel.send({
    embed: {
      color: numColor(_UI.colors.blue),
      image: {
        url:
          `http://www.placecage.com/${cage % 2 === 0 ? "c/" : ""
          }${cage + 300
          }/${cage2 + 300
          }.png`,
        name: "cage.jpg",
      },
    },
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "cage",
  perms: 3,
  cat: "img",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
