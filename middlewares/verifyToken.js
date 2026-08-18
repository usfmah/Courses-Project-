const JWT = require('jsonwebtoken');
const AppError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');
const verifyToken = (req, res, next) => {

    const authHeader = req.headers['Authorization'] || req.headers['authorization'];

    if (!authHeader) {
        const error = new AppError("Token is required", 401, httpStatusText.ERROR);
         return next(error);
    }

const token = authHeader.split(' ')[1];

    try {
        const decodedToken = JWT.verify(token, process.env.JWT_SECRET_KEY, )
        req.currentUser = decodedToken;
        next();

    } 
    catch (err) {
         const error = new AppError("Invalid Token", 401, httpStatusText.ERROR);
         return next(error);
    }
}


module.exports = verifyToken;