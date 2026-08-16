const express = require('express'); 
const userController = require('../controllers/usersController')
const router = express.Router();

router.route('/')
                .get(userController.getAllusers);



router.route('/register')
                .post(userController.register)
                

                

router.route('/login')
                .post(userController.login)                



module.exports = router
