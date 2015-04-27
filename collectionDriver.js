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

CollectionDriver.prototype.findEmail = function(collectionName, obj, callback) {
	this.getCollection(collectionName, function(error, the_collection) {
		if (error) callback(error)
		else {
			the_collection.findOne(obj, function(error,obj) {
				if(error) callback(error)
				if(obj) callback('{"success":true}')
				else callback(null, '{"success":false}');
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
CollectionDriver.prototype.save = function(collectionName, obj, mail, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
      if( error ) callback(error)
      else {
      console.log(mail);
      the_collection.findOne({'E-mail':mail}, function(error,mail) {
			if(error) callback(error)
			if(mail) callback('{"success":false}')
			else {
				obj.created_at = new Date(); 
				the_collection.insert(obj, function() { 
					callback(null, '{"success":true}');
				});
			}
	  });
        		
      }
    });
};

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
CollectionDriver.prototype.delete = function(collectionName, entityId, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
        if (error) callback(error)
        else {
            the_collection.remove({'_id':ObjectID(entityId)}, function(error,doc) {
            	if (error) callback(error)
            	else callback(null, doc);
            });
        }
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
		     "loc.coordinates":
		       { $near :
		          {
		            $geometry: { type: "Point",  coordinates: [ floatLongitude, floatLatitude ] },
		            $minDistance: 0,
		            $maxDistance: 100
		          }
		       }
		   }
		).toArray(function(error, result){
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
						
			the_collection.find( { loc :
                  { $geoWithin :
                    { $centerSphere :
                       [ [ myLongitude , myLatitude ] , radius / 6371 ]
                } } } ).sort({"popularity" : -1 }).limit(10).toArray(function(error, result){
				if (error) callback(error)
				else callback(null,result);
			});				
		}
	});
}

CollectionDriver.prototype.memberWithinPlace = function(collectionName, placeCoordinate, callback){
	console.log("I'm in the function memberWithinPlace");
	this.getCollection(collectionName, function(error, the_collection){
		if (error) callback(error)
		else {
			the_collection.find(
				{
					"loc.coordinates" : {
						$geoWithin: { $polygon: placeCoordinate  }
					}
				}
			).toArray(function(error, resultat){
				if (error) callback(error)
				else if (resultat.length == 0) callback(null, false)
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
		visitedAt = new Date();
		var placeId = obj._id;
		var documentVisited = "visited";
		var documentVisitedId = documentVisited+"."+placeId;
		console.log(documentVisitedId);
		if (error) callback (error)
		else {
			
			the_collection.findOne({'_id':ObjectID(userId)}, function(error, doc){
				console.log(doc.visited.visitedAt);
				console.log(doc.visited.id);
				console.log(placeId);
				
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

CollectionDriver.prototype.updatePlaceUsers = function(placeCollection, placeId, obj, callback){
	console.log("Update place users");
	console.log(obj);
	
	var placeIdHex = String(placeId);
	this.getCollection(placeCollection, function (error, the_collection){
		if (error) callback (error)
		else {
			the_collection.update({'_id':ObjectID(placeIdHex)}, {$addToSet : {usersvisited : [obj.Firstname, obj.Lastname]}}, function (error, doc) {
				if (error) callback (error)
				else callback (null, doc);
			});
		}
	});
}


exports.CollectionDriver = CollectionDriver;