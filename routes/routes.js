const express = require('express'); 

const router = express.Router();
const courseController = require('../controllers/coursesController')
const {body} = require('express-validator'); 

router.get('/', courseController.getAllCourses )


router.get('/:courseId', courseController.getSingleCourse)

router.post('/', 
    [body('title')
        .notEmpty()
        .withMessage("title is required")
        .isLength({min: 2}).
        withMessage('cannot be less than 2 digits'),

    body('price')
        .notEmpty()
        .withMessage("title is required")
        .isLength({min: 2}).
        withMessage('cannot be less than 2 digits')]

, courseController.createCourses)



router.patch('/:courseId', courseController.updateCourses)



router.delete('/:courseId', courseController.deleteCourses)


module.exports = router
