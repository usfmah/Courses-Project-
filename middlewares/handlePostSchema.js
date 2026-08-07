const {body} = require('express-validator'); 


const validationSchema = () => {
 return  [body('title')
            .notEmpty()
            .withMessage("title is required")
            .isLength({min: 2}).
            withMessage('cannot be less than 2 digits'),

        body('price')
            .notEmpty()
            .withMessage("title is required")
            .isLength({min: 2}).
            withMessage('cannot be less than 2 digits')]
}

module.exports = validationSchema