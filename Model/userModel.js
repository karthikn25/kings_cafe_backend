const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLen:8,
        maxLen:16
    },
    avatar:{
        type:String
    }
})

const generateToken=(id)=>{
return jwt.sign({id},process.env.Secret_key)
}


const User = mongoose.model('user',userSchema);

module.exports={User,generateToken}