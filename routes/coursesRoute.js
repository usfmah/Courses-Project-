const express = require('express'); 
const {param, query} = require('express-validator');
const validationSchema = require('../middlewares/handlePostSchema')
const validate = require('../middlewares/validate');
const router = express.Router();
const courseController = require('../controllers/coursesController')
const verifyToken = require('../middlewares/verifyToken')
const userRoles = require('../utils/userRoles');
const allowedTo = require('../middlewares/allowedTo')

const paginationRules = [
    query('page').optional().isInt({min: 1}).withMessage('page must be an integer >= 1').toInt(),
    query('limit').optional().isInt({min: 1, max: 100}).withMessage('limit must be an integer between 1 and 100').toInt()
];

const courseIdRule = [
    param('courseId').isMongoId().withMessage('Invalid id format')
];

const courseValidation = validationSchema();

router.route('/')
                .get(paginationRules, validate, courseController.getAllCourses)
                .post(verifyToken, allowedTo(userRoles.admin), courseValidation, validate, courseController.createCourses)


router.route('/:courseId')
                .get(courseIdRule, validate, courseController.getSingleCourse)
                .patch(verifyToken, allowedTo(userRoles.admin), courseIdRule, courseValidation, validate, courseController.updateCourses)
                .delete(verifyToken, allowedTo(userRoles.admin, userRoles.manager), courseIdRule, validate, courseController.deleteCourses)


module.exports = router
