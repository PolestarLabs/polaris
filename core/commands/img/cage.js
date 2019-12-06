const init = async function(msg) {
  let cage = randomize(5, 30);
  let cage2 = randomize(5, 30);

  msg.channel.send({
    embed: {
      color: 0x285691,
      image: {
        url:
          "http://www.placecage.com/" +
          (cage % 2 == 0 ? "c/" : "") +
          (cage + 300) +
          "/" +
          (cage2 + 300) +
          ".png",
        name: "cage.jpg"
      }
    }
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "cage",
  perms: 3,
  cat: "img",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: []
};
