const express = require('express'); 
const validationSchema = require('../middlewares/handlePostSchema')
const router = express.Router();
const courseController = require('../controllers/coursesController')
const verifyToken = require('../middlewares/verifyToken')
const userRoles = require('../utils/userRoles');
const allowedTo = require('../middlewares/allowedTo')

router.route('/')
                .get(courseController.getAllCourses)
                .post(verifyToken, allowedTo(userRoles.admin), validationSchema(),courseController.createCourses)


router.route('/:courseId')
                .get(courseController.getSingleCourse)
                .patch(verifyToken, allowedTo(userRoles.admin), courseController.updateCourses)
                .delete(verifyToken, allowedTo(userRoles.admin, userRoles.manager), courseController.deleteCourses)


module.exports = router
