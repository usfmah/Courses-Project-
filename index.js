require('dotenv').config();

const express = require ('express');

const app = express();

const router = require('./routes/routes')

const httpStatusText = require('./utils/httpStatusText');

const cors = require('cors'); 

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL).then(() => {
    console.log('mongodb server started')
  }).catch((err) => {
    console.log('mongodb connection error: ', err.message);
  });

app.use(cors());
 
app.use(express.json())


app.use('/api/courses', router)


app.use((req, res, next) => {
    
    return res.status(404).json({status: httpStatusText.ERROR, message: "This resourse is not avilable"});
  
});


app.use((error, req, res, next) => {
        res.status(error.statusCode || 500).json({status: httpStatusText.ERROR, message: error.message})
});



app.listen(process.env.PORT || 3000, () => {
    console.log(`listen on port ${process.env.PORT || 3000}`)
})