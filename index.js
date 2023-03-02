
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from "express";
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from "path";
import bodyParser from "body-parser";

// File path
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db/db.json')

// Configure lowdb to write to JSONFile
const adapter = new JSONFile(file)
const db = new Low(adapter)
await db.read()

// Initial dummy data
let defaultUsers = [
  { 
    id: 0,
    password: "12345",
    email: "ab@gmail.com",
    balance: 500
  },
  { 
    id: 1,
    password: "John Doe",
    email: "dfdf@gmail.com",
    balance: 0
  },
  { 
    id: 2,
    password: "Denzel Washington",
    email: "dfdf@gmail.com",
    balance: 10
  },
];

db.data = db.data || { users: defaultUsers };
let app = express();
//var bodyParser = require("body-parser");
const srcPath = __dirname;

app.set('view engine', 'ejs');
const viewsPath = path.join(__dirname, './views') 
app.set('views', viewsPath)

// Using `public` for static files: http://expressjs.com/en/starter/static-files.html
app.use(express.static(path.join(srcPath, "views")));
// Use bodyParser to parse application/x-www-form-urlencoded form data
app.use(bodyParser.urlencoded({extended: false}));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

let currentUser = undefined;

app.get("/", function (req, res) {
  res.render("index", { error: false });
});

//Handling user login
app.post("/info", async function(req, res){
  try {
      // check if the user exists
      const users = await db.data.users;
      const user = users.find(user => user.email === req.body.email);

      if (user) {
        // check if password matches
        currentUser = user;
        const result = req.body.password === user.password;
        if (result) {
          res.render("user", { user: user });
        } else {
          res.status(400).json({ error: "Password doesn't match" });
        }
      } else {
        res.status(400).render("index", { error: "User doesn't exist" });
        //res.status(400).json({ error: "User doesn't exist" });
      }
    } catch (error) {
      res.status(400).render("index", { error: "Try again later" });
      //res.status(400).json({ error });
    }
});

//Handling info update
app.post("/save", async function(req, res){
  try {
      // Edit & save user info
      const email = req.body.email;
      const password = req.body.password;
      const balance = req.body.balance;
      let users = await db.data.users;
      users = users.map(user => {
        if (user.email === currentUser.email) {
          return ({ email: email, password: password, balance: balance, id: user.id });
        }
        return user;
      });

      db.data = { users: users }
      db.write()
      const user = users.find(user => user.email === email);
      res.render("user", {user: user});
      
    } catch (error) {
      res.status(400).json({ error });
    }
});

// Logout user
app.get("/logout", function (req, res) {
  currentUser = null;
  res.redirect("/");
});

var listener = app.listen(3030, function () {
  console.log("Listening on port " + listener.address().port);
});
