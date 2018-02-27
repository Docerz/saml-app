var path = require("path");

// app/routes.js
module.exports = function(app, passport) {


    // LANDING PAGE (with the login link)
    app.get('/', function(req, res) {
        if ('user' in req.session) {
            res.sendFile(path.join(__dirname + '/../views/home.html'));
        } else {
            res.sendFile(path.join(__dirname + '/../views/index.html'));
        }
    });


    // LOGIN PAGE (with email, password, login, cancel)
    app.get('/login', function(req, res) {
        res.sendFile(path.join(__dirname + '/../views/login.html')); 
    });


    // LOGIN FUNCTION (authenticates, sets session)
    app.post('/login', function(req, res){
        if ('user' in req.session) {
            req.session.destroy();
            return res.status(400).send('invalid request');
        }
    
        if (!req.body.username || !req.body.password) {
            return res.status(400).send('missing requirement');
        }
    
        var username = req.body.username.toLowerCase();
        var password = req.body.password;

        if (username === 'momos' && password === 'fro') {
            req.session.user = username;
            res.redirect('/home');
        } else {
            return res.status(403).send('incorrect credentials');
        }
    });


    // LOGOUT (truncate session, and redirect to landing page)
    app.get('/logout', function(req, res) {
        if (req.session.user) {
            req.session.destroy();
        }
    
        return res.redirect('/');
    });


    // HOME PAGE (once authenticated only)
    app.get('/home', function(req, res) {
        isLoggedIn(req, res, 'home.html')
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.session.user)
        return res.sendFile(path.join(__dirname + '/../views/' + next));

    // if they aren't redirect them to the home page
    res.redirect('/');
}