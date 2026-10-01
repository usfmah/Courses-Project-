const JWT = require('jsonwebtoken');

module.exports = async (payload) => {
       const token = await JWT.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRES_IN || '15m'}); 
       return token;
    
}