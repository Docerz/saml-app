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
var path = require("path");

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
    logoutCallbackUrl: passportConfig.LOGOUT_CALLBACK // url to
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
// LANDING page (with the login link)
app.get('/', function(req, res) {
    if (req.isAuthenticated()) { // if auth then redir to home, otherwise go to index page
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname + '/views/index.html'));
    }
});

// LOGIN for passport
app.get('/login',
    passport.authenticate('saml', { failureRedirect: '/login/fail' }),
    function (req, res) {
        res.redirect('/home');
    }
);

// CALLBACK for passport
app.post('/login/callback',
    passport.authenticate('saml', { failureRedirect: '/login/fail' }),
    function(req, res) {
        res.redirect('/');
    }
);

// LOGIN FAIL handler for passport
app.get('/login/fail',
    function(req, res) {
        res.status(401).send('Login failed');
    }
);


// LOGOUT (truncate session, and redirect to landing page)
app.get('/logout', function(req, res) {
    if (req.user === null) {
        return res.redirect('/');
    }
    return samlStrategy.logout(req, function (err, uri) {
        nodeProfile = null;
        return res.redirect(uri);
    });
});

// HOME page (once authenticated only), different based on role (admin vs normal)
app.get('/home', ensureAuthenticated,
    function(req, res) {
        if (req.user["http://wso2.org/claims/role"].indexOf('admin') > 0) {
            return res.sendFile(path.join(__dirname + '/views/admin.html'));
        } else {
            return res.sendFile(path.join(__dirname + '/views/normal.html'));
        }
    }
);

// METADATA handler
app.get('/Metadata',
    function(req, res) {
        res.type('application/xml');
        res.status(200).send(samlStrategy.generateServiceProviderMetadata(cert));
    }
);

// ERROR handler
app.use(function(err, req, res, next) {
    console.log("Fatal error: " + JSON.stringify(err));
    next(err);
});

// AUTH function
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        return res.redirect('/login');
}