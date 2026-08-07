const express = require ('express');

const app = express();

const {body, validationResult} = require('express-validator'); 

app.use(express.json())

let courses = [
    {
        id: 1, 
        title: "JS", 
        price: 3000
    },

    {
        id: 2, 
        title: "react", 
        price: 5000
    },
]

// CRUD 

// get all courses
app.get('/api/courses', (req, res, next) => {
    res.json(courses);

    next();
})

// get course 
app.get('/api/courses/:courseId', (req, res) => {

    const courseId = +req.params.courseId; 
    const course = courses.find((course) => (course.id === courseId)); 

    console.log(courseId)

    if(!course) {
        res.status(404).json({msg: "not found"})
    } 

    res.json(course)

})

// create course
app.post('/api/courses', 
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

,(req, res, next) => {

    const errors = validationResult(req);
    console.log('errors: ', errors); 

    if (!errors.isEmpty()){
        res.status(400).json(errors.array());
    }

    console.log(req.body);

    const course = {id: courses.length + 1, ...req.body};
    courses.push(course);

    res.status(201).json(course);

    next()
})


// Update Course

app.patch('/api/courses/:courseId', (req, res) => {
    const courseId = +req.params.courseId; 
    const idx = courses.findIndex((c) => c.id === courseId);

    if (idx === -1) return res.status(404).json({msg: "Not found"});

    courses[idx] = {...courses[idx], ...req.body};
    res.status(200).json(courses[idx]);


})


// Delete Course 

app.delete('/api/courses/:courseId', (req, res) => {

    const courseId = +req.params.courseId; 
    courses = courses.filter((c) => c.id != courseId);

    res.status(200).json({msg: 'done'})

})

app.listen(3000, () => {
    console.log('listen on port 3000')
})