var http = require('http'),
    express = require('express'),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    CollectionDriver = require('./collectionDriver').CollectionDriver,
    SearchAlgo = require('./searchAlgo').SearchAlgo;
 
var app = express();
app.set('port', process.env.PORT || 3000); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.bodyParser());

var mongoHost = 'localhost';
var mongoPort = 27017; 
var collectionDriver;
var searchAlgo;


 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open(function(err, mongoClient) { 
  if (!mongoClient) {
      console.error("Error! Exiting... Must start MongoDB first");
      process.exit(1);
  }
  var db = mongoClient.db("had");  
  collectionDriver = new CollectionDriver(db);
  searchAlgo = new SearchAlgo();
 
});

app.use(express.static(path.join(__dirname, 'public')));
 
app.get('/', function (req, res) {
    
});

app.post('/search/:collection/:query', function (req, res){
	console.log("search request");
	var collection = req.params.collection;
	var query = req.params.query;
	collectionDriver.searchBar(collection, query, function(err, result){
		if (err) {res.send(400, err);}
		else {res.send(200, result);}
	});
});

app.post('/list/:intention/', function (req, res){
	console.log("Get list");
	var userID = "idfacebook";
	console.log(req.body);
	var collection = req.body.collection; //"places";
	var latitude = req.body.latitude; //48.297468;
	var longitude = req.body.longitude; //4.074515;
	var distanceMax = parseInt(req.body.distance_max)*1000; //200000;
	var minAge = req.body.age_min; //20
	var maxAge = req.body.age_max; //50;
	var userSex = 1;
	var friends = ["976915349020345","976915349020344"];
	var finalObj = {};
	var listPlaces = [];
	var intention = "had";
	collectionDriver.returnListPlaces(collection, latitude, longitude, distanceMax, minAge, maxAge, function(err, places){
		if(err) {res.send(400, err); }
		else {
			//-- Loop to get all places
			places.forEach(function(place) {
				
				//-- Init Variables				
					//-- Get some data in database
				var popularity = typeof place.popularity !== 'undefined' ? place.popularity : null,
					averageAge = place.average_age,
					averageGender = place.average_gender,
					myfriends = [],
					nbFriends = 0,
					percentMale,
					percentFemale,
					upperPointsMale,
					upperPointsFemale,
					averageAgeWished,
					diffAge;
					
						
					if(typeof place.average_gender !== 'undefined'){
						//-- Calc percent male and female and upper or lower points
						percentMale = (averageGender * 100);
						percentFemale = 100 - percentMale;
						upperPointsMale = percentMale - 50;
						upperPointsFemale = percentFemale - 50;
					}
					else{
						upperPointsMale = null;
						upperPointsFemale = null;
					}
					
					if(typeof place.average_age !== 'undefined'){
						//-- Age wished and diff age
						averageAgeWished = (minAge + maxAge) / 2;
						diffAge = averageAgeWished - averageAge;
					}
					else{
						diffAge = null;
					}

					// -- Get location for calc distance
					locationPlace = place.loc.coordinates,
					longitudePlace = locationPlace[0],
					latitudePlace = locationPlace[1],
					distanceBetweenLocations = 0;
					
					//-- Loop to inc number of friends in place
					place.visitors.forEach(function(visitor){
						console.log("visitor test");
						console.log(visitor);
						console.log(friends.length);
						for(var i = 0; i < friends.length; i++){
							console.log("friends i");
							console.log(friends[i]);
							if (friends[i] == visitor.id_facebook){
								console.log("id_facebook test");
								console.log(visitor.id_facebook);
								myfriends.push(visitor.id_facebook);
								return nbFriends++;
							}
						}
					});
					
					console.log("friends test");
					place.friends = myfriends;
					console.log(place.friends);
					console.log(friends);
					
					console.log(place);
															
					//-- Calc distance between locations
					function distance(lat1, lon1, lat2, lon2, unit) {
						
						var radlat1 = Math.PI * lat1 / 180,
							radlat2 = Math.PI * lat2 / 180,
							radlon1 = Math.PI * lon1 / 180,
							radlon2 = Math.PI * lon2 / 180,
							theta = lon1 - lon2,
							radtheta = Math.PI * theta / 180,
							dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
						
						dist = Math.acos(dist)
						dist = dist * 180 / Math.PI
						dist = dist * 60 * 1.1515
						
						if (unit == "K") { dist = dist * 1.609344 }
						if (unit == "N") { dist = dist * 0.8684 }
						
						return dist
					}
					
					//-- result distance
					distanceBetweenLocations = distance(latitude, longitude, latitudePlace, longitudePlace, "K");
					
					//-- Switch algorithm by intention 
					switch (intention) {
						case "had" : {
							//-- Switch parameters by sex
							switch (userSex) {
								case 0 : 
									searchAlgo.barPoints(popularity, nbFriends, upperPointsFemale, diffAge, distanceBetweenLocations, function(result){
										place.points = result;
									});
								break;
								case 1 : 
									searchAlgo.barPoints(popularity, nbFriends, upperPointsMale, diffAge, distanceBetweenLocations, function(result){
										place.points = result;
									});
								break;
							}
						}
						break;
						case "party" : {
							//-- Switch parameters by sex
							switch (userSex) {
								case 0 : 
									searchAlgo.partyPoints(popularity, nbFriends, upperPointsFemale, diffAge, distanceBetweenLocations, function(result){
										place.points = result;
									});
								break;
								case 1 : 
									searchAlgo.partyPoints(popularity, nbFriends, upperPointsMale, diffAge, distanceBetweenLocations, function(result){
										place.points = result;
									});
								break;
							}
						}
						break;
					}
							
					//-- Push new data place in listPlace
					listPlaces.push(place);
													
			});
		}
		
		//-- Sort places in order ascending points
		listPlaces.sort(function(a, b){
			return b.points - a.points;
		});
		
		finalObj.listbar = listPlaces;
		
		//-- Send list places
		res.send(200, finalObj);

	});	
});
 
app.post('/email/:collection', function(req, res){
	console.log('Coucou');
	var emailSend = req.body;
	var collection = req.params.collection;
	collectionDriver.findEmail(collection, emailSend, function(err,objs){
		if (err) { res.send(400,err); }
		else { res.send(201, objs); }
	});
}); 

app.post('/:collection/:latitude/:longitude/:radius', function(req, res){
	console.log('Send post action for get list');
	console.log(req.params.latitude);
	console.log(req.params.longitude);
	var collection = req.params.collection;
	var latitude = req.params.latitude;
	var longitude = req.params.longitude;
	var radius = req.params.radius;
	
	collectionDriver.barListPopularity(collection, latitude, longitude, radius, function(error, objs){
	  if (error) { res.send(400, error); }
	      else { 
	          if (req.accepts('html')) {
    	          res.render('data',{objects: objs, collection: collection});
              } else {
	          res.set('Content-Type','application/json');
                  res.send(200, objs);
              }
         }
	});

});

// Get coordinate and verify if member is within place

app.post('/usercoordinate/:collection/:id/:latitude/:longitude', function(req, res){
	console.log("I'm in usercoordinate");
	var collection = req.params.collection;
	var user = req.params.user;
	var latitude = parseFloat(req.params.latitude);
	var longitude = parseFloat(req.params.longitude);
	var id = req.params.id;
		
	var myObj = {"email":id, "latitude":latitude,"longitude":longitude}
	
	collectionDriver.coordinateRefresh(collection,myObj, function(error, objs){	
		//var error = { "message" : "Cannot PUT a whole collection" }				
		if (error) { res.send(400, error); }
	});
	
	// Find if the user is within a place and update Data base	
	collectionDriver.barListClose("places", latitude, longitude, function(error, obj){ // Get places around the user
		console.log(obj.length);
		if (error) {res.send(400, error); }
		else if (obj.length == 0) {res.send(200, "No place around");}
		
		// If places around him
		
		else { 
	          	obj.forEach(function(entry) { // Loop on the places and check if the user is within place
	          		console.log(entry._id);
	              	collectionDriver.memberWithinPlace("user", entry.geometry.coordinates, function(error, result){
					  	if (error) {res.send(400, error)}
					  	else if (result == true) { // Send "true" when the user is within 
						  	collectionDriver.placeCounter("places", entry._id, entry, function(error, result){ // inc a counter in the "place" document
							  	if (error) {res.send(400, error)}
						  	});
						  	collectionDriver.updateUserPlaces("user", id, entry, function(error, result){ // Update places in the "user" document
						  		if (result == false){
							  		res.send("The user has been already update recently")
						  		}
						  		else {
								  	collectionDriver.updatePlaceUsers("places", entry._id, result, function(error, message){ // Put the user in the "place" document
									  	if (error) {res.send(400, error)}
									  	else {res.send(200, message)}
									});
																		
								}
						  	});
					  	}
					  	else if (result == false){
					  		console.log("The user is not within the place");
						  	res.send("The user is not within the place");
					  	}
				});
			});
        }	
	});	
});
 
app.get('/:collection', function(req, res) {
   var params = req.params;
   collectionDriver.findAll(req.params.collection, function(error, objs) {
    	  if (error) { res.send(400, error); }
	      else { 
	          if (req.accepts('html')) {
    	          res.render('data',{objects: objs, collection: req.params.collection});
              } else {
	          	res.set('Content-Type','application/json');
                  res.send(200, objs);
              }
         }
   	});
});
 
app.get('/:collection/:entity', function(req, res) {
   var params = req.params;
   var entity = params.entity;
   var collection = params.collection;
   if (entity) {
       collectionDriver.get(collection, entity, function(error, objs) {
          if (error) { res.send(400, error); }
          else { res.send(200, objs); }
       });
   } else {
      res.send(400, {error: 'bad url', url: req.url});
   }
});


/*app.post('/:collection/:email', function(req, res) {
	console.log('Post coucou');
	var params = req.params;
	var email = params.email;
    var object = req.body;
    console.log(email)
    var collection = req.params.collection;
    collectionDriver.save(collection, object, email, function(err,docs) {
          if (err) { res.send(400, err); } 
          else { res.send(201, docs); }
     });
});*/

//-- ADD USER
app.post('/:collection/create/', function(req, res) {
	console.log('Test new account');
    var object = req.body;
    var collection = req.params.collection;
    console.log(collection);
    
    //-- Récupération de la string des amis 
	var allFriendsString = object.friends;
	
	//-- Split pour en faire un tableau
	var allFriends = allFriendsString.split(",");
	
	//-- Je prépare un object JSON
	var thisObj = {};
	
	//-- Je prépare mon tableauu d'amis final
	var friends = [];
	
	//-- Pour chaque amis, j'en fait un objet
	for(var i=0; i<allFriends.length; i++) {
	    var thisFriend = {};
	    thisFriend.id_facebook = allFriends[i];
	    friends.push(thisFriend);
	}
	
	//-- Je met mon tableau final dans mon object
	thisObj = friends;
	
	//-- Object à insérer
	object.friends = thisObj;
	
	console.log(thisObj);
    
    collectionDriver.findEmail(collection, object.email, function (result){
	   if (JSON.parse(result).success == true){
	   		console.log(result);
	   		console.log("Find an Email");
	   		object.created_at = new Date(JSON.parse(result).object.created_at);	
	   		collectionDriver.updateUser(collection, object, object.email, function(err, result){
		   		if (err) { res.send(400, err); }
		   		else { res.send(200, result); }
	   		});
	   } 
	   
	   else if (JSON.parse(result).success == false ){
	   		console.log("Not Find an Email");
	   		collectionDriver.save(collection, object, function(err,docs) {
		   		if (err) { res.send(400, err); }
		   		else res.send(201, docs); 
		   	});
	   }
    }); 
});

app.put('/:collection/:entity', function(req, res) {
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.update(collection, req.body, entity, function(error, objs) {
          if (error) { res.send(400, error); }
          else { res.send(200, objs); }
       });
   } else {
	   var error = { "message" : "Cannot PUT a whole collection" }
	   res.send(400, error);
   }
});

app.delete('/:collection/delete', function(req, res) {
    console.log('Delete user');
    var object = req.body;
    var collection = req.params.collection;
    if (object) {
       collectionDriver.delete(collection, object, function(error, objs) {
          if (error) { res.send(400, error); }
          else { res.send(200, objs); }
       });
   } else {
       var error = { "message" : "Cannot DELETE a whole collection" }
       res.send(400, error);
   }
});
 
app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});