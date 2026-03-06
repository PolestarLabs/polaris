const Picto = require(`${appRoot}/core/utilities/Picto`);
const { SynthPrompt, Template } = require("./any.js");

module.exports = async function synthBG(args, userData, embed, P, ctx) {
  const cosmeticsData = await DB.userCosmetics.get(userData.id);
  const {
    payCoin, canBuy, affordsIt, obtainable,
  } = await Template("background", args, userData, cosmeticsData);

  const hasIt = cosmeticsData?.bgInventory?.includes(selectedItem.code);
  const positive = async (cancellation) => {
    if (!hasIt && affordsIt) {
      userData.removeItem(payCoin, 1);
    }
    if (!affordsIt) return cancellation();
    return Promise.all([
      DB.users.set({ id: userData.id }, { $set: { "profile.bgID": selectedItem.code } }),
      DB.userCosmetics.set(userData.id, { $addToSet: { bgInventory: selectedItem.code } }),
    ]).then(() => { });
  };

  embed.author($t("interface.synthfrag.cosmeticSynth", P), `${paths.CDN}/images/tiers/${selectedItem.rarity}.png`);
  embed.description = `
   **${selectedItem.name}**  \`${selectedItem.code}\` **[\`INFO\`](${paths.DASH}/bgshop "Background Shop" )**
  `;

  SynthPrompt(hasIt, embed, obtainable, affordsIt, P);

  const imageLink = `${paths.CDN}/backdrops/${selectedItem.code}.png`;
  const [synthBoard, synthCircle, bgImage] = await Promise.all([
    Picto.getCanvas(`${paths.CDN}/build/synthesis/frame.png`),
    Picto.getCanvas(`${paths.CDN}/build/synthesis/${obtainable ? (`circle_${selectedItem.rarity}`) : "nosynth"}.png`),
    Picto.getCanvas(imageLink),
  ]);
  ctx.drawImage(synthCircle, 85, 15);
  ctx.rotate(-0.261799);
  ctx.drawImage(bgImage, 170, 100, 180, 90);
  ctx.rotate(0.261799);
  ctx.drawImage(synthBoard, 0, 0);
  embed.setColor(await Picto.avgColor(imageLink));
  return {
    selectedItem,
    hasIt,
    canBuy,
    affordsIt,
    obtainable,
    positive,
  };
};
