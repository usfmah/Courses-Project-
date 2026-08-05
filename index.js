const express = require ('express');

const app = express();

const courses = [
    {
        id: 1, 
        name: "JS", 
        price: 3000
    },

    {
        id: 2, 
        name: "react", 
        price: 5000
    },
]

// CRUD 

app.get('/api/courses', (req, res, next) => {
    res.json(courses);

    next();
})

app.get('/api/courses/:courseId', (req, res, next) => {

    const courseId = +req.params.courseId; 
    const course = courses.find((course) => (course.id === courseId)); 

    console.log(courseId)

    if(!course) {
        res.status(404).json("Course Not found")
    } 

    res.json(course)

})


app.listen(3000, () => {
    console.log('listen on port 3000')
})