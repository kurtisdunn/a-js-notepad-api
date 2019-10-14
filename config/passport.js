import {Knex} from './persistence';
import colors from 'colors';
import fetch from 'node-fetch';

const LocalStrategy = require('passport-local').Strategy;

// const FacebookStrategy = require('passport-facebook').Strategy;
// const TwitterStrategy = require('passport-twitter').Strategy;


// const auth = {
//   'facebookAuth' : {
//       'clientID'      : '1757613154557378', // your App ID
//       'clientSecret'  : 'bd2ff4ff09a2128a2994e915d0aca705', // your App Secret
//       'callbackURL'   : 'http://localhost:3000/auth/facebook/callback'
//   },
//
//   'twitterAuth' : {
//     'consumerKey'       : 'y4uzej4L67J7suIPvwPDA8f3p',
//     'consumerSecret'    : 'cZ94uK7uki7Rw797DFkcSwJE0Vh5hEPw0CX6BfKKOduPD5liR8',
//     'callbackURL'       : 'http://127.0.0.1:3000/auth/twitter/callback'
//   },
//
//   'googleAuth' : {
//       'clientID'      : 'your-secret-clientID-here',
//       'clientSecret'  : 'your-client-secret-here',
//       'callbackURL'   : 'http://localhost:8080/auth/google/callback'
//   },
//   'instaAuth' : {
//       'clientID'      : '05e18515cb5644c8b7895e092465402d',
//       'clientSecret'  : '6f0f675198ec4751ba3beee9997475b'
//   }
// };


export default function (passport){

    passport.serializeUser(function(user, done) {
      if ('profileUrl' in user){
        fetch(`https://graph.facebook.com/${user.id}/picture?type=large`, { headers: { 'Content-Type': 'text/html' } })
          .then(function(res) {
            user.thumbnail = res.url;
            console.log(colors.black.bold.bgWhite(JSON.stringify(user, null, 2)));
            return done(null, user);
          }).catch(err => console.log(colors.white.bold('Error: '), colors.red.bold(err)));
      } else {
        console.log(colors.black.bold.bgWhite(JSON.stringify(user, null, 2)));
        return done(null, user);
      }
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        return done(null, id);
      });


 // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    // passport.use('local-signup', new LocalStrategy({
    //     // by default, local strategy uses username and password, we will override with email
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true // allows us to pass back the entire request to the callback
    // }, function(req, email, password, done) {
    //
		// // find a user whose email is the same as the forms email
		// // we are checking to see if the user trying to login already exists
    //
    // Knex('users').where('email', email).then((err,rows) => {
    //   console.log(test);
    // });
    //
    //
    //     connection.query("select * from users where email = '"+email+"'",function(err,rows){
		// 	console.log(rows);
		// 	console.log("above row object");
		// 	if (err)
    //             return done(err);
		// 	 if (rows.length) {
    //             return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
    //         } else {
    //
		// 		// if there is no user with that email
    //             // create the user
    //             var newUserMysql = new Object();
    //
		// 		newUserMysql.email    = email;
    //             newUserMysql.password = password; // use the generateHash function in our user model
    //
		// 		var insertQuery = "INSERT INTO users ( email, password ) values ('" + email +"','"+ password +"')";
		// 			console.log(insertQuery);
		// 		connection.query(insertQuery,function(err,rows){
		// 		newUserMysql.id = rows.insertId;
    //
		// 		return done(null, newUserMysql);
		// 		});
    //         }
		// });
    // }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================

    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    }, function(req, email, password, done) {
      Knex('users').where('username', email)
        .then(rows => {

          if (!rows.length) { return done(null, false, { message: 'No user found.' }); }
          if (!( rows[0].password == password)){
              console.log(rows[0]);
            return done(null, false, { message: 'Oops! Wrong password.' });
          }
          return done(null, rows[0]);
        })
        .catch((err) => {
          req.flash('error');
          return done(err);
        });
    }));

//     // =========================================================================
//     // FACEBOOK LOGIN =============================================================
//     // =========================================================================
//
//   passport.use('facebook', new FacebookStrategy({
//     clientID: auth.facebookAuth.clientID,
//     clientSecret: auth.facebookAuth.clientSecret,
//     callbackURL: 'http://localhost:3000/auth/facebook/callback'
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     knex('users').where('facebook', profile.id).then(rsp => {
//       if(rsp.length === 0){
//         return knex('users').insert({
//           email: 'facebook',
//           name: profile.displayName,
//           password:'facebook',
//           facebook: profile.id,
//           thumb: profile.thumbnail
//         }).then(r => cb(null, profile))
//         .catch(err => console.log(colors.white.bold('Error: '), colors.red.bold(err)));
//       }
//       return cb(null, profile);
//     });
//
//   }
// ));
//
//
// // =========================================================================
// // Twitter LOGIN =============================================================
// // =========================================================================
//
// passport.use('twitter', new TwitterStrategy({
//     consumerKey: auth.twitterAuth.consumerKey,
//     consumerSecret: auth.twitterAuth.consumerSecret,
//     callbackURL: 'http://localhost:3000/auth/twitter/callback'
//   },
//   function(token, tokenSecret, profile, cb) {
//     knex('users').where('twitter', profile.id).then(rsp => {
//       if(rsp.length === 0){
//         return knex('users').insert({
//          email: 'twitter',
//          name: profile.displayName,
//          password:'twitter',
//          twitter: profile.id,
//          thumb: profile._json.profile_image_url
//        }).then(r => cb(null, profile))
//        .catch(err => console.log(err));
//       }
//       return cb(null, profile);
//     });
//   }
// ));


return passport;

}
