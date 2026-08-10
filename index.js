require('dotenv').config();

const express = require ('express');

const app = express();

const router = require('./routes/routes')

const mongoose = require('mongoose');

app.use(express.json())


app.use('/api/courses', router)


 mongoose.connect(process.env.DB_URL).then(() => {
    console.log('mongodb server started')
  }).catch((err) => {
    console.log('mongodb connection error: ', err.message);
  });




app.listen(process.env.PORT || 3000, () => {
    console.log(`listen on port ${process.env.PORT || 3000}`)
})