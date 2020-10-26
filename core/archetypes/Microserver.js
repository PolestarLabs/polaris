const http = require("http");

class Microserver {
  constructor(crossAuth) {
    this.microtasks = require("../subroutines/microtasks");
    const server = http.createServer((req, res) => {
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 1e6) req.connection.destroy();
        });
        req.on("end", async () => {
          try {
            delete require.cache[require.resolve("../subroutines/microtasks")];
            this.microtasks = require("../subroutines/microtasks");
            body = JSON.parse(body);
            if (body.auth === crossAuth) {
              const entrypoint = req.url.split("/")[1];
              await this.microtasks[entrypoint](body, req.url, res);
            } else {
              res.statusCode = 403;
              res.end("Vaza");
            }
            req = null;
            this.microtasks = null;
          } catch (err) {
            res.statusCode = 504;
            console.error(err);
            res.send(`ERROR: ${err.message}`);
          }
        });
      }
    });
    const port = `${PLX.user.id === '578913818961248256' ? 199 : 190}${(PLX.cluster.id || "0").toString().padStart(2, "0")}`;
    server.listen(Number(port));
    console.info("Shard cluster", (PLX.cluster.name || "NONAME").yellow, "microserver listening at port", port.green);
  }
}

module.exports = Microserver;
