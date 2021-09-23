require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function (req, res){
    res.render("home");
});

app.get('/login', function (req, res){
    res.render("login");
});

app.get('/register', function(req, res){
    res.render("register");
});

app.get('/secrets', function(req, res) {

    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/changepassword', function(req, res) {
    res.render('changepassword');
});

app.post('/changepassword', function(req, res) {

    User.findOne({ username: req.body.username },(err, user) => {
      // Check if error connecting
      if (err) {
        res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
             if(err) {
                      if(err.name === 'IncorrectPasswordError'){
                           res.send("<h1 class = 'container'> Incorrect Password!</h1>");
                           res.json({ success: false, message: 'Incorrect password' }); // Return error
                      }else {
                          res.send("<h1 class = 'container'> Something went wrong!! Please try again after sometimes.</h1>");
                          res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                      }
            } else {
              res.send("<h1 class = 'container'> Your password has been changed successfully! </h1>");
              res.json({ success: true, message: 'Your password has been changed successfully' });
             }
           })
        }
      }
    });   });

app.get('/logout', function(req, res) {

    req.logout();
    res.redirect('/');
});

app.post('/register', function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user) {
        
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }

    });

});

app.post('/login', function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.listen(3000, function(){
    console.log("Server started on Port 3000")
});