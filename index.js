require('dotenv').config();

const express = require ('express');

const app = express();

const router = require('./routes/routes')

const httpStatusText = require('./utils/httpStatusText');

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL).then(() => {
    console.log('mongodb server started')
  }).catch((err) => {
    console.log('mongodb connection error: ', err.message);
  });
app.use(express.json())


app.use('/api/courses', router)


app.all('*', (req, res) => {
      
    return res.status(404).json({status: httpStatusText.ERROR, message: "This resourse is not avilable"});
  
})




app.listen(process.env.PORT || 3000, () => {
    console.log(`listen on port ${process.env.PORT || 3000}`)
})