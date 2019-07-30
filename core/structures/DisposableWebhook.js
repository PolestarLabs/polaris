const i2b64 = Promise.promisify( (require("imageurl-base64")) );
class DisposableHook{

    constructor(msg,name,avatar,info){
        this.hook = i2b64(avatar).then(b64=>PLX.createChannelWebhook(msg.channel.id, {name,avatar:b64.dataUri}, (info.reason || info)));
        
        if(info.once){
            this.hook.then(hk=> PLX.executeWebhook(hk.id,hk.token,info.payload).then(m=> this.destroy() ));
        }
        
    }

    destroy(){
        this.hook.then(hk=>{
            console.log(hk)
            PLX.deleteWebhook(hk.id, hk.token, "Expired");
        })
    }

    exec(fun){
        this.hook.then(hk=> fun(hk).then(res=> PLX.executeWebhook(hk.id,hk.token,res).then(_=> this.destroy())) );
    }
}

module.exports = DisposableHook;