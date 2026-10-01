const user = require('../models/userModel');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const generateJWT = require('../utils/JWTFunction');
require('dotenv').config();


const getAllUsers = asyncWrapper (async (req, res, next) => {

    const limit = req.query.limit ?? 10; 
    const page = req.query.page ?? 1; 
    const skip = (page - 1) * limit; 

    const users = await user.find({}, {password: 0, token: 0, __v: 0}).limit(limit).skip(skip);
    res.json({status: httpStatusText.SUCCESS, data: {users}});

}
)


const register = asyncWrapper (async (req, res, next) => {

    const {firstName, lastName, email, password} = req.body;

    const oldUser = await user.findOne({email: email}); 

    if (oldUser) {
            const error = new AppError("user already exists", 409, httpStatusText.FAIL);
            return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new user({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        avatar: req.file ? req.file.filename : undefined
    })

    await newUser.save(); 

    const token = await generateJWT({email: newUser.email, id: newUser.id, role: newUser.role});
        const userObj = newUser.toObject();
        delete userObj.password;
        res.status(201).json({status: httpStatusText.SUCCESS, data: {user: userObj, token}});
    
}
)


const login = asyncWrapper(async (req, res, next)  => {

    const {email, password} = req.body; 


    if (typeof email !== 'string' || typeof password !== 'string') {

        const error = new AppError("Invalid email or password", 401, httpStatusText.FAIL);
        return next(error);
    }

    const User = await user.findOne({email: email}).select('+password'); 

    if (!User) {

        const error = new AppError("Invalid email or password", 401, httpStatusText.FAIL);
        return next(error);
    }

    const matchedPassword = await bcrypt.compare(password, User.password);


    if (User && matchedPassword) {
        
        const token = await generateJWT({email: User.email, id: User.id, role: User.role});
        const userObj = User.toObject();
        delete userObj.password;

        res.status(200).json({status: httpStatusText.SUCCESS, data: {user: userObj, token}});
    } 
    else {

        const error = new AppError("Invalid email or password", 401, httpStatusText.FAIL);

        return next(error);

    }
})



module.exports = {
    getAllUsers,
    register, 
    login 
}


