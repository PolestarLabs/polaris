module.exports = (phrase) => {

	let decomp = phrase.split(/ +/).join().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
	
	decomp = decomp.replace(/A/g, "🇦" );
	decomp = decomp.replace(/B/g, "🇧" );
	decomp = decomp.replace(/C/g, "🇨" );
	decomp = decomp.replace(/D/g, "🇩" );
	decomp = decomp.replace(/E/g, "🇪" );
	decomp = decomp.replace(/F/g, "🇫" );
	decomp = decomp.replace(/G/g, "🇬" );
	decomp = decomp.replace(/H/g, "🇭" );
	decomp = decomp.replace(/I/g, "🇮" );
	decomp = decomp.replace(/J/g, "🇯" );
	decomp = decomp.replace(/K/g, "🇰" );
	decomp = decomp.replace(/L/g, "🇱" );
	decomp = decomp.replace(/M/g, "🇲" );
	decomp = decomp.replace(/N/g, "🇳" );
	decomp = decomp.replace(/O/g, "🇴" );
	decomp = decomp.replace(/P/g, "🇵" );
	decomp = decomp.replace(/Q/g, "🇶" );
	decomp = decomp.replace(/R/g, "🇷" );
	decomp = decomp.replace(/S/g, "🇸" );
	decomp = decomp.replace(/T/g, "🇹" );
	decomp = decomp.replace(/U/g, "🇺" );
	decomp = decomp.replace(/V/g, "🇻" );
	decomp = decomp.replace(/W/g, "🇼" );
	decomp = decomp.replace(/X/g, "🇽" );
	decomp = decomp.replace(/Y/g, "🇾" );
	decomp = decomp.replace(/Z/g, "🇿" );

	return decomp;
	
}