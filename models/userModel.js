const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator = require('validator');
const userRoles = require('../utils/userRoles');
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
        required: true, 
        select: false
    },

    token: {
        type: String
    }, 
    role: {
        type: String,
        enum: [userRoles.user, userRoles.admin, userRoles.manager],
        default: userRoles.user
    }, 

    avatat: {
        type: String, 
        default: 'uploads/images.jpeg', 
    }

}, { versionKey: false })

module.exports = mongoose.model('User', userSchema);