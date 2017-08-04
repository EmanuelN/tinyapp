//server.js
const express = require('express');
const app = express();
const methodOverride = require('method-override');
const cookieParser = require('cookie-session');
app.use(cookieParser({
  name: 'session',
  keys: ['gdionasgionads', 'gnuiadngiudndn'],

  // Cookie Options
  maxAge: 1 * 60 * 60 * 1000 // 1 hour
}));

//bcrypt
const bcrypt = require('bcrypt');

//static file directory
app.use( express.static("public"));

//allows us to access POST request parameters
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//set view engine to ejs
app.set('view engine', 'ejs');

//methodOverride
app.use(methodOverride('_method'));


//our list of URLS
const urlDatabase = {};

// users list
const users = {};

//today's date generator
const today = new Date();
const day = today.getUTCDate();
const month = today.getUTCMonth();
const year = today.getUTCFullYear();
const date = `${month+1}/${day}/${year}`

//root directory
app.get("/", (req,res) =>{
  if (req.session.user_id){
    res.redirect('/urls');
  } else{
    res.redirect('/login')
  }
});

//user function
function urlsForUser(id){
  let obj = {}
  for (let i in urlDatabase){
    if (id === urlDatabase[i].userID){
      obj[i] = urlDatabase[i];
    }
  }
  return obj;
}

//urls page
app.get('/urls', (req, res) =>{
  if (req.session.user_id){
    let templateVars = { urls: urlsForUser(req.session.user_id),
      user: users[req.session.user_id]
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/please")
  }
});

//Please login page
app.get("/please", (req, res)=>{
  res.render('please')
})
//add urls page
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id){
    res.redirect("/login")
  } else {
    let templateVars = {
     user: users[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  }
});

//handle logout POST
app.post("/logout", (req, res) => {
  console.log(`User logged out from ${req.session['user_id']}`);
  req.session.user_id = "";
  res.redirect("/urls");
});

//check if longURL already exists
function checkURL(url, obj){
  for (let key in obj){
    if (url === obj[key].longURL){
      return true;
    }
  }
  return false;
};

//add urls POST
app.post('/urls', (req, res) => {
  if (!req.session.user_id){
    res.end("<html><body>You must be logged in to use this feature</body></html>")
  } else if (checkURL(req.body.longURL, urlDatabase)){
    res.redirect("/urls");
  } else {
    let id = generateRandomString()
    urlDatabase[id] = {longURL: req.body.longURL,
      userID: req.session.user_id,
      date: date,
      clicks: 0,
      uniqueClicks: []
    };
    console.log(`User ${req.session.user_id} created a new url`)
    let templateVars = { shortURL: id,
      longURL: req.body.longURL,
      user: users[req.session.user_id],
      date: urlDatabase[id].date,
      clicks: urlDatabase[id].clicks,
      uniqueClicks: urlDatabase[id].uniqueClicks.length
      };
      //redirect to id's page
    res.render('urls_show', templateVars);
  }
});

//handle login POST
app.post('/login', (req, res) => {
  if (req.body.email != "" || req.body.password != ""){
  console.log(`Login attempt by ${req.body.email}`);
  }
  for (let i in users){
    if (req.body.email === users[i].email){
      if(bcrypt.compareSync(req.body.password, users[i].password)){
        req.session.user_id = i;
        res.redirect('/urls')
      }
    }
  }
   res.status(403).end("<html><body>Email and/or password are incorrect</body></html>")
});

//handle login page GET
app.get("/login", (req, res) => {
  if (!req.session.user_id){
    res.render("login")
  } else{
    res.redirect('/urls')
  }
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

//single url page with 404 functionality
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id){
    res.redirect("/please");
  } else if (!urlDatabase[req.params.id]){
    res.end("<html><body>This short URL does not exist</body></html>");
  } else {
    if (urlDatabase[req.params.id].userID === req.session.user_id){
      let templateVars = { shortURL: req.params.id,
        longURL: urlDatabase[req.params.id].longURL,
        user: users[req.session.user_id],
        date: urlDatabase[req.params.id].date,
        clicks: urlDatabase[req.params.id].clicks,
        uniqueClicks: urlDatabase[req.params.id].uniqueClicks.length};
      res.render("urls_show", templateVars);
    } else {
      res.end('<html><body>You do not own this shortURL</body></html>');
    }
  }
});

//delete URL resource
app.delete('/urls/:id', (req, res) =>{
  if (!req.session.user_id){
    res.redirect('/please');
  } else if (urlDatabase[req.params.id]['userID'] === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect('/urls')
  } else{
    res.redirect('<html><body>You do not own this URL and cannot delete it</body></html>')
  }
});

//modify URL resource
app.put('/urls/:id', (req, res) =>{
  if (!req.session.user_id){
    res.redirect('please');
  } else if (urlDatabase[req.params.id].userID === req.session.user_id){
    urlDatabase[req.params.id].longURL = req.body.url;
    res.redirect(`/urls`);
  } else {
    res.end("<html><body>You do not own this URL and cannot modify it</body></html>")
  }
});
//check if user_id already present in uniqueClicks
function checkUser(userID, array){
  if (array.length === 0){
    return true
  }
  for (let i in array){
    if (array[i] === userID){
      return false;
    } else {
      return true;
    }
  }
};

//redirect short links
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]){
    console.log("Client entered an incorrect shortURL")
    res.send("<html><body>You entered an incorrect shortURL.</body></html>")
  }
  else {
    let uniqueArr = urlDatabase[req.params.shortURL].uniqueClicks;
    urlDatabase[req.params.shortURL].clicks ++;
    if (req.session.user_id){
      console.log(`${req.session.user_id} is trying to access ${req.params.shortURL}`);
      if (checkUser(req.session.user_id, uniqueArr)){
        urlDatabase[req.params.shortURL].uniqueClicks.push(req.session.user_id)
      }
    }
    let longURL = urlDatabase[req.params.shortURL].longURL;
    console.log(`Redirected client to: ${longURL}`)
    res.redirect(longURL);
  }
});

//registration page
app.get("/register", (req, res) =>{
  if (!req.session.user_id){
    res.render("register");
  } else {
    res.redirect('/urls');
  }
});

//registration POST
app.post('/register', (req, res) =>{
  //if email or password is empty return error 400
  if (req.body.email == "" || req.body.password == ""){
    res.status(400).send("<html><body>Please fill in both fields</body></html>")
  } else {
    //if email already registered return error 400
  for (let i in users){
    if (users[i].email === req.body.email){
      res.status(400).end("Email has already been registered")
    }
  }
  //else create user
  let password = req.body.password; // you will probably this from req.params
  let hashed_password = bcrypt.hashSync(password, 10);
  let user = {id: generateRandomString(),
    email: req.body.email,
    password: hashed_password
  };
  users[user.id] = user;
  req.session.user_id = user.id;
  res.redirect('/urls');
  }
});

//404 render
app.get("/404", (req, res) => {
  res.render('404');
});

//custom 404 page redirect
app.use((req, res, next) =>{
  console.log(`Client requested ${req.url}, giving them 404`)
  res.redirect('/404')
});

app.listen(8080);
console.log('8080 is the magic port');