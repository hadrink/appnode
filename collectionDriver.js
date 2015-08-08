var ObjectID = require('mongodb').ObjectID;

CollectionDriver = function(db) {
  this.db = db;
};

CollectionDriver.prototype.getCollection = function(collectionName, callback) {
  this.db.collection(collectionName, function(error, the_collection) {
    if( error ) callback(error);
    else callback(null, the_collection);
  });
};


//find all objects for a collection
CollectionDriver.prototype.findAll = function(collectionName, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
      if( error ) callback(error)
      else {
        the_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};


// find an email
CollectionDriver.prototype.findEmail = function(collectionName, email, callback) {
	this.getCollection(collectionName, function(error, the_collection) {
		if (error) callback(error)
		else {
			the_collection.findOne({"email":email}, function(error,result) {
				if(error) callback(error)
				if(result) {
					console.log(result);
					console.log('{"success":true,"object":'+JSON.stringify(result)+'}');
					callback('{"success":true,"object":'+JSON.stringify(result)+'}');
				}
				else callback('{"success":false}');
			});
		}
	});
}


// Search for UISearchBar
CollectionDriver.prototype.searchBar = function(collectionName, query, callback){
	this.getCollection(collectionName, function(error, the_collection) {
		if (error) callback (error)
		else {
			the_collection.find({name : {$regex : query, $options :'i'}}).limit(20).toArray(function(error, result){
				if(error) callback (error)
				else callback({"searchlist" : result})
			});
		}
	});
} 


//find a specific object
CollectionDriver.prototype.get = function(collectionName, id, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
            var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
            if (!checkForHexRegExp.test(id)) callback({error: "invalid id"});
            else the_collection.findOne({'_id':ObjectID(id)}, function(error,doc) {
            	if (error) callback(error)
            	else callback(null, doc);
            });
        }
    });
}


//save new object
CollectionDriver.prototype.save = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
    	if(error) callback(error);
		else {
			obj.created_at = new Date();
			the_collection.insert(obj, function() {
				callback(null, '{"success":true}');
			});
		}
    });
};

CollectionDriver.prototype.updateUser = function(collectionName, obj, email, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
 			console.log(obj);
	        obj.updated_at = new Date();
	        console.log(obj);
            the_collection.update({'email':obj.email}, obj, function(error,doc) {
            	if (error) callback(error)
            	else callback(doc);
            });       
            
         }
    });
}



//update a specific object
CollectionDriver.prototype.update = function(collectionName, obj, entityId, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
	        obj._id = ObjectID(entityId);
	        obj.updated_at = new Date();
            the_collection.save(obj, function(error,doc) {
            	if (error) callback(error)
            	else callback(null, obj);
            });
        }
    });
}

//delete a specific object
CollectionDriver.prototype.delete = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
            the_collection.remove({'email':obj.email}, function(error,doc) {
            	if (error) callback(error)
            	else callback(null, '{"success":true}');
            });
        }
    });
}

CollectionDriver.prototype.returnListPlaces = function(collectionName, latitude, longitude, distanceMax, minAge, maxAge, callback) {
	console.log("Return list of place with user settings");

	var floatLatitude = parseFloat(latitude);
	var floatLongitude = parseFloat(longitude);
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		the_collection.find(
		   {
		     "loc.coordinates":
		       { $near :
		          {
		            $geometry: { type: "Point",  coordinates: [ floatLongitude, floatLatitude ] },
		            $minDistance: 0,
		            $maxDistance: distanceMax
		          }
		       },
			   "average_age": 
			   	{ 
			   		$gt: minAge, 
			   		$lt: maxAge 
			   	} 
		   }

		).toArray(function(error, result){
			if (error) callback(error)
			else callback(null, result)
		});
	});
}


//Return bars
CollectionDriver.prototype.barListClose = function(collectionName, latitude, longitude, callback) {
	console.log("Return list of close bar");

	var floatLatitude = parseFloat(latitude);
	var floatLongitude = parseFloat(longitude);
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		the_collection.find(
		   {
		     loc:
		       { $near :
		          {
		            $geometry: { type: "Point",  coordinates: [ floatLongitude, floatLatitude ] },
		            $minDistance: 0,
		            $maxDistance: 20
		          }
		       }
		   }
		).toArray(function(error, result){
			console.log("return object");
			if (error) callback(error)
			else callback(null, result)
		});
	});
}


CollectionDriver.prototype.barListPopularity = function(collectionName, lattitude, longitude, radius, callback) {
	console.log("Je suis dans la fonction barList");
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		else {

			var myLatitude = parseFloat(lattitude);
			var myLongitude = parseFloat(longitude);

			var result = the_collection.find( { loc :
                  { $geoWithin :
                    { $centerSphere :
                       [ [ myLongitude , myLatitude ] , radius / 6371 ]
                } } } ).sort({"popularity" : -1 }).limit(20).toArray(function(error, result){
				if (error) callback(error)
				else if (result.length == 0) callback("No places found")
				else callback({ "listbar" : result });
			});
		}
	});
}


CollectionDriver.prototype.memberWithinPlace = function(collectionName, placeCoordinate, callback){
	console.log("I'm in the function memberWithinPlace");
	console.log(placeCoordinate)
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		else {
			the_collection.find(
				{
					loc: {
						$geoWithin: {
							$geometry: {
							type: "Polygon" ,
							coordinates: placeCoordinate 
							}
						}
					}
				}
			).toArray(function(error, result){
				console.log("I'm coming to be here");
				if (error) callback(error)
				else if (result.length == 0) callback(null, false)
				else callback(null, true)
			});
		}
	});
}


CollectionDriver.prototype.coordinateRefresh = function(collectionName, obj, callback){
	console.log("function for actualise user coordinate");
	console.log(obj.id);
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		else {
	        //obj.updated_at = new Date();
	        console.log(obj);
            the_collection.update({'_id':ObjectID(obj.id)}, { $set : { "loc" : { "type": "Point", "coordinates": [ obj.longitude , obj.latitude ] }}}, function(error,doc) {
            	if (error) callback(error)
            	else callback(null, obj);
            });
		}
	});
}


CollectionDriver.prototype.placeCounter = function(collectionName, placeId, place, callback){
	console.log("Counter function");
	console.log(typeof(placeId));

	var placeIdHex = String(placeId);
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback (error)
		else {
			the_collection.update({'_id':ObjectID(placeIdHex)}, {$inc : { counter : 1}}, function(error, doc) {
				if (error) callback(error)
				else callback (null, place);
			});
		}
	});
}


CollectionDriver.prototype.updateUserPlaces = function(collectionName, userId, obj, callback){
	console.log("Update user place");

	this.getCollection(collectionName, function (error, the_collection){
		var visitedAt = new Date();
		var placeId = obj._id;
		var documentVisited = "visited";
		var documentVisitedId = documentVisited+"."+placeId;
		console.log(documentVisitedId);
		if (error) callback (error)
		else {

			the_collection.findOne({'_id':ObjectID(userId)}, function(error, doc){
				/*console.log(doc.visited.visitedAt);
				console.log(doc.visited.id);
				console.log(placeId);*/

				var id1 = String(doc.visited.id);
				var id2 = String(placeId);
				var newDate = new Date();
				console.log(newDate);

				var diff = newDate - doc.visited.visitedAt;

				console.log(Math.floor(diff / 60e3));


				if (error) callback(error)
				else if ((diff < 60e3) && (id1 == id2)) {
					console.log("Plus petit qu'une minute");
					callback(null, false)
				}

				else {
					callback(null, doc)
				}
			});

			the_collection.update({'_id':ObjectID(userId)}, {$set : { visited : {"id" : placeId, "name" : obj.name, "visitedAt": visitedAt}}}, function(error, doc) {
				if (error) callback(error)
				else console.log("Update of user place");
			});

		}
	});

	/*this.getCollection(placeCollection, function (error, the_collection){
		if (error) callback (error)
		else {
			the_collection.update({'_id':ObjectID(obj._id)}
		}
	});*/
}


//-- Update place if user is within place
CollectionDriver.prototype.updatePlaceUsers = function(placeCollection, placeId, obj, callback){
	console.log("Update place users");
	var placeIdHex = String(placeId);
	
	//-- Get collection
	this.getCollection(placeCollection, function (error, the_collection){
		if (error) callback (error)
		else {
			var date = new Date;
			var birthdate = obj.Birthdate
			var ageUser = date.getFullYear() - birthdate.getFullYear();
			
			//-- Update place with an array of this user
			the_collection.update(
				{'_id':ObjectID(placeIdHex)}, 
				{ $addToSet : 
					{ visitors : 
						{ "id" : obj._id, "firstname" : obj.Firstname, "lastname" : obj.Lastname, "age" : ageUser, "gender" : obj.Gender, "visited_at" : date }
					}
				}, 
				function (error, message) {
					message = "User location has been fully updated"
					if (error) callback (error)
					else {
						
						//-- Aggregate average of Age, Sex of all users in this place and calc total visiters
						the_collection.aggregate(
							{ $match: 
								{ _id: ObjectID(placeIdHex) } 
							},
							{ $unwind: '$visitors' },
							{ $group: 
								{ _id: ObjectID(placeIdHex), 
									avgGender: {$avg : '$visitors.gender' }, 
									avgAge: {$avg : '$visitors.birthday' }, 
									totalVisitors : { $sum : 1 },
										
								}
							}, 
							function(err, result) {
								if (err) callback(err);
								else {
									console.log(result);
									var resultAggregate = result[0];
									console.log(resultAggregate);
									
									//-- Update result of the previous aggregate
									the_collection.update(
										{'_id':placeId }, 
										{ $set :  
											{ "average_age" : resultAggregate.avgAge, "average_gender" : resultAggregate.avgGender, "popularity" : resultAggregate.totalVisitors }, 							
										}, 
										function (error, message) {
											message = "User location has been fully updated";
											if (error) callback (error)
											else callback (null, message);
										});
								}
							});

					}
			});
		}
	});
}


exports.CollectionDriver = CollectionDriver;

