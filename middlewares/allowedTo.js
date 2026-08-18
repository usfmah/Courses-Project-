const AppError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const allowedTo = (...roles) => {
    return (req, res, next) => {
        if (!req.currentUser || !roles.includes(req.currentUser.role)) {
            const error = new AppError("You are not authorized to access this resource", 403, httpStatusText.ERROR);
            return next(error);
        }
        next();
    };
};

module.exports = allowedTo;