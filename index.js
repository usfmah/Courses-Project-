require('dotenv').config();

if (!process.env.DB_URL) {
    throw new Error('DB_URL is missing — copy .env.example to .env and set DB_URL');
}

const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');

mongoose.connect(process.env.DB_URL).then(() => {
    logger.info('mongodb server started')
    app.listen(process.env.PORT || 3000, () => {
        logger.info(`listen on port ${process.env.PORT || 3000}`)
    })
  }).catch((err) => {
    logger.error('mongodb connection error: ', err.message);
    process.exit(1);
  });
