const i2b64 = Promise.promisify((require("imageurl-base64")));

class DisposableHook {
  constructor(msg, name, avatar, info) {
    this.hook = i2b64(avatar).then(
      (b64) => PLX.createChannelWebhook(
        msg.channel.id,
        { name, avatar: b64.dataUri },
        (info.reason || info),
      ).catch(() => { msg.channel.send("Cannot Create Webhooks :("); return null; }),
      (e) => { throw e; },
    );

    if (info.once) {
      this.hook.then((hk) => (hk ? PLX.executeWebhook(hk.id, hk.token, info.payload).then(() => this.destroy()) : null));
    }
  }

  destroy() {
    this.hook.then((hk) => {
      console.log(hk);
      PLX.deleteWebhook(hk.id, hk.token, "Expired");
    });
  }

  exec(fun) {
    this.hook.then((hk) => (hk ? fun(hk).then((res) => PLX.executeWebhook(hk.id, hk.token, res).then(() => this.destroy())) : null));
  }
}

module.exports = DisposableHook;
