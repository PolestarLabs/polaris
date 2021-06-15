const { EventEmitter } = require("events");

class ButtonCollector extends EventEmitter {
  constructor(message, filter, options = {}) {
    super();
    this.options = typeof filter !== "function" ? filter : options;
    this.filter = typeof filter !== "function" ? null : filter;
    this.message = message;
    this.ended = false;
    this.collected = [];
    this.bot = message.channel.guild?.shard.client || message.channel._client || PLX;
    this.listener = (interaction, data) => this.verify(interaction, data, interaction.member.user.id);
    this.bot.on("messageComponent", this.listener);
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
    this.bot.removeListener("messageComponent", this.listener);
    if (!this.options.removeButtons) this.message.edit({ content: this.message.content, components: [] }).catch(err => null)
    this.emit("end", this.collected, reason);
  }
}

module.exports = (Eris) => {
  Eris.Message.prototype.awaitButtonClick = function awaitButtonClick(filter, options) {
    //FIXME[epic=flicky] uncomment this when bsian's PR is merged
    //if (!this.components?.length) return Promise.reject(new Error("No components in message!"));
    const collector = new ButtonCollector(this, filter, options);
    return new Promise((resolve, reject) => collector.on("end", (col, reason) => {
      if (reason === "time" && col.length === 0) reject(new Error("timeOut--buttons"));
      else resolve(col);
    }));
  };

  Eris.Message.prototype.createButtonCollector = function createButtonCollector(filter, options) {
    return new ButtonCollector(this, filter, options);
  };
};
