var path = require("path");

// app/routes.js
module.exports = function(app, passport, samlStrategy) {
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
        if (req.user === null) {
            return res.redirect('/');
        }
        return samlStrategy.logout(req, function (err, uri) {
            return res.redirect(uri);
        });
    });

    // HOME page (once authenticated only), different based on role (admin vs normal)
    app.get('/home', ensureAuthenticated,
        function (req, res) {
            if (req.user["http://wso2.org/claims/role"].indexOf('admin') > 0) {
                return res.sendFile(path.join(__dirname + '/../views/admin.html'));
            } else {
                return res.sendFile(path.join(__dirname + '/../views/normal.html'));
            }
        }
    );

    // METADATA handler
    app.get('/Metadata',
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