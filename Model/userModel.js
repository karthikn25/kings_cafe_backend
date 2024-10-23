const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
}, { timestamps: true });

const generateToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET);
}

const User = mongoose.model('User', userSchema);

module.exports = {User,generateToken};
