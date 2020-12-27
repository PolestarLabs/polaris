// @ts-check
const cfg = require("../config.json");

class WebhookDigester {
  constructor(client) {
    this.client = client;
    this.executed = [];
  }

  execute(embed, options = {}) {
    const {
      pings, once, hook, noRepeat, id,
    } = options;
    const destination = hook || cfg.mainWebhook;
    if (!destination?.id) return; // FIXME[epic=flicky] way to disable this completely
    let content = "";

    if (once) {
      if (PLX.cluster.id !== 0) return;
      embed.footer = "ONE-TIME REPORT: May not be affecting all shards.";
    }
    if (pings) {
      content += "<@88120564400553984> ";
      if (typeof pings === "string") content += pings;
    }
    if (noRepeat && id) {
      if (this.executed.includes(id)) return;
      this.executed.push(id);
    }

    embed.footer = { text: `Reported by cluster: ${PLX.cluster.name}` };
    embed.timestamp = new Date();

    this.client.executeWebhook(destination.id, destination.token, {
      content,
      embeds: [embed],
    });
  }

  info(message, options) {
    const embed = {
      color: 0x15A9D6,
      description: message,
    };
    this.execute(embed, options);
  }

  warn(message, options) {
    const embed = {
      color: 0xD6A915,
      description: message,
    };
    this.execute(embed, options);
  }

  error(message, options) {
    const embed = {
      color: 0xF05956,
      description: message,
    };
    this.execute(embed, options);
  }

  ok(message, options) {
    const embed = {
      color: 0x40F066,
      description: message,
    };
    this.execute(embed, options);
  }

  raw(message, options) {
    const { hook } = options;
    const destination = hook || cfg.mainWebhook;
    if (!destination?.id) return; // FIXME[epic=flicky] way to disable this completely
    this.client.executeWebhook(destination.id, destination.token, {
      content: `\`[${PLX.cluster.name || "N/A"} | #${PLX.cluster.id || 0}]\` ::  ${message.slice(0, 2000)}`,
    });
  }
}

module.exports = WebhookDigester;
