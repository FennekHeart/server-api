const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const passportHTTP = require('passport-http');
const app = express();
const port = 4000;
const db = require('./db')
const router = express.Router();

app.use(cors({
  origin: ['http://52.91.107.120:4000'],
  credentials: true
}));
app.use(bodyParser.json());

app.get('/chargers', (req, res) => {
  db.query('SELECT * FROM chargers').then(results => {
    res.json({ chargers: results})
  });
})

app.get('/getstation', (req, res) => {
  console.log(req.body.id)
  res.send(req.body)
})

/*app.post('/chargers', (req, res) =>{
  db.query('INSERT INTO chargers (name, lat, lng, slowstatus, faststatus) VALUES (?,?,?,?,?)',
  [req.body.name, req.body.lat, req.body.lng, req.body.slowstatus, req.body.faststatus]);
  res.send(req.body);
})*/



app.post('/user/register', (req, res) =>{
  db.query('SELECT COUNT(*) AS username FROM users WHERE username = ?', [req.body.username]).then(dbResults => {
    if(dbResults[0].username >= 1){
      res.send("Username Taken")
    }else{
      res.sendStatus(200)
      const passwordHash = bcrypt.hashSync(req.body.password, 8);
      db.query('INSERT INTO users (id, username, password) VALUES (?,?,?)',
                [uuidv4(), req.body.username, passwordHash]);
    }
  }
).catch(err => res.send(err))
}
)




passport.use(new passportHTTP.BasicStrategy((username, password, cb) => {
  db.query('SELECT id, username, password FROM users WHERE username = ?', [username]).then(dbResults => {

    if(dbResults.length == 0)
    {
      return cb(null, false);
    }

    bcrypt.compare(password, dbResults[0].password).then(bcryptResult => {
      if(bcryptResult == true)
      {
        cb(null, dbResults);
      }
      else
      {
        return cb(null, false);
      }
    })

  }).catch(dbError => cb(err))
}));


app.post('/user/login', passport.authenticate('basic', { session: false }), (req, res) => {
  console.log(req)
  res.sendStatus(200);
})


/* DB init */
Promise.all(
  [
      db.query(`CREATE TABLE IF NOT EXISTS chargers(
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(32),
          lat DOUBLE,
          lng DOUBLE,
          slowstatus VARCHAR(32),
          faststatus VARCHAR(32)
      )`),
      db.query(`CREATE TABLE IF NOT EXISTS users(
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255),
          password VARCHAR(255),
          UNIQUE (username)
      )`)

      // Add more table create statements if you need more tables
  ]
).then(() => {
  console.log('databases initialized');
  app.listen(port, () => {
      console.log(`Server API listening on http://localhost:${port}\n`);
  });
})
.catch(error => console.log(error));