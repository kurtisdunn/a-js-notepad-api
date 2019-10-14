const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey  = fs.readFileSync('certs/privkey.pem', 'utf8');
const certificate = fs.readFileSync('certs/cert.pem', 'utf8');
const dbConfig = require('./config/database.config.js');
const User = require('./app/models/user.model.js')
const mongoose = require('mongoose');
const passport = require('passport');
const public = path.join(__dirname, 'public');
const credentials = {key: privateKey, cert: certificate};
const app = express();
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

mongoose.Promise = global.Promise;
mongoose.connect(dbConfig.url, {
	useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser());
// Express Session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());
app.use (function (req, res, next) {
  if (req.secure) {
		next();
  } else {
		res.redirect('https://' + req.headers.host + req.url);
  }
});
app.use('/', express.static(public));


app.get('/', function(req, res) {
    res.sendFile(path.join(public, 'index.html'));
});






httpServer.listen(80);
httpsServer.listen(443);

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
     	if(isMatch){
     	  return done(null, user);
     	} else {
     	  return done(null, false, {message: 'Invalid password'});
     	}
     });
   });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// Register User
app.post('/register', function(req, res){
  var password = req.body.password;
  var password2 = req.body.password2;

  if (password == password2){
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      res.send(user).end()
    });
  } else{
    res.status(500).send("{errors: \"Passwords don't match\"}").end()
  }
});

// // Endpoint to login
// app.post('/login',
//   passport.authenticate('local'),
//   function(req, res) {
//     res.json('success');
//   }
// );


app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (! user) {
      return res.status(401).json({ success : false, message : 'authentication failed' });
    }
    // ***********************************************************************
    // "Note that when using a custom callback, it becomes the application's
    // responsibility to establish a session (by calling req.login()) and send
    // a response."
    // Source: http://passportjs.org/docs
    // ***********************************************************************
    req.login(user, loginErr => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.status(200).json({ success : true, message : 'authentication succeeded' });
    });
  })(req, res, next);
});





// Endpoint to get current user
app.get('/user', function(req, res){
	if(!req.user) {
			return res.status(404).json({
					message: "User not found."
			});
	}
	return res.json(req.user);
});


// Endpoint to logout
app.get('/logout', function(req, res){
  req.logout();
  res.send(null)
});

require('./app/routes/note.routes.js')(app);
//
// // listen for requests
// app.listen(3000, () => {
//     console.log("Server is listening on port 3000");
// });
