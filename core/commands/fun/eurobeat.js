// const gear = require('../../utilities/Gearbox');
/**
  _   _ ______ ______ _____   _____  __          ______  _____  _  __
 | \ | |  ____|  ____|  __ \ / ____| \ \        / / __ \|  __ \| |/ /
 |  \| | |__  | |__  | |  | | (___    \ \  /\  / / |  | | |__) | ' / 
 | . ` |  __| |  __| | |  | |\___ \    \ \/  \/ /| |  | |  _  /|  <  
 | |\  | |____| |____| |__| |____) |    \  /\  / | |__| | | \ \| . \ 
 |_| \_|______|______|_____/|_____/      \/  \/   \____/|_|  \_\_|\_\
  
 The removedStuff needs replacement.
*/
const init = async (message) => {
  const stuff = [
    "https://youtu.be/3NRCDOAO8JY",
    "https://youtu.be/dK36vthr32M",
    "https://youtu.be/_8Q0qRu7CSE",
    "https://youtu.be/sFODclG8mBY",
    "https://youtu.be/ItjjWECjD_M",
    "https://youtu.be/BJ0xBCwkg3E",
    "https://youtu.be/atuFSv2bLa8",
    "https://youtu.be/dv13gl0a-FA",
    "https://youtu.be/SRbhLtjOiRc",
  ];

  const removedStuff = [
    "https://youtu.be/hF7QX0hfv8o",
    "https://youtu.be/Wz4dENwCN3E",
    "https://youtu.be/SivLaZ2GyrU",
    "https://youtu.be/WDvW1r85DcY",
    "https://youtu.be/_vTwDqsqvj4",
    "https://youtu.be/sk1Q-BFgnPM",
    "https://youtu.be/w_4RDmaO15E",
    "https://youtu.be/fS0fU0r_yvo",
  ]

  const stuff2 = [
    "You want some eurobeat? You get some eurobeat!",
    "Sure thing! How about this?",
    "This is one of my favorites.",
    "Alright master.",
    "Little do you know that I was once an eurobeat DJ at Tokyo clubs.",
    "Ha! Now we are talking.",
    "My best eurobeat for my best friend.",
    "Be sure to put this on max volume!",
    "How about this?",
    "Eurobeat eh? This is your lucky day, i have this.",
    "I have the finest eurobeat songs just for you.",
  ];
  const stuff3 = [
    "Let's pump up some *Adrenaline* on this.",
    "I could say I need your *Manifold Love* right now :3c",
    "Lemme show the best music from the *Future Land*.",
    "And please, *don't stop the music*, teehee.",
    "And dance to the *heartbeat*!",
    "How about a classic one?",
    "*Do you like.... my car**",
    "*I've just been in this place before*.",
    "Let's set this *night on fire*",
  ];

  const removedStuff3 = [
    "Are you a *speedy boy* or not?",
    "Listen to this every time you want to *remember me*.",
    "Did you know my favorite WW2 plane was the Supermarine *Spitfire*? ",
    "I feel like i'm gonna be *forever young*~",
    "Wao wao~",
    "Play this and turn the volume to *the top*!",
    "You can listen this every day, but it is *never enough*",
    "Welcome to the *House of Fire*, please don't get yourself burnt.",
  ]

  const rand = randomize(0, stuff.length - 1);
  const rand2 = randomize(0, stuff2.length - 1);
  const thing = stuff[rand]; // message.author.id === "169551262981816321" ? : 'a wet trout'

  const m = `<:ae86:486789339628699648> | **${stuff2[rand2]} ${stuff3[rand]}**
      ${thing}`;

  message.channel.send(m);
};

module.exports = {
  cool: 5000,
  pub: true,
  cmd: "eurobeat",
  botPerms: ["embedLinks"],
  perms: 3,
  init,
  cat: "fun",
};
