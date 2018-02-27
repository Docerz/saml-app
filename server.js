// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.use(session({
    secret: 'docers',
    name: 'sessionId'
})); // session secret

// content
app.use(express.static(__dirname + '/public'));

// routes ======================================================================
require('./app/routes.js')(app); // load our routes and pass in our app and fully configured passport


// launch ======================================================================
app.listen(port);
console.log('Welcome to the SAML Docer on port ' + port);