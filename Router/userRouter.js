const express = require('express');
const { User, generateToken } = require('../Model/userModel.js');
const bcrypt = require('bcrypt');


const router = express.Router();


// signup code
router.post("/signup",async(req,res)=>{
    try {
        let user = await User.findOne({email:req.body.email})
        if(user){
            res.status(400).json({message:"User Already Exist"})
        }
        if(!req.body.name || !req.body.email || !req.body.password){
            res.status(400).json({message:"All credentials are required"})
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(req.body.password,salt)

        user = await new User({
            name:req.body.name,
            email:req.body.email,
            password:hashedPassword
        }).save()

        const token = generateToken(user._id);
        res.status(200).json({message:"Signup Successfully",user,token})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

// login code
router.post("/login",async(req,res)=>{
    try {
        let user = await User.findOne({email:req.body.email})
        if(!user){
            res.status(400).json({message:"User not Exist"})
        }
        if(!req.body.email || !req.body.password){
            res.status(400).json({message:"All credentials are Required"})
        }
        const verify = await bcrypt.compare(req.body.password,user.password);
        if(!verify){
            res.status(400).json({message:"Password Incorrect"})
        } 
        const token = generateToken(user._id);
        res.status(200).json({message:"Login Successfully",user,token})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})
const userRouter = router;

module.exports={userRouter}