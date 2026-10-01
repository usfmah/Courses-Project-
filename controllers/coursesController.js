const Course = require('../models/courseModel.js');
const httpStatusText = require('../utils/httpStatusText.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const AppError = require('../utils/appError.js')

const getAllCourses = asyncWrapper (async (req, res, next) => {

    const limit = req.query.limit ?? 10; 
    const page = req.query.page ?? 1; 
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
    
    const {title, price} = req.body;
    const newCourse = new Course({title, price});
    await newCourse.save();
    res.status(201).json({status: httpStatusText.SUCCESS, data: {course: newCourse}});

})


const updateCourses = asyncWrapper (async (req, res, next) => {

    const courseId = req.params.courseId; 
    const {title, price} = req.body;
    const course = await Course.findByIdAndUpdate(courseId, {title, price}, { new: true, runValidators: true });
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
