module.exports = technicalEventLogs;

const { arrow } = require("../resources/consoleFluff");

function technicalEventLogs(Client) {
    Client.on("disconnect", () => {
        console.error(`${"[Pollux]".yellow} Disconnected from Discord`);
    });

    Client.on("guildUnavailable", (g) => {
        console.error(`${"[Pollux]".yellow} Unavailable Guild Created`, g);
    });

    Client.on("unavailableGuildCreate", (g) => {
        console.error(`${"[Pollux]".yellow} Guild unavailable [${g.id}]`);
    });

    Client.on("shardPreReady", (shard) => {
        console.log("•".cyan, "Shard", `${shard}`.blue, "getting ready...");
    });

    Client.on("shardConnect", (shard) => {
        console.log("•".cyan, "Shard", `${shard}`.blue, "WebSocket opened — waiting for HELLO/READY");
    });

    Client.on("shardReady", (shard) => {
        console.log("•".green, arrow("green",3), "Shard", `${shard}`.magenta, "is Ready -");
    });
 
    Client.on("shardResume", (shard) => {
        console.error("•".yellow, arrow("yellow",3), "Shard", `${shard}`.magenta, "resumed Activity -");
    });

    Client.on("shardDisconnect", (err, shard) => {
        console.warn("•".red, arrow("red",3), "Shard", `${shard}`.blue, "Disconnected -");
        console.error(err, " < Error");
    });

    Client.on("debug", (payload, s) => {
        if (Client.logDebug) console.log(`${s} -- ${" D E B U G ".bgGray} }`, payload);
    });

    Client.on("hello", (trace, shard) =>
        console.error(
            `${"[Pollux]".blue} ${shard !== undefined ? `Shard ${shard}` : "Hello!"}:`,
            trace
        )
    );

    Client.on("unknown", (pack, shard) => {
        if (Client.logDebug) {
            console.error(`${"[Pollux]".bgRed} SHARD ${shard} :: UNKNOWN PACKET`, pack);
        }
    });

    Client.on("error", (error, shard) => {
        if (!error) return;
        console.error(
            `${"[Pollux]".red} ${shard !== undefined ? `Shard ${shard} error` : "Error"
            }:`,
            error
        );
    });

    Client.on("warn", (message, shard) => {
        if (!Client.logDebug || !message) return;

        console.error(
            `${"[Pollux]".yellow} ${shard !== undefined ? `Shard ${shard} warning` : "WARNING"
            }:`,
            message
        );
    });

}