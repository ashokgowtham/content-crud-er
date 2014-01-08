var express = require('express');
var path = require('path');

var app = express();

app.configure(function() {
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
});

app.get('/', function(req, res){
  res.redirect('/index');
});

app.get('/index', function(req, res){
  res.render('index');
});

app.listen(3000);
