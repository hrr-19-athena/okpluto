'use strict';

var express = require('express');
const morgan = require('morgan');
var app = express();
var bodyParser = require('body-parser');
var id = require('./config/auth0')
var auth0ID = process.env.AUTH0_CLIENT_ID || id.auth0.AUTH0_CLIENT_ID;
console.log('auth id is ', auth0ID);

// setting port
var port = process.env.PORT || 8080;


// config files
var db = require('./config/db');

// serving static files
app.use(morgan('combined'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Route queries searches for db
app.use((req, res, next) => {
  if (req.query.dbId) {
    if (req.path === '/api/users') {
      req.url = '/query/dbId';
    } else if (req.path === '/api/events') {
      req.url = '/queryEvents/dbId'
    }
  }
  next();
})

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));

app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));

//need to protect this route
app.get('/env', function(req, res){
  res.end(auth0ID);
});

// routes
require('./app/routes/routes')(app)

app.listen(port, function() {
	console.log('server running! :)');
})


exports = module.exports = app; // expose our app