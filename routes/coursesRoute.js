const express = require('express'); 
const validationSchema = require('../middlewares/handlePostSchema')
const router = express.Router();
const courseController = require('../controllers/coursesController')
const verifyToken = require('../middlewares/verifyToken')

router.route('/')
                .get(courseController.getAllCourses)
                .post(verifyToken, validationSchema(),courseController.createCourses)


router.route('/:courseId')
                .get(courseController.getSingleCourse)
                .patch(verifyToken, courseController.updateCourses)
                .delete(verifyToken, courseController.deleteCourses)


module.exports = router
