const { load } = require("nsfwjs-node");
const { createCanvas } = require("canvas");
const { getCanvas } = require("./Picto.js");

module.exports = async (URL, depth = 0) => {
  const [model, imgCanvas] = await Promise.all([load(), getCanvas(URL)]);

  let { height, width } = imgCanvas;

  const ratio = width / 300;
  width /= ratio;
  height /= ratio;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgCanvas, 0, 0, width, height);

  if (depth) {
    return model.classify(canvas, depth);
  }
  const predict = await model.classify(canvas, 2);
  const
    P = (predict.find((x) => x.className === "Porn") || {}).probability || 0;
  const S = (predict.find((x) => x.className === "Sexy") || {}).probability || 0;
  const H = (predict.find((x) => x.className === "Hentai") || {}).probability || 0;
  return (P > 0.5 || S > 0.5 || H > 0.7);
};
