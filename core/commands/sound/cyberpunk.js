const init = async function (message) {

    message.channel.send("", {file: await resolveFile("https://cdn.pollux.gg/build/video/cyberpunk.mp4") ,name: "cyberpunk.mp4"});
   }
   
    module.exports = {
       pub: true,
       cmd: "cyberpunk",
       perms: 3,
       init: init,
       cat: 'sound',
       aliases: ['cp77']
   };
   