const Picto = require(`${appRoot}/core/utilities/Picto`);
const { SynthPrompt, Template } = require("./any.js");

module.exports = async function synthMEDAL(args, userData, embed, P, ctx) {
  const {
    payCoin, canBuy, affordsIt, obtainable,
  } = await Template("medal", args, userData);

  const hasIt = userData.modules.medalInventory.includes(selectedItem.icon);
  const positive = async (cancellation) => {
    if (!hasIt && affordsIt) {
      userData.removeItem(payCoin, 1);
    }
    if (!affordsIt) return cancellation();
    return DB.users.set({ id: userData.id }, {
      $addToSet: { "modules.medalInventory": selectedItem.icon },
    }).then(() => {});
  };

  embed.author($t("interface.synthfrag.cosmeticSynth", P), `${paths.CDN}/images/tiers/${selectedItem.rarity}.png`);
  embed.description = `
**${selectedItem.name}**  \`${selectedItem.icon}\` **[\`INFO\`](${paths.DASH}/medalshop "Medal Shop" )**
`;

  SynthPrompt(hasIt, embed, obtainable, affordsIt, P);

  const imageLink = `${paths.CDN}/medals/${selectedItem.icon}.png`;
  const [synthBoard, synthCircle, mdlImage] = await Promise.all([
    Picto.getCanvas(`${paths.CDN}/build/synthesis/frame_medal.png`),
    Picto.getCanvas(`${paths.CDN}/build/synthesis/${obtainable ? (`circle_${selectedItem.rarity}`) : "nosynth"}.png`),
    Picto.getCanvas(imageLink),
  ]);
  embed.setColor(await Picto.avgColor(imageLink));

  ctx.drawImage(synthCircle, 130, 15);
  ctx.rotate(-0.261799);
  ctx.drawImage(mdlImage, 250, 110, 100, 100);
  ctx.rotate(0.261799);
  ctx.drawImage(synthBoard, 0, 0);

  return {
    selectedItem,
    hasIt,
    canBuy,
    affordsIt,
    obtainable,
    positive,
  };
};
