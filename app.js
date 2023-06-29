require('dotenv').config()


const express = require("express")

const mongoose = require("mongoose")

const session = require("express-session")

const passport = require("passport")

const GoogleStrategy = require('passport-google-oauth20').Strategy

const passportLocalMongoose = require("passport-local-mongoose")

const ejs = require("ejs")

const bodyParser = require("body-parser")

const app = express()

const encrypt = require("mongoose-encryption")
const { compareSync } = require('bcrypt')

const findOrCreate = require("mongoose-findorcreate")



app.set("view engine", "ejs")

app.use(express.static("public"))

app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: "Just some secrets",
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secrets: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]})

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req,res) => {
    res.render("home")
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
    passport.authenticate("google",{ failureRedirect:"/login" }),function(req,res)  {
    res.redirect("/secrets")
})

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.get("/secrets", (req,res) => {
    User.find({"secrets" : {$ne: null}}).then((found) => {
        res.render("secrets", {usersecrets: found})
    })
})

app.get("/submit",(req,res) => {
    if(req.isAuthenticated()){
        res.render("submit")
       
    }else{
     
        res.redirect("/login")
    }
})

app.post("/register", (req,res) => {
    
    User.register({username: req.body.username} , req.body.password, function(err,user) {
        if(err){
            console.log(err)
            res.redirect("/register")
        }else {
            passport.authenticate("local")(req,res,() =>{
                res.redirect("/secrets")
            })
                
            }
        })
    })

app.post("/login", passport.authenticate("local"), function(req,res) {
    res.redirect("/secrets")
})
  
app.get("/logout" ,(req,res) => {
    req.logOut((err) => {
        if(err){
            return next(err)
        }else{
            res.redirect("/")
        }
    })
})


app.post("/submit", (req,res) => {
    const submittedSecret = req.body.secret
    User.findById(req.user.id).then((found) => {
        found.secrets = submittedSecret
        found.save()
        res.redirect("/secrets")
    })
})










app.listen("3000", () => {
    console.log("Server started on port 3000")
})
