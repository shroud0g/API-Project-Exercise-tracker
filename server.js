require('dotenv').config({path: __dirname + '/.env'});

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const shortid = require('shortid')

const port = process.env.PORT || 5000;

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}))
//Schema & model
var exerciseSchema = new mongoose.Schema({description: String, duration: Number, date: Date, _id : false })
var userSchema = new mongoose.Schema({
    username: String,
    userId: String,
    exercises: [exerciseSchema]
});

var User = mongoose.model('User', userSchema);
//Date format
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
//Serve style.css
app.use(express.static(__dirname + '/public'));

//Main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})

//Creates new user API
app.post('/api/exercise/new-user', (req, res) => {
    let username = req.body.username;
    //Search db for user. If username not taken, creates new user.
    User.findOne(({username: username}) ,(err, exist) => {
        if (err) throw err;
        if (!exist) {
            let newUser = new User({username: username, userId: shortid.generate(), exercises: []})
            newUser.save((err, data) => {
                if (err) throw err;
                return res.json({username: newUser.username, userId: newUser.userId});
            })
        }
        else {
            res.send('Username already taken');
        }
    })
})

//Adds exercises to user
app.post('/api/exercise/add', (req, res) => {
    //Handle Empty date
    if (req.body.date == '') {
        var date = new Date();
    }
    else {
        var date = new Date(req.body.date);
        //Check if invalid date 
        if (!date) {
            return res.status(400).send('invalid date').end();
        }
    };
    let exercise = {description: req.body.description, duration: req.body.duration, date: date}
    User.findOneAndUpdate({ userId: req.body.userId }, { $push: {exercises: exercise} }, { new: true }, (err, success) => {
        if (err) throw err;
        if (!success) {
            return res.status(400).send('User does not exist')
        }
        else {
            return res.json({username: success.userId, exercise: (req.body.description + ' for ' + req.body.duration + 'mins'), date: date.toLocaleDateString("en-US", options)})
        }
    })
})  

//Get User's log
app.get('/api/exercise/log', (req, res) => {
    let userId = req.query.userId;
    if (!userId) {
        return res.status(400).send('Please input userId')
    };
    //Default values
    let from = new Date('2000'),
        to = new Date(),
        limit = 20;

    //If from query exists
    if (req.query.from) {
        let fromDate = new Date(req.query.from);
        if (fromDate != 'Invalid Date') {
            from = fromDate;
        }
    };
    //If to query exists
    if (req.query.to) {
        let toDate = new Date(req.query.to);
        if (toDate != 'Invalid Date') {
            to = toDate;
        }
    };
    //If Limit exists & more than one
    if (req.query.limit && req.query.limit > 0) {
        limit = parseInt(req.query.limit);
    };

    User.aggregate([
        { $match: {userId: userId}},
        { '$unwind': '$exercises' },
        { $match: {'exercises.date': {'$lte': to, '$gte': from} }},
        { $limit: limit },
        { $group: {_id: '$_id', username: {$first: '$username'}, userId: {$first: '$userId'}, 'log': { '$push': '$exercises' }}},
        { $project: {_id: 0}}
    ]).exec((err, success) => {
        if (err) throw err;
        if (Array.isArray(success) && success.length) {
            return res.json(success)
        }
        else {
            return res.send('User does not exist')
        }
    })
    
})


//not found
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

app.listen(port, () => {
    console.log('Your app is listening on port ' + port)
  })
