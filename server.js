// server.js

// set up ======================================================================
// set up express
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;

// gather all the modules
var bodyParser      = require('body-parser');
var cookieParser    = require('cookie-parser');
var fs              = require('fs');
var helmet          = require('helmet');
var morgan          = require('morgan');
var passport        = require('passport');
var session         = require('express-session');


// import other files
var passportConfig  = require('./config/passport');
var cert = fs.readFileSync('./cert/wso2/openssl-certwso2.pem', 'utf8'); // this validates the response coming back
var privateCert = fs.readFileSync('./cert/wso2/private-key.pem', 'utf8'); // this signs the response being sent
var decryptionPvk = fs.readFileSync('./cert/generated/key.pem', 'utf8'); // this is to decrypt the assertion (not encrypting it on wso2 rn)

var nodeProfile = null; // variable to store node profile

// set up the modules
app.use(helmet()); // set helmet on for security
app.use(morgan('dev')); // log every request to the console in "dev" mode

// allow app to get information from html forms
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

// session security stuff
app.use(session({
    secret: passportConfig.SESSION_SECRET,
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

// content to display on webapp
app.use(express.static(__dirname + '/public'));

// passport config
var SamlStrategy = require('passport-saml').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

var samlStrategy = new SamlStrategy({
    //callbackUrl: passportConfig.CALLBACK_URL, // this supersedes 'path'
    path: passportConfig.PATH, // the callback path
    protocol: 'http://',
    host: passportConfig.HOST,
    entryPoint: passportConfig.ENTRY_POINT, // the sso path
    issuer: passportConfig.ISSUER, // the SP's SAML issuer name
    cert: cert, // if this cert is present it will use it to validate the SAML response that comes back
    privateCert: privateCert, // this cert is use to sign the SAML request thats going
    //decryptionPvk: decryptionPvk, // this is the ley used to decrypt the assertion coming back, not used rn
    identifierFormat: passportConfig.NAME_ID_FORMAT, // NameID format
    attributeConsumingServiceIndex: passportConfig.ACS_INDEX, // ACS ID
    logoutUrl: passportConfig.LOGOUT_URL, // SLO url
    logoutCallbackUrl: passportConfig.LOGOUT_CALLBACK // url to callback to after logout
}, function(profile, done) {
    nodeProfile = profile;
    console.log('Profile: ' +  JSON.stringify(nodeProfile, null, 4));
    return done(null, profile);
});

passport.use(samlStrategy);

app.use(passport.initialize());
app.use(passport.session());

// launch ======================================================================
app.listen(port);
console.log('Welcome to the SAML app on port ' + port);

// routes ======================================================================
require('./app/routes.js')(app, passport, samlStrategy); // load our routes and pass in our app and fully configured passport