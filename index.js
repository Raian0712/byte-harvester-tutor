require('dotenv').config()

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')

const app = express();
const port = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//MongoDB Database stuff
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log("Connected to Database"));

//Router for users
const usersRouter = require('./routes/usersRouter');
app.use('/users', usersRouter);

//Simple GET request
app.get('/', (req, res) => {
    res.send("Hello World! - Express.js");
})

//Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
})