

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

function tagsCheck(tags){
	if (!(tags instanceof Array))
		tags = Object.keys(tags).map(tg=> `${tg}:${tags[tg]}` );
	
	return DEFAULT_TAGS.concat(tags);
}

(async () => {
	
	const INSTANCE = process.env.PRIME_FLAVORED_CLIENT || process.env.NODE_ENV !== "production" ? "main" : "beta";
	
	process.env.DD_VERSION= (await exec("git rev-parse --short HEAD")).trim();
	process.env.DD_ENV= process.env.NODE_ENV;
	process.env.DD_SERVICE="Pollux-" + INSTANCE;
	process.env.DD_LOGS_INJECTION=true;

	global.INSTR = {};

	const StatsD = require('hot-shots');
	const dogstatD = new StatsD();

	const tracer = require('dd-trace').init({
		logInjection: true,
		analytics: true,
	});
	tracer.use('bluebird', {service: 'bluebird'});
	tracer.use('mongoose', {service: 'mongoose'});


	const DEFAULT_TAGS = ['client:'+ INSTANCE || "unknown", 'cluster:'+ PLX.cluster.name, "build:"+process.env.DD_VERSION]
	
	
	global.INSTR.inc = (metric,tags=[],rate=1) => {		
		tags = tagsCheck(tags,DEFAULT_TAGS);
		return dogstatD.increment("plx."+metric,rate, tags )
	}

	global.INSTR.dec = (metric,tags=[],rate=1) => {		
		tags = tagsCheck(tags,DEFAULT_TAGS);
		return dogstatD.decrement("plx."+metric,rate, tags )
	}

	global.INSTR.gauge = (metric,value,tags=[]) => {		
		tags = tagsCheck(tags,DEFAULT_TAGS);
		return dogstatD.gauge( "plx."+metric , value, tags )
	}

	global.INSTR.top_inc = (metric,tags=[],rate) => {		
		tags = tagsCheck(tags,DEFAULT_TAGS);
		return dogstatD.increment(metric, DEFAULT_TAGS.concat(tags) )
	}

	global.INSTR.event = (title, message, eventData, tags) => {

		if (PLX.logInstr) console.log({title,eventData});

		tags ??= eventData.tags
		tags = tagsCheck(tags,DEFAULT_TAGS);

		eventData.timestamp ??= Date.now();
		eventData.tags ??= DEFAULT_TAGS.concat(tags);
		//eventData.aggregation_key
		//eventData.priority
		//eventData.source_type
		//eventData.alert_type // error, warning, success, or info

		return dogstatD.event( title, message, eventData );
	}

	global.INSTR.error = (t,m,ed,tg) => {
		ed.alert_type = "error"; 
		return global.INSTR.event(t,m,ed,tg)
	}
	global.INSTR.info = (t,m,ed,tg) => {
		ed.alert_type = "info";
		ed.priority ??= "low";
		return global.INSTR.event(t,m,ed,tg)
	}
	global.INSTR.warn = (t,m,ed,tg) => {
		ed.alert_type = "warning";
		return global.INSTR.event(t,m,ed,tg)
	}
	global.INSTR.success = (t,m,ed,tg) => {
		ed.alert_type = "success";
		ed.priority ??= "low";
		return global.INSTR.event(t,m,ed,tg)
	}

})()


