const express = require('express'); 
const validationSchema = require('../middlewares/handlePostSchema')
const router = express.Router();
const courseController = require('../controllers/coursesController')

router.route('/')
                .get(courseController.getAllCourses)
                .post(validationSchema(),courseController.createCourses)


router.route('/:courseId')
                .get(courseController.getSingleCourse)
                .patch(courseController.updateCourses)
                .delete(courseController.deleteCourses)


module.exports = router
