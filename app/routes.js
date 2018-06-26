var path        = require("path");
var handlebars  = require('handlebars');
var fs          = require('fs');

// app/routes.js
module.exports = function(app, passport, samlStrategy, cert) {
    // LANDING page (with the login link)
    app.get('/', function (req, res) {
        if (req.isAuthenticated()) { // if auth then redir to home, otherwise go to index page
            res.redirect('/home');
        } else {
            res.sendFile(path.join(__dirname + '/../views/index.html'));
        }
    });

    // LOGIN for passport
    app.get('/login',
        passport.authenticate('saml', {failureRedirect: '/login/fail'}),
        function (req, res) {
            res.redirect('/home');
        }
    );

    // CALLBACK for passport
    app.post('/login/callback',
        passport.authenticate('saml', {failureRedirect: '/login/fail'}),
        function (req, res) {
            res.redirect('/home');
        }
    );

    // CALLBACK for passport
    app.post('/logout/callback',
        passport.authenticate('saml', {failureRedirect: '/login/fail'}),
        function (req, res) {
            res.redirect('/');
        }
    );

    // LOGIN FAIL handler for passport
    app.get('/login/fail',
        function (req, res) {
            res.status(401).send('Login failed');
        }
    );


    // LOGOUT (truncate session, and redirect to landing page)
    app.get('/logout', function (req, res) {
        if (!req.user) {
            return res.redirect('/');
        }
        return samlStrategy.logout(req, function (err, uri) {
            return res.redirect(uri);
        });
    });

    // HOME page (once authenticated only), display username, organization, and roles
    app.get('/home', ensureAuthenticated,
        function (req, res) {
            var data = { // stores all the data for handlebars to use
                username: req.user.nameID,
                organization: req.user['http://wso2.org/claims/organization'],
                roles: req.user['http://wso2.org/claims/role']
            };

            // read the html file apply the handlebar substitutions to it
            fs.readFile(path.join(__dirname + '/../views/home.html'), 'utf-8', function(error, source) {
                // helper method that will take a "certain string" and make it "Capital Case"
                handlebars.registerHelper('capital_case', function (sentence) {
                    var words = sentence.split(' '); // split on spaces
                    for (var i = 0; i < words.length; i++) { // loop through each word
                        words[i] = words[i][0].toUpperCase() + words[i].substr(1); // upper case it
                    }
                    sentence = words.join(' '); // join into string again
                    return sentence;
                });

                var template = handlebars.compile(source); // compile handlebar substitution into a function
                var html = template(data); // execute function

                res.send(html); // render page
            });
        }
    );

    // METADATA handler
    app.get('/metadata',
        function (req, res) {
            res.type('application/xml');
            res.status(200).send(samlStrategy.generateServiceProviderMetadata(cert));
        }
    );

    // ERROR handler
    app.use(function (err, req, res, next) {
        console.log("Fatal error: " + JSON.stringify(err));
        next(err);
    });
};

// AUTH function
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        return res.redirect('/login');
}