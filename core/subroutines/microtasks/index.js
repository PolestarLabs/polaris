
function refreshAndResolve(mod){
    delete require.cache[require.resolve(mod)];
    return require(mod);
}

module.exports = {

    updateServerCache: refreshAndResolve('./serverCache').update,
    reloadServerCache: refreshAndResolve('./serverCache').reload, 


}