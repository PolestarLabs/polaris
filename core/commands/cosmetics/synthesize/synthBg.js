const Picto = require(appRoot + '/core/utilities/Picto');
const {SynthPrompt,Template} = require('./any.js');

module.exports =
    async function synthBG(args, userData, embed, P, ctx) {

        const {payCoin,canBuy,affordsIt,obtainable} = await Template('background',args,userData);

        let hasIt = userData.modules.bgInventory.includes(selectedItem.code);
        let positive = async function positiveForBGs(cancellation) {
            if (!hasIt && affordsIt) {
                userData.removeItem(payCoin, 1);
            };
            if (!affordsIt)
                return cancellation();
            await DB.users.set({ id: userData.id }, {
                $set: { "modules.bgID": selectedItem.code },
                $addToSet: { "modules.bgInventory": selectedItem.code }
            });
        };

        embed.author($t('interface.synthfrag.cosmeticSynth', P), paths.CDN + "/images/tiers/" + selectedItem.rarity + ".png");
        embed.description = `
   **${selectedItem.name}**  \`${selectedItem.code}\` **[\`INFO\`](${paths.CDN}/bgshop "Background Shop" )**
  `;

        SynthPrompt(hasIt, embed, obtainable, affordsIt, P);

        let imageLink = paths.CDN + "/backdrops/" + selectedItem.code + ".png";
        const [synthBoard, synthCircle, bgImage] = await Promise.all([
            Picto.getCanvas(paths.CDN + "/build/synthesis/frame.png"),
            Picto.getCanvas(paths.CDN + "/build/synthesis/" + (obtainable ? ("circle_" + selectedItem.rarity) : "nosynth") + ".png"),
            Picto.getCanvas(imageLink)
        ]);
        ctx.drawImage(synthCircle, 85, 15);
        ctx.rotate(-.261799);
        ctx.drawImage(bgImage, 170, 100, 180, 90);
        ctx.rotate(.261799);
        ctx.drawImage(synthBoard, 0, 0);
        embed.color = parseInt((await Picto.avgColor(imageLink)).replace('#',''),16);
        return {
            selectedItem,
            hasIt,
            canBuy,
            affordsIt,
            obtainable,
            positive
        };
    }