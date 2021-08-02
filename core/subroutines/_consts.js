//TODO[epic=bsian] Add this to constants module
 module.exports = { 
	xp_to_level : (xp, A, B) => ~~Math.sqrt((xp * B) / A),
  	level_to_xp : (lv, A, B) => (A * (lv ** 2)) / B,
 }
