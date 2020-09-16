const CDN = "https://cdn.pollux.gg";
const GENERATORS = "https://beta.pollux.gg/generators";
const API = "https://beta.pollux.gg/api";
const DASH = "https://beta.pollux.gg";

exports.run = () => {
  global.paths = {
    CDN,GENERATORS,API,DASH,
    WIKI: "https://wiki.pollux.gg",
    MISC: `${appRoot}/../v7/resources/misc/`,
    REACTIONS: `${appRoot}/../v7/resources/imgres/reactions/`,

    CARDS: `${appRoot}/../v7/resources/imgres/usercards/`,
    MEDALS: `${CDN}/medals/`,
    LISTS: `${appRoot}/resources/lists/`,
    Build: `${CDN}/build/`,
    BUILD: `${CDN}/build/`,
    LEWD: `${appRoot}/../v7/resources/imgres/lewd/`,
    EVENT: `${appRoot}/../v7/resources/imgres/event/`,
    PROFILE: `${CDN}/build/profile/`,
    SKINS: `${CDN}/build//profile/skins/`,
    FONTS: `${appRoot}/../v7/resources/fonts/`,
    AVIS: `${appRoot}/avis/`,
    LOCALE: `${appRoot}/utils/lang/`,
    UTILS: `${appRoot}/utils/`,
  };
};
