const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const model = require('./model.js')

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// API endpoints
app.post('/api/exercise/new-user', (req, res) => {
  model.addNewUser(req.body.username, (err, data) => {
    if (err) {
      if (err.code === 11000)
        return res.send('username already taken');
      else {
        console.log('Add user error: ' + err);
        return res.send('Server error');
      }
    }
    res.json({username: data.username, _id: data._id});
  });
});

app.get('/api/exercise/users', (req, res) => {
  model.getAll((err, data) => {
    if (err) {
      console.log('Get all users errors: ' + err);
      return res.send('Server error');
    }
    res.json(data.map(user => ({_id: user.id, username: user.username})));
  });
});

app.post('/api/exercise/add', (req, res) => {
  if (req.body.description === "")
    return res.send('Path `description` is required.');
  
  if (req.body.duration === "")
    return res.send('Path `duration` is required.');
  
  model.findUserById(req.body.userId, (err, data) => {
    if (err) {
      console.log('Find user by id error: ' + err);
      return res.send('Server error');
    }
    if (data) {
      model.addExercise(req.body.userId,
          req.body.description,
          req.body.duration,
          req.body.date,
          (err, success, exercise) => {
            if (err) {
              console.log(err.message);
              res.send(err.reason.message);
            }
            else {
              res.json({username: data.username,
                       description: exercise.description,
                       duration: exercise.duration,
                       _id: data._id,
                       date: exercise.date});
            }
          });
    } else {
      res.send('unknown _id');
    }
  });
});

app.get('/api/exercise/log', (req, res) => {
  model.findUserById(req.query.userId, (err, data) => {
    if (err) {
      console.log('Find user by id error: ' + err);
      return res.send('Server error');
    }
    if (data) {
      res.json(model.standardize(data, req.query.from, req.query.to, req.query.limit));
    } else {
      res.send('unknown userId');
    }
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
