const {validationResult} = require('express-validator');
const AppError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new AppError(errors.array()[0].msg, 400, httpStatusText.FAIL);
        return next(error);
    }
    next();
};

module.exports = validate;
