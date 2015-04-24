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
				else if (resultat.length == 0) callback(false)
				else callback(null, resultat)
			});
		}
	});
}

CollectionDriver.prototype.coordinateRefresh = function(collectionName, obj, callback){
	console.log("function for actualise user coordinate");
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

exports.CollectionDriver = CollectionDriver;