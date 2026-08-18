const user = require('../models/userModel');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateJWT = require('../utils/JWTFunction');
require('dotenv').config();


const getAllusers = asyncWrapper (async (req, res, next) => {

    const query = req.query; 
    const limit = parseInt(query.limit, 10) || 10; 
    const page = parseInt(query.page, 10) || 1; 
    const skip = (page - 1) * limit; 

    const users = await user.find({}, {"__v": false}).limit(limit).skip(skip);
    res.json({status: httpStatusText.SUCCESS, data: {users}});

}
)


const register = asyncWrapper (async (req, res, next) => {

    const {firstName, lastName, email, password} = req.body;

    const oldUser = await user.findOne({email: email}); 

    if (oldUser) {
            const error = new AppError("user already exists", 400, httpStatusText.FAIL);
            return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new user({
        firstName,
        lastName,
        email,
        password: hashedPassword
    })

    await newUser.save(); 

    const token = await generateJWT({email: newUser.email, id: newUser.id, role: newUser.role});
        newUser.token = token; 
        newUser.password = undefined;
        res.status(201).json({status: httpStatusText.SUCCESS, data: {user: newUser}});
    
}
)


const login = asyncWrapper(async (req, res, next)  => {

    const {email, password} = req.body; 


    if (!email || !password) {

        const error = new AppError("passowrd and email are required", 400, httpStatusText.FAIL);
        return next(error);
    }

    const User = await user.findOne({email: email}).select('+password'); 

    if (!User) {

        const error = new AppError("user not found", 400, httpStatusText.FAIL);
        return next(error);
    }

    const matchedPassword = await bcrypt.compare(password, User.password);


    if (User && matchedPassword) {
        
        const token = await generateJWT({email: User.email, id: User.id, role: User.role});

        res.status(200).json({status: httpStatusText.SUCCESS, data: {token}});
    } 
    else {

        const error = new AppError("Something wrong", 400, httpStatusText.FAIL);

        return next(error);

    }
})



module.exports = {
    getAllusers,
    register, 
    login 
}


