const mongoose = require('mongoose');
const md5 = require('js-md5');

mongoose.connect(process.env.MLAB_URI, { useNewUrlParser: true, useCreateIndex: true })
        .catch(err => {
          console.error('Database connect error: ' + err);
        });

const userSchema = new mongoose.Schema({
  _id: String,
  username: {
    type: String,
    unique: true
  },
  log: [{description: String,
         duration: Number,
         date: {
           type: Date,
           default: Date.now
         }
        }]
});

const User = mongoose.model('User', userSchema);

// User.deleteMany({}, (err, data) => {
//   if (err)
//     console.log('delete all error: ' + err);
// });

const generateId = (username) => {
  return md5(username);
}

const addNewUser = (username, done) => {
  let id = generateId(username);
  let newUser = new User({_id: id, username: username, log: []});
  
  newUser.save((err, data) => {
    if (err)
      return done(err);
    return done(null, data);
  });
}

const getAll = (done) => {
  User.find({}, (err, users) => {
    if (err)
      return done(err);
    return done(null, users);
  });
}

const addExercise = (id, description, duration, date, done) => {
  let exercise = {description: description, duration: duration};
  if (date !== "")
    exercise.date = date;
  User.updateOne({ _id: id }, {$push: { log: exercise }}, (err, success) => {
    if (err)
      return done(err);
    
    let d = date === "" ? new Date() : new Date(date);
    exercise.date = formatDate(d);
    
    return done(null, success, exercise);
  });
}

const findUserById = (id, done) => {
  User.findOne({_id: id}, (err, data) => {
    if (err)
      return done(err);
    return done(null, data);
  });
}

const formatDate = (date) => {
  return date.toDateString();
}

const filterLog = (data, from, to, limit) => {
  let f = (new Date(from)).getTime();
  let t = (new Date(to)).getTime();
  let n = parseInt(limit);
  n = n < 0 ? -n : n;
  
  let log = data
            .filter(e => {
              let time = e.date.getTime();
              return (isNaN(f) || f <= time) && (isNaN(t) || time <= t);
            })
            .map(e => ({
              description: e.description,
              duration: e.duration,
              date: formatDate(e.date)
            }));
  
  if (!isNaN(n)) {
    log.splice(n);
  }
  
  return log;
}

const standardize = (data, from, to, limit) => {
  let log = filterLog(data.log, from, to, limit);
  
  let res = {
    _id: data._id,
    username: data.username,
    count: log.length,
    log: log
  };
  return res;
}

// exports
exports.addNewUser = addNewUser;
exports.getAll = getAll;
exports.addExercise = addExercise;
exports.findUserById = findUserById;
exports.standardize = standardize;