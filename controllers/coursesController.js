const Course = require('../models/coursesModels.js');
const {validationResult} = require('express-validator'); 
const httpStatusText = require('../utils/httpStatusText.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const AppError = require('../utils/appError.js')

const getAllCourses = asyncWrapper (async (req, res, next) => {

    const query = req.query; 
    const limit = parseInt(query.limit, 10) || 10; 
    const page = parseInt(query.page, 10) || 1; 
    const skip = (page - 1) * limit; 

    const courses = await Course.find({}, {"__v": false}).limit(limit).skip(skip);
    res.json({status: httpStatusText.SUCCESS, data: {courses}});

}
)

const getSingleCourse = asyncWrapper (async (req, res, next) => {

    const course = await Course.findById(req.params.courseId);
    if (!course) {
        const error = new AppError("Not found Course", 404, httpStatusText.FAIL);
        return next(error);
    }
    res.json({status: httpStatusText.SUCCESS, data: {course}});

}
)

const createCourses = asyncWrapper (async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()){
        const error = new AppError(errors.array()[0].msg, 400, httpStatusText.FAIL);
        return next(error);
    }
    
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json({status: httpStatusText.SUCCESS, data: {course: newCourse}});

})


const updateCourses = asyncWrapper (async (req, res, next) => {

    const courseId = req.params.courseId; 
    const course = await Course.findByIdAndUpdate(courseId, req.body, { new: true });
    if (!course) {
        const error = new AppError("Course not found", 404, httpStatusText.FAIL);
        return next(error);
    }
    res.status(200).json({status: httpStatusText.SUCCESS, data: {course}});

})


const deleteCourses = asyncWrapper (async (req, res, next) => {

    const course = await Course.findByIdAndDelete(req.params.courseId);
    if (!course) {
        const error = new AppError("Course not found", 404, httpStatusText.FAIL);
        return next(error);
    }
    res.status(200).json({status: httpStatusText.SUCCESS, data: null});

})


module.exports = {
    getAllCourses, 
    getSingleCourse,
    createCourses, 
    updateCourses,
    deleteCourses,
}
