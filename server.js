//server.js
const express = require('express');
const app = express();

//set view engine to ejs
app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//use res.render to load up an ejs view file

//index page
app.get("/", (req,res) =>{
  res.end("Hello!\n");
});

//urls page
app.get('/urls', (req, res) =>{
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//about page
app.get('/about', (req, res) => {
  res.render('pages/about');
});

app.listen(8080);
console.log('8080 is the magic port');