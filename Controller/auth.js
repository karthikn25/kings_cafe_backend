const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { User } = require('../Model/userModel.js');
dotenv.config()

const isAuth = async(req,res,next)=>{
    let token;
    if(req.headers){
        try {
            token = req.headers['x-auth-token']
            const decode = jwt.verify(token,process.env.Secret_key);
            req.user = await User.findById(decode.id).select("name email _id");
            next()
        } catch (error) {
            return res.status(400).json({message:"Invalid Authorization"})
        }
        if(!token){
            return res.status(400).json({message:"Access denied"})
        }
        
    }

}

module.exports = { isAuth };