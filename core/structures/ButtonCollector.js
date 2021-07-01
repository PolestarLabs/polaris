const { EventEmitter } = require("events");
const collectors = [];

class ButtonCollector extends EventEmitter {
  constructor(message, filter, options = {}) {
    super();
    this.options = typeof filter !== "function" ? filter : options;
    this.filter = typeof filter !== "function" ? null : filter;
    this.message = message;
    this.ended = false;
    this.collected = [];
    //this.bot = message.channel.guild?.shard.client || message.channel._client || PLX;
    //this.listener = (interaction, data) => this.verify(interaction, data, interaction.member.user.id);
    //this.bot.on("messageComponent", this.listener);
    collectors.push(this);
    if (this.options.time) setTimeout(() => this.stop("time"), this.options.time);
    else setTimeout(() => this.stop("time"), 10000);
    if (this.options.idle) this.idleTimer = setTimeout(() => this.stop("idle"), this.options.idle);
  }

  verify(interaction, data, userID) {
    if (interaction.message.id !== this.message.id) return false;
    if (this.options.authorOnly) {
      if (this.options.authorOnly instanceof Array && !this.options.authorOnly.includes(userID)) return false;
      if (this.options.authorOnly !== userID) return false;
    }

    const buttonPress = {
      interaction, id: data.custom_id, userID, message: interaction.message,
    };

    console.log("verify",data)
    if (!this.filter || this.filter(buttonPress)) {
      if (this.options.idle) clearTimeout(this.idleTimer);
      this.collected.push(buttonPress);
      this.emit("click", buttonPress);
      if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
      if (this.options.idle) this.idleTimer = setTimeout(() => this.stop("idle"), this.options.idle);
      interaction.ack();
      return true;
    } else {
      if (!this.filter(buttonPress)) {
        interaction.reply({
          content: "You were not supposed to be clicking here. Shoo!",
          flags: 64
        });
      }
    }
    return false;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    collectors.splice(collectors.indexOf(this), 1);

    if (this.options?.removeButtons === false) this.message.disableButtons('all',{enforce:true}).catch(err => console.error(err));
    else this.message.edit?.({ components: [] })?.catch(err => null);
    
    this.emit("end", this.collected, reason);
  }
}
let listening = false;
module.exports = (Eris) => {
  
  if (!Eris) {
    return {
      ButtonCollector,
      checkListener
    };
  }

  if (Eris === "createRogue") {
    return function createButtonCollector(msg, filter, options) {
      checkListener()
      return new ButtonCollector(msg, filter, options);
    };
  }
  Eris.Message.prototype.awaitButtonClick = function awaitButtonClick(filter, options) {
    checkListener();
    //console.log({x:this.message.components},'thiscomps')
    //if (!this.components?.length) return Promise.reject(new Error("No components in message!"));
    
    const collector = new ButtonCollector(this, filter, options);
    return new Promise((resolve, reject) => collector.on("end", (col, reason) => {
      if (reason === "time" && col.length === 0) reject(new Error("timeOut--buttons"));
      else resolve(col);
    }));
  };

  Eris.Message.prototype.createButtonCollector = function createButtonCollector(filter, options) {
    checkListener()
    return new ButtonCollector(this, filter, options);
  };

  return ButtonCollector; // Fallback
};


function checkListener(){
	if(!listening) {
		PLX.on("messageComponent", (interaction, data) => {
			for(const collector of collectors) setImmediate(()=>collector.verify(interaction, data, interaction.member.user.id));
		});

		listening = true;
	}
}