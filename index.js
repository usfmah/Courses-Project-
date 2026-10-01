require('dotenv').config();

if (!process.env.JWT_SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY is missing — copy .env.example to .env and set JWT_SECRET_KEY');
}

if (!process.env.DB_URL) {
    throw new Error('DB_URL is missing — copy .env.example to .env and set DB_URL');
}

const express = require ('express');
const path = require('path')
const app = express();

app.use(
  '/uploads', express.static(path.join(__dirname,'uploads'))
)

const coursesRouter = require('./routes/coursesRoute');
const usersRouter = require('./routes/usersRoute')


const httpStatusText = require('./utils/httpStatusText');

const cors = require('cors'); 

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL).then(() => {
    console.log('mongodb server started')
    app.listen(process.env.PORT || 3000, () => {
        console.log(`listen on port ${process.env.PORT || 3000}`)
    })
  }).catch((err) => {
    console.log('mongodb connection error: ', err.message);
    process.exit(1);
  });

app.use(cors());
 
app.use(express.json())


app.use('/api/courses', coursesRouter);

app.use('/api/users', usersRouter)


app.use((req, res, next) => {
    
    return res.status(404).json({status: httpStatusText.FAIL, data: null, message: "This resource is not available"});
  
});


app.use((error, req, res, next) => {
        if (error.name === 'CastError') {
            return res.status(400).json({status: httpStatusText.FAIL, data: null, message: 'Invalid id format'});
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({status: httpStatusText.FAIL, data: null, message: error.message});
        }
        if (error.code && error.code === 11000) {
            return res.status(409).json({status: httpStatusText.FAIL, data: null, message: 'Duplicate field value entered'});
        }
        if (error.statusCode) {
            const statusCode = error.statusCode;
            if (statusCode >= 500) {
                return res.status(500).json({status: httpStatusText.ERROR, data: null, message: 'Internal server error'});
            }
            return res.status(statusCode).json({status: error.statusText || httpStatusText.FAIL, data: null, message: error.message});
        }
        return res.status(500).json({status: httpStatusText.ERROR, data: null, message: 'Internal server error'});
});