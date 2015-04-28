var http = require('http'),
    express = require('express'),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    CollectionDriver = require('./collectionDriver').CollectionDriver;
 
var app = express();
app.set('port', process.env.PORT || 3000); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.bodyParser());

var mongoHost = 'localhost';
var mongoPort = 27017; 
var collectionDriver;

 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open(function(err, mongoClient) { 
  if (!mongoClient) {
      console.error("Error! Exiting... Must start MongoDB first");
      process.exit(1);
  }
  var db = mongoClient.db("had");  
  collectionDriver = new CollectionDriver(db); 
});

app.use(express.static(path.join(__dirname, 'public')));
 
app.get('/', function (req, res) {
    
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
	var collection = req.params.collection;
	var latitude = req.params.latitude;
	var longitude = req.params.longitude;
	var radius = req.params.radius;
	console.log(collection);
	console.log(latitude);
	console.log(longitude);
	console.log(radius);
	
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

app.get('/usercoordinate/:collection/:id/:latitude/:longitude', function(req, res){
	var collection = req.params.collection;
	var user = req.params.user;
	var latitude = parseFloat(req.params.latitude);
	var longitude = parseFloat(req.params.longitude);
	var id = req.params.id;
		
	var myObj = {"id":id, "latitude":latitude,"longitude":longitude}
	
	collectionDriver.coordinateRefresh(collection,myObj, function(error, objs){	
		var error = { "message" : "Cannot PUT a whole collection" }				
		if (error) { res.send(400, error); }
	});
	
	// Find if the user is within a place and update Data base	
	collectionDriver.barListClose("places", latitude, longitude, function(error, obj){ // Get places around the user
		if (error) {res.send(400, error); }
		else if (obj.length == 0) {res.send("No place around");}
		
		// If places around him
		
		else { 
	          	obj.forEach(function(entry) { // Loop on the places and check if the user is within place
	              	collectionDriver.memberWithinPlace("user", entry.geometry, function(error, result){
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


app.post('/:collection/:email', function(req, res) {
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

app.delete('/:collection/:entity', function(req, res) {
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.delete(collection, entity, function(error, objs) {
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