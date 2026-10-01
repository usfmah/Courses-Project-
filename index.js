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
const logger = require('./utils/logger');

const cors = require('cors'); 
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL).then(() => {
    logger.info('mongodb server started')
    app.listen(process.env.PORT || 3000, () => {
        logger.info(`listen on port ${process.env.PORT || 3000}`)
    })
  }).catch((err) => {
    logger.error('mongodb connection error: ', err.message);
    process.exit(1);
  });

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : null;

if (allowedOrigins && allowedOrigins.length) {
    app.use(cors({origin: allowedOrigins}));
} else if (process.env.NODE_ENV === 'production') {
    app.use(cors({origin: false}));
} else {
    app.use(cors());
}
 
app.use(express.json())

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {status: httpStatusText.FAIL, data: null, message: 'Too many login attempts, please try again later'},
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {status: httpStatusText.FAIL, data: null, message: 'Too many registration attempts, please try again later'},
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/users/login', loginLimiter);
app.use('/api/users/register', registerLimiter);


app.use('/api/courses', coursesRouter);

app.use('/api/users', usersRouter)


app.use((req, res, next) => {
    
    return res.status(404).json({status: httpStatusText.FAIL, data: null, message: "This resource is not available"});
  
});


app.use((error, req, res, next) => {
        if (error.name === 'MulterError') {
            return res.status(400).json({status: httpStatusText.FAIL, data: null, message: error.message});
        }
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