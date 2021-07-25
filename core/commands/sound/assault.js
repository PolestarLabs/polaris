const init = async function (message) {

 message.channel.send("", {file: await resolveFile("https://cdn.pollux.gg/build/video/assault.mp4") ,name: "assault.mp4"});
}

 module.exports = {
    pub: true,
    cmd: "assault",
    perms: 3,
    init: init,
    cat: 'sound'
};
