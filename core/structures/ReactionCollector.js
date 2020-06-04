const EventEmitter = require("events").EventEmitter;
class ReactionCollector extends EventEmitter {
	constructor(message, filter, options = {}) {
		super();
		this.options = typeof filter !== "function" ? filter : options;
		this.filter  = typeof filter !== "function" ? null : filter;
		this.message = message;
		this.ended = false;
		this.collected = [];
		this.bot = message.channel.guild?.shard.client || message.channel._client;
		this.listener = (message,emoji,userID) => this.verify(message,emoji,userID);
		this.bot.on("messageReactionAdd", this.listener);
		if(this.options.time) setTimeout(()=>this.stop("time"), this.options.time);
		else setTimeout(()=>this.stop("time"), 10000);
	}

	verify(message,emoji,userID) {
		if (message.id != this.message.id)return;
        if(this.options.authorOnly){
			if(this.options.authorOnly instanceof Array && !this.options.authorOnly.includes(userID) ) return false;
			if(this.options.authorOnly !== userID) return false;
        }

        let reaction = {
          message,emoji,userID,author:PLX.users.find(u=>u.id == userID)
        }

		if(!this.filter || this.filter(reaction)) {
			this.collected.push(reaction);
			this.emit("emoji", emoji);
			if(this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
			return true;
		}
		return false;
	}

	stop(reason) {
		if(this.ended) return;
		this.ended = true;
		this.bot.removeListener("messageReactionAdd", this.listener);
		this.emit("end", this.collected, reason);
	}
}

module.exports = Eris => {
	Eris.Message.prototype.awaitReactions = function(filter, options) {
		const collector = new ReactionCollector(this, filter, options);
		return new Promise((resolve,reject) => collector.on("end", (col,reas)=>{
			if(reas == "time" && col.length == 0) reject("timeOut--");
			else resolve(col);
		}) );
	};
};
