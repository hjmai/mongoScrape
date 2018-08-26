var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var PORT = process.env.PORT || 3000;
var app = express();

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

var exphbs = require("express-handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

var db = require('./models');

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/all", function(req, res) {
    db.Article.find({})
    .then(function(data){
        res.json(data);
    });
})

app.get("/test", function(req, res) {
    db.Article.create({
        title: "Hi",
        link: "https://www.google.com",
        summary: "Hello World"
    }).then(
        res.redirect("/")
    )
})

app.listen(PORT, function() {
  console.log("Listening on port:%s", PORT);
});