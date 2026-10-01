const express = require('express'); 
const multer = require('multer');
const {body, query} = require('express-validator');
const validate = require('../middlewares/validate');
const userController = require('../controllers/usersController')
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const allowedTo = require('../middlewares/allowedTo');
const userRoles = require('../utils/userRoles');
const AppError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const registerValidation = [
    body('firstName').notEmpty().withMessage('firstName is required'),
    body('lastName').notEmpty().withMessage('lastName is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({min: 8}).withMessage('password must be at least 8 characters')
];

const loginValidation = [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('password is required')
];

const paginationRules = [
    query('page').optional().isInt({min: 1}).withMessage('page must be an integer >= 1').toInt(),
    query('limit').optional().isInt({min: 1, max: 100}).withMessage('limit must be an integer between 1 and 100').toInt()
];

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Only images are allowed to be uploaded', 400, httpStatusText.FAIL), false);
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const mimeExtensionMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/bmp': 'bmp',
            'image/svg+xml': 'svg',
            'image/tiff': 'tiff',
            'image/x-icon': 'ico',
            'image/vnd.microsoft.icon': 'ico'
        };
        const ext = mimeExtensionMap[file.mimetype] || 'png';
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
    }
})

const upload = multer({ storage: storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

router.route('/')
                .get(verifyToken, allowedTo(userRoles.admin), paginationRules, validate, userController.getAllUsers);



router.route('/register')
                .post(upload.single('avatar'), registerValidation, validate, userController.register)
                

                

router.route('/login')
                .post(loginValidation, validate, userController.login)                



module.exports = router
