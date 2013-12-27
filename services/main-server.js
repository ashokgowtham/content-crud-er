
var express = require('express');
var findit = require('findit');

var app = express();

var properties = {
	contentsFolder: "contents"
};


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

})

app.listen(3000);
