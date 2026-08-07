const courses = require('../data/data')
const {validationResult} = require('express-validator'); 


const findCourseIndexOr404 = (req, res) => {
    const courseId = +req.params.courseId; 
    const idx = courses.findIndex((c) => c.id === courseId);

    if (idx === -1) res.status(404).json({msg: "course not found"});
    return idx;
}

const getAllCourses = (req, res) => {
    res.json(courses);
}


const getSingleCourse = (req, res) => {

    const idx = findCourseIndexOr404(req, res);
    if (idx === -1) return;

    res.json(courses[idx]);

}


const createCourses = (req, res) => {

    const errors = validationResult(req);
    console.log('errors: ', errors); 

    if (!errors.isEmpty()){
       return res.status(400).json(errors.array());
    }

    console.log(req.body);

    const course = {id: courses.length + 1, ...req.body};
    courses.push(course);

    res.status(201).json(course);

    
}


const updateCourses = (req, res) => {
    const idx = findCourseIndexOr404(req, res);
    if (idx === -1) return;

    courses[idx] = {...courses[idx], ...req.body};
    res.status(200).json(courses[idx]);

}


const deleteCourses = (req, res) => {
    const idx = findCourseIndexOr404(req, res);
    if (idx === -1) return;

    courses.splice(idx, 1);
    res.status(200).json({msg: 'done'})

}


module.exports = {
    getAllCourses, 
    getSingleCourse,
    createCourses, 
    updateCourses,
    deleteCourses,
}

