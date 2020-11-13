//guessingGame('name' , 'type(text/image)' ,'thumb', options)
const axios = require('axios');
const { resolveFile, wait } = require('../../../event-instance/core/utilities/Gearbox/global');


class GuessingGame{


    /**
     * 
     * @param {String} name Minigame identifier, will be the folder name in assets/build/guessing/
     * @param {String} type "image" or "text"
     * @param {Object} options 
     * @param {String} [options.imgPosition=thumbnail] "thumbnail" or "image"
     * @param {Number} [options.color=0x5080AA] 
     * @param {String} options.title Window Title
     * @param {String} options.prompt Prompt message
     * @param {String} options.guessed Response when guessed (use {{correct}} and {{user}} as placeholders)
     * @param {String} options.timeout Response when timeout ( 
     * @param {String} options.gamemode "normal" (default) | "endless" - See how far can you go | "versus" - challenge other players
     * @param {Boolean} options.solo   If the game is solo or in group
     * @param {Number} [options.time=15e3] time in ms. 15s defailt
     */

    constructor(name,type="image",{title,prompt,guessed,timeout,gamemode,imgPosition,time,color,solo}){ 

        color = color || 0x5080AA;
        imgPosition = imgPosition || 'thumbnail';
        this.gamemode =  gamemode || 'normal';
        this.time = this.gamemode == 'endless' ?  0 
                        : this.gamemode == 'time' ? 60e3
                        : time || 15e3

        this.solo = solo ?? false;
        this.name = name;
        this.guessed = guessed;
        this.timeout = timeout;
        this.type = type;

        if(!['image','thumbnail'].includes(imgPosition)) throw new Error ("[imgPosition] must be either 'image' or 'thumbnail'.");
        
        this.embed = {
            title, color,
            description: prompt,
            fields: [],
            [imgPosition]: type === 'image' ? {url:`attachment://${name}.png`} : {},
            footer: {text: `⏱ ${this.time/1000}s`}
        }

    }

    async generate(){
        if(this.type === 'image'){            
            let response = (await axios.get( `${paths.DASH}/random/guess/${this.name}?json=1`)).data;
            console.log(response)
            this.imageFile = await resolveFile(response.url);
            if(this.gamemode === 'endless') this.embed.footer.text = `Endless Mode | Round ${this.round || 1}`;
            if(this.gamemode === 'time') this.embed.footer.text = `Time Attack Mode | Remaining: ${  ~~((this.time - ~~(Date.now() - (this.start||Date.now() ))) / 1000 )}s`;
            return response;
        }
    }

    async play(msg){

        let {names} = await this.generate();
        await msg.channel.send({embed: this.embed},{file: this.imageFile, name: `${this.name}.png` });
        this.start = Date.now();
        console.log(this.gamemode)
        let Collector = msg.channel.createMessageCollector(m=>m.content.length, {time: this.time});

        const isValid = (m,n) => n.includes(m.content.normalize().toLowerCase());
        const _capitalize = (s)=> s.replace( /\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase() );

        if (this.gamemode === 'normal'){
            Collector.on('message', async(m)=> {
                if (isValid(m,names)){
                    let res = capitalize(names[0]);
                    msg.channel.send( $t(this.guessed,{user: `<@${m.author.id}>`, answer: `**${res}**` }) );
                    Collector.stop();
                }
            })
            Collector.on('end', async(col,reason)=>  reason === 'time' ? msg.channel.send(this.timeout) : console.log({reason}));
        }
        
        if (this.gamemode === 'endless'){

            this.round = 1;
            let active = true; 
            let activity = setInterval(() => {
                if (!active) return Collector.stop('time');
		        active = false;
            }, this.time); 
            let points = 0;

            Collector.on('message', async(m)=> {
                if (isValid(m,names)){
                    let res = _capitalize(names[0]);
                    active = true;
                    msg.channel.send( $t(this.guessed,{user: `<@${m.author.id}>`, answer: `**${res}**` }) );
                    let totalTime = ~~(Date.now() - this.start) ;
                    
                    await wait(1);
                    this.round++
                    msg.channel.send("Next Round...");
                    await wait(1);

                    names = (await this.generate()).names;

                    points +=  Math.pow(this.round * res.length ,2)  / (totalTime/1000 );

                    this.embed.fields[0] = {
                        name: "Score",
                        value: `${~~points} points`,
                        inline: !0
                    }

                    
                    await msg.channel.send({embed: this.embed},{file: this.imageFile, name: `${this.name}.png` });
                }else if( this.solo && m.content?.toLowerCase() === 'quit' ){
                    Collector.end('retire')
                }
            })
            Collector.on('end', async(col,reason)=> {
                //if (reason === 'time') 

                let totalTime = ~~(Date.now() - this.start) / 1000;
                let gradeCalc = (totalTime-14) / 15 / this.round
                let grade;
                switch (true){
                    case gradeCalc < .02:
                        grade = "SSS"
                        break;
                    case gradeCalc < .05:
                        grade = "SS"
                        break;
                    case gradeCalc < .1:
                        grade = "S"
                        break;
                    case gradeCalc < .25:
                        grade = "A"
                        break;
                    case gradeCalc < .5:
                        grade = "B"
                        break;
                    case gradeCalc < .8:
                        grade = "C"
                        break;
                    case gradeCalc < .1:
                        grade = "D"
                        break;
                    default:
                        grade = "F"

                }
                
                
                msg.channel.send({content: this.timeout, embed:{
                    title: "Endless Mode Results",
                    description:`
                    Rounds: ${this.round}
                    Time: ${ ~~totalTime } seconds
                    Score: ${ ~~points } points
                    Grade: **${grade}**
                    
                    `
                }});
                
                clearInterval(activity)
            })
        }


        if (this.gamemode === 'time'){
            this.round = 1;
            let points = 0;

            Collector.on('message', async(m)=> {
                if (isValid(m,names)){
                    let res = _capitalize(names[0]);
                    msg.channel.send( $t(this.guessed,{user: `<@${m.author.id}>`, answer: `**${res}**` }) );
                    let totalTime = ~~(Date.now() - this.start) ;                    
                    this.round++

                    names = (await this.generate()).names;
                    points +=  Math.pow(this.round * res.length ,2)  / (totalTime/1000 );

                    this.embed.fields[0] = {
                        name: "Score",
                        value: `${~~points} points`,
                        inline: !0
                    }
                    
                    await msg.channel.send({embed: this.embed},{file: this.imageFile, name: `${this.name}.png` });
                
                }else if(  m.content?.toLowerCase() === 'skip' ){
                    names = (await this.generate()).names;
                    await msg.channel.send({embed: this.embed},{file: this.imageFile, name: `${this.name}.png` });
                }
            })
            Collector.on('end', async(col,reason)=> {
                //if (reason === 'time') 

                let totalTime = ~~(Date.now() - this.start) / 1000;
                let gradeCalc = (totalTime) / 15 / this.round
                let grade;
                switch (true){
                    case gradeCalc < .02:
                        grade = "SSS"
                        break;
                    case gradeCalc < .05:
                        grade = "SS"
                        break;
                    case gradeCalc < .1:
                        grade = "S"
                        break;
                    case gradeCalc < .25:
                        grade = "A"
                        break;
                    case gradeCalc < .5:
                        grade = "B"
                        break;
                    case gradeCalc < .8:
                        grade = "C"
                        break;
                    case gradeCalc < .1:
                        grade = "D"
                        break;
                    default:
                        grade = "F"

                }
                
                msg.channel.send({content: this.timeout, embed:{
                    title: "Time Attack Mode Results",
                    description:`
                    Flags: ${this.round}
                    Score: ${ ~~points } points
                    Grade: **${grade}**
                    
                    `
                }});
            });
        }
    }
}

module.exports = GuessingGame