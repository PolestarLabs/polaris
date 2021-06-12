
const axios = require("axios");

const rescodes = [200, 201, 400, 401, 403];
const ROOT = "https://discoin.zws.im";

module.exports = class Discoin {
  constructor(token) {
    this.token = token;
    this.rest = (METHOD, route, payload, query) => {
      if (typeof payload === "string") {
        query = payload; payload = null;
      }
      return new Promise((resolve, reject) => {
        (axios[METHOD])({
          url: `${ROOT}/${route}${query ? `?s=${encodeURIComponent(query)}` : ""}`,
          headers: { Authorization: `Bearer ${this.token}` },
          json: payload,
        }).then( (res) => {
          const body = res.data;
          if (err || rescodes.indexOf(res.status) === -1) return reject(new Error(`[${res.status}] :: API failure`));
          if (![200, 201].includes(res.status)) {
            return reject(new Error(JSON.stringify({ body, request: `${METHOD.toUpperCase()}: /${route}`, payload })));
          }
          return resolve(body);
        });
      });
    };

    this.currencies = () => new Promise((resolve, reject) => {
      axios.get({ url: "https://pollux.gg/api/discoin/currencies" }).then((res) => {
        if (res.status === 200) resolve(JSON.parse(res.data));
        else reject(res.status);
      }).catch(res=> reject(res.status) );
    });
  }

  rates() { return this.rest("get", "currencies"); }

  fetch(filter) { return this.rest("get", "transactions", filter || "{\"to.id\": \"RBN\", \"handled\": false}"); }

  create(user, amt, toId) { return this.rest("post", "transactions", { user, amount: Number(amt), toId }); }

  process(receipt) { return this.rest("patch", `transactions/${receipt}`, { handled: true }); }

  info(receipt) { return this.rest("get", `transactions/${receipt}`); }

  reject(receipt) {
    return this.rest("patch", `transactions/${receipt}`, { handled: true }).then(
      (res) => this.rest("post", "transactions", { user: res.user, amount: Number(res.amount), toId: res.from.id }),
    );
  }
};
