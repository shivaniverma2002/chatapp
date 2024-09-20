import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import { Server } from 'socket.io';
import {createServer} from "http";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));


// express server setup
const app = express();
const port = 3000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000/",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const saltRounds = 10;

// databse setup 

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ChatApp",
  password: "0923",
  port: 5432,
});

db.connect();

// body-parser

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("images"));
app.use(express.static("socket.io.js"));

// routing setup for homePage
app.get("/", (req, res) => {
  res.render("home.ejs");
});

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log('a user ID', socket.id);
  socket.emit("welcome", `welcome to the server,${socket.id}`);
  socket.on('message', (msg) => {
  socket.broadcast.emit('message', msg);

   socket.on("send-notification", function(msg){
    socket.broadcast.emit("new-notification", msg);
   });

});
  });




// routing setup for loginPage
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// routing setup for registerPage
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// app.get("/chat", (req, res) => {
//   res.render("chatpage.ejs");
// });



app.post("/register", async (req, res) => {
  
  // getting the data from input fields 

  const name = req.body.Name;
  const username = req.body.email;
  const password = req.body.password;

  
  // checking if the user already exists in our database
  const emailExist = await db.query("SELECT * FROM chatapptable WHERE email = $1", [username]);
 try {
  if(emailExist.rows.length > 0) {
    res.send("email already exists, try another one");
  } else {
  // inserting the data to the database
  // password hashing 💀
     bcrypt.hash(password, saltRounds, async (err, hash) => {
      if(err) {
        console.log("error hashing passwords: ", err);
      } else {

      const result =  await db.query("INSERT INTO chatapptable (name, email, password) VALUES ($1, $2, $3)", [name, username, hash]);
      
      } 
    });

  }  
}catch (err) {
  console.log(err);
};

  console.log(username);
  console.log(password);
});

app.post("/login", async (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  const loginPassword = req.body.password;

  //   res.render("chatpage.ejs", {
  //   name,
  // });

  try {
    const result = await db.query("SELECT * FROM chatapptable WHERE email = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
       
      bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
        if(err){
          console.log("error compararing passwords: ", err);
        } else{
          if (result) {
            res.render("chatpage.ejs", {
              name,
            });
          } else{
            res.send("Incorrect Password");
          }
        }
      });
     
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});





