require('dotenv').config()

const express = require("express")

const mongoose = require("mongoose")

const ejs = require("ejs")

const bodyParser = require("body-parser")

const app = express()

const encrypt = require("mongoose-encryption")

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

app.set("view engine", "ejs")

app.use(express.static("public"))

app.use(bodyParser.urlencoded({extended: true}))

console.log(process.env.API_KEY)

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})



userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]})

const User = mongoose.model("User", userSchema)



app.get("/", (req,res) => {
    res.render("home")
})

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.post("/register", (req,res) => {
    User.create({email: req.body.username, password: req.body.password}).then((cre) => {
        res.render("secrets")
    })
})

app.post("/login", (req,res) => {
    const user = req.body.username
    const password = req.body.password

    User.findOne({email: user}).then((found) => {
        if(found.password === password){
            res.render("secrets")
        }else{
            console.log("Wrong credentials")
            res.redirect("login")
        }
    })
})










app.listen("3000", () => {
    console.log("Server started on port 3000")
})
