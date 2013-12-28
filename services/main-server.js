
var express = require('express');
var findit = require('findit');
var mongodb = require('mongodb').MongoClient;
var fileUpload = require('fileupload');
var mkdirUtil = require('mkdirp');
var app = express();

var properties = {
	contentsFolder: "contents"
};

var category_structure = {
    location: "sci_fi/finding_neo_2"
};

app.post('/category_structure/create.json', function(req, res) {
   mongodb.connect('mongodb://localhost:27017/content_locator', function(err, db) {
   console.log("DB connected successfully" + db);
   var location = category_structure.location; // to be replaced by req.body
   console.log("Here " + location);
   db.collection('content_locations').find({'location': new RegExp(location, 'i') }).toArray(function(err, folders) {
   if(folders != null && folders.length > 0){
   	    console.log(folders);
        res.send(folders);
        // res.status(409);
    }
    else{
      db.collection('content_locations').insert(category_structure, function(err, contentLocation){
		if(err){
            console.log(err);
            res.status(400);

		}else{
			res.send("Successfully created a content category structure");
			// res.status(201);
		}
	  }); 
    }
   });
 });	

});

app.get('/content/list.json', function (req, res) {

	var contents=[];

	var finder = findit(properties.contentsFolder);
	finder.on('file',function (file, stat) {
		contents.push(file);
		console.log("file: " + file)
	});
	finder.on('directory',function (dir, stat, stop) {
		console.log("dir: " + dir);
		console.log(stat);
		if(stat.nlink<3)stop();
	})
	finder.on('end',function () {
		console.log("end: " + contents);
		res.write(JSON.stringify(contents));
		res.end();
	});
	finder.on('stop',function () {
		console.log("stop: " + contents);
		res.write(JSON.stringify(contents));
		res.end();
	});

	contents.push([{
		name:"IceCream",
		path:"/images/IceCream.png"
	}]);


});

app.get('/content/download',function (req, res) {
	
	var file = req.query.file || '';
	res.download(file);

});

var requestFile = {
  content : {
  	path : "math/algebra",
  	subjectMatter : "contents/algebra_one.txt"
  } 
};

app.post('/upload', function(req, res) {
	var subjectMatter =  requestFile.content.subjectMatter; //req.files.content.subjectMatter;
	var promise = mkdirUtil("contents/"+ requestFile.content.path, function(err){
     if(err) console.log("Error creating Directory Structure");
     else {
          	var fileUploader = fileUpload.createFileUpload("contents/"+ requestFile.content.path);
   			fileUploader.put(subjectMatter,function(err, file){
    		  if(err){
    		  	console.log("Error captured during Upload Content " + err);
    		  }
    		  res.send(file);
        	});
    }
   });
});

app.listen(3000);
