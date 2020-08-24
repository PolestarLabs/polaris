const CDN = "https://beta.pollux.gg";
exports.run = () => {
  global.paths = {
    CDN,
    WIKI: "https://wiki.pollux.gg",
    ASSETS: `${appRoot}/../assets/`,
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
