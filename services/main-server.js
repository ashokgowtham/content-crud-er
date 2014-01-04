var express = require('express')
, mongodb = require('mongodb').MongoClient
, fileUpload = require('fileupload')
, mkdirUtil = require('mkdirp')
, flash = require('connect-flash')
, findit = require('findit')
, fs = require('fs')
, passport = require('passport')
, localStrategy = require('passport-local').Strategy;

var app = express();

passport.use(new localStrategy(
	function(username, password, done) {
		findByUsername(username, function(err, user) {
			if (err) { 
				return done(err); 
			}
			if (!user) { 
				return done(null, false, { message: 'Unknown user ' + username }); 
			}
			if (user.password != password) { 
				return done(null, false, { message: 'Invalid password' }); 
			}
			return done(null, user);
		})
	}
));

var users = [{
	id: 1,
	username: 'bob',
	password: 'secret',
	email: 'bob@example.com'
},{
	id: 2,
	username: 'joe',
	password: 'birthday',
	email: 'joe@example.com'
}];

var findById = function(id, fn) {
	var idx = id - 1;
	if (users[idx]) {
		fn(null, users[idx]);
	} else {
		fn(new Error('User ' + id + ' does not exist'));
	}
}

var findByUsername = function(username, fn) {
	for (var i = 0, len = users.length; i < len; i++) {
		var user = users[i];
		if (user.username === username) {
			return fn(null, user);
		}
	}
	return fn(null, null);
}

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	findById(id, function (err, user) {
		done(err, user);
	});
});

app.configure(function() {
	app.use(express.static('public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'keyboard cat' }));
	app.use(flash());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

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
			if(folders != null && folders.length > 0) {
				console.log(folders);
				res.send(folders);
				// res.status(409);
			}
			else {
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

app.get('/',function(req, res){
	if(!req.user){
		res.write("User is not logged in yet");
	}
	else{
		res.write("Welcome" + " " + req.user.username);
	}
	res.end();
});

app.get('/login', function(req, res){
	res.sendfile(__dirname+'/login.html');
});

app.post('/login',
	passport.authenticate('local', { successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true }
	)
);

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
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
		files: {
			uploadContent: {
			  path: "contents/algebra_one.txt"	
			}, 
			uploadPath : "math/algebra",
			fileName: "session-1.txt"
		}
		

	} 
};

// app.post('/upload', function(req, res) {
// 	var subjectMatter = requestFile.content.subjectMatter;
// 	var promise = mkdirUtil("contents/" + requestFile.content.path, function(err){
// 		if(err) {
// 			console.log("Error creating Directory Structure");
// 		} else {
// 			var fileUploader = fileUpload.createFileUpload("contents/"+ requestFile.content.path);
// 			fileUploader.put(subjectMatter,function(err, file){
// 				if(err) {
// 					console.log("Error captured during Upload Content " + err);
// 				}
// 				res.send(file);
// 			});
// 		}
// 	});
// });

 app.post('/upload', function(req, res){
    /* Assuming File Upload request would be specified from a form which would have a field uploadContent */
    fs.readFile(requestFile.content.files.uploadContent.path, function(err, data){
    	if(err) {
    		console.log("Error reading contents of file " + err);
    	}
    	else{
        	var promise = mkdirUtil("contents/" + requestFile.content.files.uploadPath, function(err){
            if(err) {
        			console.log("Error creating Directory Structure");
        	} 
        	else {
        		    fileLocation=  __dirname+ "/contents/" + requestFile.content.files.uploadPath + "/" + requestFile.content.files.fileName
                    fs.writeFile(fileLocation , data, function(error){
            	     if(error) { console.log("Error writing File  "+ data + "*****" + error );}
            	     else {
                      res.send("Successfully saved the file @ "+requestFile.content.files.uploadPath);}
                 });
            }});
        } 	
    }); 
 });

app.listen(8080);
