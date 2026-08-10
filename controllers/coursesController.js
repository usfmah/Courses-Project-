const Course = require('../models/coursesModels.js');
const {validationResult} = require('express-validator'); 



const getAllCourses = async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
}


const getSingleCourse = async (req, res) => {

    try {
            const course = await Course.findById(req.params.courseId);
            if (!course) {
            return res.status(404).json({msg: 'Course not found'});
            }
            res.json(course);
        }
        catch (err) {
            return res.status(400).json('invalid Course Id');

        }

}


const createCourses = async (req, res) => {

    const errors = validationResult(req);
    console.log('errors: ', errors); 

    if (!errors.isEmpty()){
       return res.status(400).json(errors.array());
    }
    
    const newCourse = new Course(req.body);

    await newCourse.save();

    res.status(201).json(newCourse);

    
}


const updateCourses = async (req, res) => {
    const courseId = req.params.courseId; 
    try {
    const course = await Course.findByIdAndUpdate(courseId, req.body, { new: true });
    if (!course) {
        return res.status(404).json({msg: 'Course not found'});
    }
   return res.status(200).json(course);
    }
    catch (err) {
        return res.status(400).json({error: err}); 
    }

}


const deleteCourses = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) {
            return res.status(404).json({msg: 'Course not found'});
        }
        res.status(200).json({msg: 'done'})
    }
    catch (err) {
        return res.status(400).json({error: err});
    }

}


module.exports = {
    getAllCourses, 
    getSingleCourse,
    createCourses, 
    updateCourses,
    deleteCourses,
}

