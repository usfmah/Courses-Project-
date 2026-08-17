const express = require('express'); 
const userController = require('../controllers/usersController')
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');

router.route('/')
                .get(verifyToken, userController.getAllusers);



router.route('/register')
                .post(userController.register)
                

                

router.route('/login')
                .post(userController.login)                



module.exports = router
