const Course = require('../models/coursesModels.js');
const {validationResult} = require('express-validator'); 
const httpStatusText = require('../utils/httpStatusText.js');


const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({}, {"__v": false});
        res.json({status: httpStatusText.SUCCESS, data: {courses}});
    }
    catch (err) {
        return res.status(400).json({status: httpStatusText.ERROR, data: null, message: err.message, code: 400});
    }
}


const getSingleCourse = async (req, res) => {

    try {
            const course = await Course.findById(req.params.courseId);
            if (!course) {
            return res.status(404).json({status: httpStatusText.FAIL, data: {course: null}});
            }
            res.json({status: httpStatusText.SUCCESS, data: {course}});
        }
        catch (err) {
            return res.status(400).json({status: httpStatusText.ERROR, data: null, message: err.message, code: 400});

        }

}


const createCourses = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()){
       return res.status(400).json({status: httpStatusText.FAIL, data: {errors: errors.array()}});
    }
    
    try {
        const newCourse = new Course(req.body);

        await newCourse.save();

        res.status(201).json({status: httpStatusText.SUCCESS, data: {course: newCourse}});
    }
    catch (err) {
        return res.status(400).json({status: httpStatusText.ERROR, data: null, message: err.message, code: 400});
    }

    
}


const updateCourses = async (req, res) => {
    const courseId = req.params.courseId; 
    try {
    const course = await Course.findByIdAndUpdate(courseId, req.body, { new: true });
    if (!course) {
        return res.status(404).json({status: httpStatusText.FAIL, data: null});
    }
   return res.status(200).json({status: httpStatusText.SUCCESS, data: {course}});
    }
    catch (err) {
        return res.status(400).json({status: httpStatusText.ERROR, data: null, message: err.message, code: 400}); 
    }

}


const deleteCourses = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) {
            return res.status(404).json({status: httpStatusText.FAIL, data: null});
        }
        res.status(200).json({status: httpStatusText.SUCCESS, data: null})
    }
    catch (err) {
        return res.status(400).json({status: httpStatusText.ERROR, data: null, message: err.message, code: 400});
    }

}


module.exports = {
    getAllCourses, 
    getSingleCourse,
    createCourses, 
    updateCourses,
    deleteCourses,
}

