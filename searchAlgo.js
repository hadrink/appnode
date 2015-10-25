SearchAlgo = function(){};

SearchAlgo.prototype.barPoints = function(popularity, nbFriends, diffSex, diffAge, distance, callback) {
	
	//-- Init coeff
	var coeffPopularity = 0.175,
		coeffFriends = 0.3,
		coeffDistance = 0.4,
		coeffSex = 0.125,
		coeffAge = 0.2;
	
	//-- Init points
	var popularityPoints = popularity != null ? coeffPopularity * (popularity * Math.log(popularity)) : 0,
		friendsPoints = coeffFriends * nbFriends,
		distancePoints = coeffDistance * (Math.pow(distance, 2)),
		agePoints = diffAge != null ? coeffAge * (Math.pow(diffAge, 2)) : 0,
		sexPoints = 0;

	//-- Difference calculation if value is positive or negative
	if (diffSex != null){
		if (diffSex >= 0) { sexPoints = coeffSex * (diffSex * Math.log(diffSex)); }
		else { sexPoints = - (coeffSex * (Math.pow(diffSex, 2))); }
	}
	
	//-- Calculate total points
	var totalPoints = popularityPoints + friendsPoints + sexPoints - agePoints - distancePoints;
	
	console.log(totalPoints);
	
	//-- Return result
	callback(totalPoints);
	
}

SearchAlgo.prototype.partyPoints = function(popularity, nbFriends, diffSex, diffAge, distance, callback) {
	
	//-- Init coeff
	var coeffPopularity = 0.3,
		coeffFriends = 0.2,
		coeffDistance = 0.1,
		coeffSex = 0.2,
		coeffAge = 0.2;
	
	//-- Init points
	var popularityPoints = typeof popularity !== 'undefined' ? coeffPopularity * (popularity * Math.log(popularity)) : 0,
		friendsPoints = coeffFriends * (Math.pow(nbFriends, 2)),
		distancePoints = coeffDistance * (distance * Math.log(distance)),
		agePoints = typeof diffAge !== 'undefined' ? coeffAge * (Math.pow(diffAge, 2)) : 0,
		sexPoints = 0;

	//-- Difference calculation if value is positive or negative
	if (typeof diffSex !== 'undefined'){
		if (diffSex >= 0) { sexPoints = coeffSex * (diffSex * Math.log(diffSex)); }
		else { sexPoints = - (coeffSex * (Math.pow(diffSex, 2))); }
	}
	//-- Calculate total points
	var totalPoints = popularityPoints + friendsPoints + sexPoints - agePoints - distancePoints;
	
	//-- Return result
	callback(totalPoints);
	
}


exports.SearchAlgo = SearchAlgo;

