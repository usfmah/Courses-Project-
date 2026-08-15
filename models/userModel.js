const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator = require('validator');

const userSchema = new Schema ({

    firstName: {
        type: String,
        required: true 
    },

    lastName: {
        type: String,
        required: true 
    },

    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'It must be an email address']
    },

    password: {
        type: String,
        required: true 
    },

}, { versionKey: false })

module.exports = mongoose.model('User', userSchema);