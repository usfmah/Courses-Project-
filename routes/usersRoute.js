const express = require('express'); 
const multer = require('multer');
const userController = require('../controllers/usersController')
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = file.originalname.split('.').pop()
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
    }
})

const upload = multer({ storage: storage });

router.route('/')
                .get(verifyToken, userController.getAllusers);



router.route('/register')
                .post(upload.single('avatar'), userController.register)
                

                

router.route('/login')
                .post(userController.login)                



module.exports = router
