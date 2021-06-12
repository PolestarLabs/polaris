class DisposableHook {
  constructor(msg, name, b64avatar, info) {
    this.msg = msg;
    this.name = name;
    this.avatar = b64avatar;
    this.info = info;
  }

  destroy() {
    console.log(this.hook);
    this.hook && PLX.deleteWebhook(this.hook.id, this.hook.token, "Expired");
  }

  exec(fun) {
    this.hook && fun(this.hook).then((res) => PLX.executeWebhook(this.hook.id, this.hook.token, res).then(() => this.destroy()));
  }

  async init(avatarURL) {
    const avatar = avatarURL ? await img2base64(avatarURL).then((img) => img.dataUri) : this.avatar;
    this.hook = await PLX.createChannelWebhook(
      this.msg.channel.id,
      { name: this.name, avatar },
      this.info.reason || this.info,
    ).catch((e) => {
      if (e.code === 50013) return this.msg.channel.send("Missing Manage Webhook permisision :(").then(() => null);
      throw e;
    });

    if (this.info.once) {
      return PLX.executeWebhook(this.hook.id, this.hook.token, this.info.payload).then(() => this.destroy());
    }

    return this;
  }
}

module.exports = DisposableHook;
