//server.js
const express = require('express');
const app = express();

//static file directory
app.use( express.static("public"));

//allows us to access POST request parameters
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

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

//add urls page
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

//add urls POST
app.post('/urls', (req, res) => {
  console.log(req.body)
  let id = generateRandomString()
  urlDatabase[id] = req.body.longURL
  let templateVars = { shortURL: id,
    longURL: req.body.longURL};
    //redirect to id's page
  res.render('urls_show', templateVars);
});

//generate random String Function
function generateRandomString(){
  let randomStr = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
  };
  return randomStr;
};

//single url page
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
  longURL: urlDatabase[req.params.id] };
  res.redirect("urls_show", templateVars);
});

//redirect short links
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL == undefined) {
    console.log("Client entered an incorrect shortURL")
    res.send("You entered an incorrect shortURL!\n")
  } else {console.log(`Redirected client to: ${longURL}`)
  res.redirect(longURL);
  }
});

//custom 404 page
app.use((req, res, next) =>{
  res.status(404);
  res.format({
    html: function(){
      res.render('404', {url: req.url})
    }
  })
  console.log("User requested a page which does not exist");
});

app.listen(8080);
console.log('8080 is the magic port');