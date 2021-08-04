function exec(command, options) {
	return new Promise((res, rej) => {
	  let output = "";

	  const write = (data) => {
		 output += data;
	  };
	  const cmd = require("child_process").exec(command, options);

	  cmd.stderr.on("data", write);
	  cmd.stdout.on("data", write);
	  cmd.on("error", write);
	  cmd.once("exit", (code) => {
		 cmd.stderr.off("data", write);
		 cmd.stdout.off("data", write);
		 cmd.off("error", write);

		 if (code !== 0) rej(new Error(`Command failed: ${command}\n${output}`));
		 res(output);
	  });
	});
 }

(async () => {

	const INSTANCE = process.env.PRIME_FLAVORED_CLIENT || process.env.NODE_ENV !== "production" ? "main" : "beta";
	process.env.DD_ENV= process.env.NODE_ENV;
	process.env.DD_SERVICE="Pollux-" + INSTANCE;
	process.env.DD_VERSION= (await exec("git rev-parse --short HEAD")).trim();
	process.env.DD_LOGS_INJECTION=true;
	
	const DEFAULT_TAGS = ['client:'+ INSTANCE || "unknown", 'cluster:'+ PLX.cluster.name, "build:"+process.env.DD_VERSION]
	
	const StatsD = require('hot-shots');
	const dogstatD = new StatsD();
	const tracer = require('dd-trace').init();
	
	global.INSTR = {};
	
	global.INSTR.inc = (metric,tags=[],rate=1) => {
		let exTags = DEFAULT_TAGS.concat(tags);
		console.log(metric.blue,{exTags}, "i")
		return dogstatD.increment("plx."+metric,rate, exTags )
	}
	global.INSTR.dec = (metric,tags=[],rate=1) => {
		let exTags = DEFAULT_TAGS.concat(tags);
		console.log(metric.blue,{exTags}, "g")
		return dogstatD.decrement("plx."+metric,rate, exTags )
	}
	global.INSTR.gauge = (metric,value,tags) => {
		return dogstatD.gauge( "plx."+metric , value, tags )
	}
	global.INSTR.top_inc = (metric,tags=[],rate) => {
		return dogstatD.increment(metric, DEFAULT_TAGS.concat(tags) )
	}

})()