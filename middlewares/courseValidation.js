const {body} = require('express-validator'); 


const validationSchema = () => {
 return  [body('title')
            .notEmpty()
            .withMessage("title is required")
            .isString()
            .withMessage("title must be a string")
            .trim()
            .notEmpty()
            .withMessage("title is required"),

        body('price')
            .notEmpty()
            .withMessage("price is required")
            .isFloat({gt: 0})
            .withMessage('price must be a positive number')
            .toFloat()]
}

module.exports = validationSchema