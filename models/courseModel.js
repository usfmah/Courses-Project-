const mongoose = require('mongoose');
const { Schema } = mongoose;


const courseSchema = new Schema ({
    title: {
        type: String,
        required: true 
    },

    price: {
        type: Number,
        required: true 
    }
}, { versionKey: false })

module.exports = mongoose.model('Course', courseSchema, 'Courses');