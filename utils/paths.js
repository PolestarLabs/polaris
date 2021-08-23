const ROOT = process.env.name === "PLR" ? "hijola.pollux.gg" : "pollux.gg";
const CDN = "https://cdn.pollux.gg";
const GENERATORS = `https://${ROOT}/generators`;
const API = `https://${ROOT}/api`;
const DASH = `https://pollux.gg`;

exports.run = () => {
  global.paths = {
    CDN,
    GENERATORS,
    API,
    DASH,
    WIKI: "https://wiki.pollux.gg",
    ASSETS: `${appRoot}/../../ASSETS/`,
    MEDALS: `${CDN}/medals/`,
    LISTS: `${appRoot}/resources/lists/`,
    BUILD: `${CDN}/build/`,
    PROFILE: `${CDN}/build/profile/`,
    LOCALES: `${appRoot}/locales/`,

    //LEGACY
    Build: `${CDN}/build/`,
    SKINS: `${CDN}/build//profile/skins/`,
    MISC: `${appRoot}/../v7/resources/misc/`,
    REACTIONS: `${appRoot}/../v7/resources/imgres/reactions/`,
    CARDS: `${appRoot}/../v7/resources/imgres/usercards/`,
    LEWD: `${appRoot}/../v7/resources/imgres/lewd/`,
    EVENT: `${appRoot}/../v7/resources/imgres/event/`,
    FONTS: `${appRoot}/../v7/resources/fonts/`,
    AVIS: `${appRoot}/avis/`,

    LOCALE: `${appRoot}/utils/lang/`,
    UTILS: `${appRoot}/utils/`,
  };
};
