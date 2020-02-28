const chrono = require('chrono-node')
const moment = require('moment')
const parser = new chrono.Chrono()
parser.refiners.push({refine (text, results, opt) {
    if (opt.startOfDay) {
      results.forEach(result => {
        if (!result.start.isCertain('hour')) {
          result.start.imply('hour', opt.startOfDay)
          result.tags['StartOfWorkDayRefiner'] = true
        }
      })
    }    
    return results
}})


const init = async function (msg,args){

    let input = args.join(' ')
    let destination;

    if(input.includes(' -c ') || input.endsWith('-c')){
        input = input.split(' -c ')[0];
        if(input.endsWith('-c')) input = input.substr(0,input.length-3);
        destination = msg.channelMentions[msg.channelMentions.length-1] || msg.channel.id;
    }
    

    let preInput = null;

    console.log(input)
    if(input.includes('|')) {
        preInput = input.split('|')[0];
        input = input.split('|').slice(1).join(' ').trim();  
    }


    const regex = /^@?([^\s]+)(?: to )?(.*)$/
    const options = {forwardDate: true,startOfDay: 9 }
    const from = Date.now() 
 
    
    
    let what = preInput || input;

    const when = parser.parse(input, from, options);


    
    let timestamp = when[0].start.date().getTime() + 3600000 *3;


    if (when.length < 1) return "Sorry, this is confusing. I didn't understand *when* you want me to remind that.";
    if (timestamp < from ) return "Excuse me time traveler, I cannot go to the past to remind you of what you already forgot.";
 
    when.forEach(w => {
        what = what.replace(w.text, '')
    })
    what = what.trim()

    await DB.feed.new({url: msg.author.id, type:'reminder',name:preInput||what, expires: timestamp, repeat: 0, channel: destination || 'dm' });

    msg.channel.send(`Ok, i'll remind you of \`${preInput||what}\` **${moment.utc(timestamp).calendar() } (UTC)** ${destination?`at <#${destination}>`:'in your DMs'}!`)

    



}
module.exports={
    init
    ,pub:true
    ,cmd:'reminder'
    ,perms:3
    ,cat:'utility'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['remind','rmd']
}


