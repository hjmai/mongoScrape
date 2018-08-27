var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var PORT = process.env.PORT || 3000;
var app = express();
var cheerio = require("cheerio");
var request = require("request");

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
    db.Article.find({})
    .then(function(data){
        res.render("index", {data: data})
    })
});

app.get("/all", function(req, res) {
    db.Article.find({})
    .then(function(data){
        res.json(data);
    });
})

app.get("/scrape", function(req, res) {
    request("https://old.reddit.com/r/news/", function(error, response, html) {
        var $ = cheerio.load(html);
        $('a.title').each(function(i, element) {
            var results = {};
            results.title = $(element).text();
            results.link = $(element).attr("href");
            db.Article.create(results)
        });
    })
    res.render("scrape", {message: "Scrape complete"});
});

app.get("/clear", function(req, res) {
    db.Article.collection.drop()
    .then(function(dbArticles) {
        res.redirect("/");
    });
})

app.get("/saved", function(req, res) {
    db.Article.find({saved: true})
    .then(function(data) {
        res.render("saved", {data: data})
    })
})

app.put("/article/:id", function(req, res) {
    db.Article.findOneAndUpdate(
        {_id: req.params.id},
        {saved: true},
        {new: true}
    ).then(function(dbArticle){
        console.log(dbArticle);
    })
});

app.post("/article/:id", function(req, res) {
    console.log(req.body);
    db.Note.create(req.body)
    .then(function(dbNote) {
        return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
    })
});

app.get("/note/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
    .populate("note")
    .then(function(dbNote) {
        res.json(dbNote.note.body);
    })
})

app.listen(PORT, function() {
  console.log("Listening on port:%s", PORT);
});