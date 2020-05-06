class Choice{
    constructor(string,index){
        this.index = index;
        let regex = /<?(a?:([A-z,0-9]+):([0-9]{10,25}))>?/
        let emoji = string && typeof string == 'string' ? string.match(regex) : null;
        if(emoji){
            this.name     = emoji[2];
            this.reaction = emoji[1];
            this.output   = "<"+ emoji[0] + ">";
            this.id       = emoji[3];
        }else if(typeof string === 'object'){
            this.name       = string.name
            this.id         = string.id
            this.reaction   = string.name +":"+ string.id
            this.output     = "<"+(string.animated?"a:":":")+string.name +":"+ string.id+">"
        }else{
            this.name       = string;
            this.reaction   = string;
            this.output     = string;
        }
    }
}


const ReactionMenu = function ReactionMenu(menu,msg,choices,options={}){
    return new Promise(async resolve=>{

        
        let time = options.time || 10000
        let embed = options.embed|| menu.embeds?.[0] || false;
        let avoidEdit = options.avoidEdit || true;
        let strings = options.strings || {}
            strings.timeout   =strings.timeout|| "TIMEOUT"
        
            let proc=0
        choices = choices.map((v,i,a)=> new Choice(v,i));
        choices.forEach((chc,i,all)=>{
            wait((1+i)*.055).then(_=>
                menu.addReaction(chc.reaction).then(()=>{
                    proc++
                    if(proc===all.length) startChosing(menu);
                })
            )
        });
        
        async function startChosing(menu){
            
            const reas = await menu.awaitReactions( {
                maxMatches: 1,
                authorOnly:msg.author.id,
                time
            }).catch(e=>{
                menu.removeReactions().catch(e=>null);
                if(embed && !avoidEdit){
                    embed.color =16499716;        
                    embed.footer ={text: strings.timeout};      
                    menu.edit({embed});
                }
            });
            
            if (!reas?.length !== 0 ) return resolve(null);
            menu.removeReactions().catch(e=>null);
            if (reas.length === 1 && choices.find(c=> reas[0].emoji.name == c.name)  ) {
                let res = choices.find(c=> reas[0].emoji.name == c.name);
                return resolve(res);
            }else{
                return resolve(null);
            }
            
        }
        
    })
}

ReactionMenu.choice = Choice

module.exports = ReactionMenu