const { EventEmitter } = require("events");

class ReactionCollector extends EventEmitter {
  constructor(message, filter, options = {}) {
    super();
    this.options = typeof filter !== "function" ? filter : options;
    this.filter = typeof filter !== "function" ? null : filter;
    this.message = message;
    this.ended = false;
    this.collected = [];
    this.bot = message.channel.guild?.shard.client || message.channel._client;
    this.listener = (msg, emoji, userID) => this.verify(msg, emoji, userID);
    this.bot.on("messageReactionAdd", this.listener);
    if (this.options.time) setTimeout(() => this.stop("time"), this.options.time);
    else setTimeout(() => this.stop("time"), 10000);
    if (this.options.idle) this.idleTimer = setTimeout(() => this.stop("idle"), this.options.idle);
  }

  verify(message, emoji, { id: userID }) {
    if (message.id !== this.message.id) return false;
    if (this.options.authorOnly) {
      if (this.options.authorOnly instanceof Array && !this.options.authorOnly.includes(userID)) return false;
      if (this.options.authorOnly !== userID) return false;
    }

    const reaction = {
      message, emoji, userID, author: PLX.users.find((u) => u.id === userID),
    };

    if (!this.filter || this.filter(reaction)) {
      if (this.options.idle) clearTimeout(this.idleTimer);
      this.collected.push(reaction);
      this.emit("emoji", emoji);
      if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
      if (this.options.idle) this.idleTimer = setTimeout(() => this.stop("idle"), this.options.idle);
      return true;
    }
    return false;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("messageReactionAdd", this.listener);
    this.emit("end", this.collected, reason);
  }
}

module.exports = (Eris) => {
  Eris.Message.prototype.awaitReactions = function awaitReactions(filter, options) {
    const collector = new ReactionCollector(this, filter, options);
    return new Promise((resolve, reject) => collector.on("end", (col, reas) => {
      if (reas === "time" && col.length === 0) reject(new Error("timeOut--"));
      else resolve(col);
    }));
  };

  Eris.Message.prototype.createReactionCollector = function createReactionCollector(filter, options) {
    return new ReactionCollector(this, filter, options);
  };
};
