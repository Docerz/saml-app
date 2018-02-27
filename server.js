// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;

var helmet       = require('helmet')
var morgan       = require('morgan');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// set up our express application
app.use(helmet()); // do security stuff
app.use(morgan('dev')); // log every request to the console

// get information from html forms
app.use(bodyParser.urlencoded({
  extended: true
}));

// session security stuff
app.use(session({
    secret: 'docers',
    name: 'sessionId',
    resave: true,
    saveUninitialized: true,
    cookie: {
        //secure: true,
        httpOnly: true,
        //domain: 'example.com',
        //path: 'foo/bar',
        maxAge: 30 * 60 * 1000 // 30 minutes
    },
    rolling: true
}));

// content
app.use(express.static(__dirname + '/public'));

// routes ======================================================================
require('./app/routes.js')(app); // load our routes and pass in our app and fully configured passport


// launch ======================================================================
app.listen(port);
console.log('Welcome to the SAML Docer on port ' + port);