//server.js
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//bcrypt
const bcrypt = require('bcrypt');

//static file directory
app.use( express.static("public"));

//allows us to access POST request parameters
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//set view engine to ejs
app.set('view engine', 'ejs');

//our list of URLS
const urlDatabase = {

};

// users list
const users = {

};

//index page
app.get("/", (req,res) =>{
  console.log('Cookies:', req.cookies);
  res.end("Hello!\n");
});

//user function
function urlsForUser(id){
  let obj = {}
  for (let i in urlDatabase){
    if (id === urlDatabase[i].userID){
      obj[i] = urlDatabase[i].longURL;
    }
  }
  return obj;
}

//urls page
app.get('/urls', (req, res) =>{
  if (req.cookies.user_id){
    let templateVars = { urls: urlsForUser(req.cookies.user_id),
      user: users[req.cookies.user_id]
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login")
  }
});

//add urls page
app.get('/urls/new', (req, res) => {
  if (!req.cookies.user_id){
    res.redirect("/login")
  } else {
    let templateVars = {
     user: users[req.cookies.user_id]
    };
    res.render('urls_new', templateVars);
  }
});

//handle logout POST
app.post("/logout", (req, res) => {
  console.log(`User logged out from ${req.cookies['user_id']}`);
  res.clearCookie('user_id');
  res.redirect("/urls");
});

//add urls POST
app.post('/urls', (req, res) => {
  console.log(`User ${req.cookies.user_id} created a new url`)
  let id = generateRandomString()
  urlDatabase[id] = {longURL: req.body.longURL,
    userID: req.cookies.user_id}
  let templateVars = { shortURL: id,
    longURL: req.body.longURL,
    user: users[req.cookies.user_id]
    };
    //redirect to id's page
  res.render('urls_show', templateVars);
});

//handle login POST
app.post('/login', (req, res) => {
  if (req.body.email != "" || req.body.password != ""){
  console.log(`User ${req.body.email} is attempting to log in`);
  }
  for (let i in users){
    if (req.body.email === users[i].email){
      if(bcrypt.compareSync(req.body.password, users[i].password)){
        res.cookie("user_id", i);
        res.redirect('/')
      }
      else {
        res.status(403).send("wrong password!")
      }
    }
  }
   res.status(403).send("wrong email!")
});

//handle login page GET
app.get("/login", (req, res) => {
  res.render("login")
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
  if (!urlDatabase[req.params.id]){
    res.redirect("/404")
  } else {
    if (urlDatabase[req.params.id].userID === req.cookies.user_id){
      let templateVars = { shortURL: req.params.id,
       longURL: urlDatabase[req.params.id].longURL,
       user: users[req.cookies.user_id]};
      res.render("urls_show", templateVars);
    } else {
      res.redirect('/login');
    }
  }
});

//delete URL resource
app.post('/urls/:id/delete', (req, res) =>{
  if (urlDatabase[req.params.id]['userID'] === req.cookies.user_id){
    delete urlDatabase[req.params.id];
    res.redirect('/urls')
  } else{
    res.redirect('/login')
  }
});

//modify URL resource
app.post('/urls/:id/update', (req, res) =>{
  urlDatabase[req.params.id] = req.body.url;
  res.redirect(`/urls/${req.params.id}`);
});

//redirect short links
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL == undefined) {
    console.log("Client entered an incorrect shortURL")
    res.send("You entered an incorrect shortURL!\n")
  } else {console.log(`Redirected client to: ${longURL}`)
  res.redirect(longURL);
  }
});

//registration page
app.get("/register", (req, res) =>{
  res.render("register")
})

//registration POST
app.post('/register', (req, res) =>{
  //if email or password is empty return error 400
  if (req.body.email == "" || req.body.password == ""){
    res.status(400).send("You need to fill both those fields!")
  } else {
    //if email already registered return error 400
  for (let i in users){
    if (users[i].email === req.body.email){
      res.status(400).end("Email already registered!")
    }
  }
  //else create user
  let password = req.body.password; // you will probably this from req.params
  let hashed_password = bcrypt.hashSync(password, 10);
  let user = {id: generateRandomString(),
    email: req.body.email,
    password: hashed_password
  };
  console.log(password)
  console.log(user.password)
  users[user.id] = user;
  res.cookie('user_id', user.id);
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