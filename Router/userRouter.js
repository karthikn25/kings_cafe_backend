const express = require('express');
const { User, generateToken } = require('../Model/userModel.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');


  const upload = multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null,path.join(__dirname,"..","uploads/user"))
        },
        filename:function(req,file,cb){
            cb(null,file.originalname)
        }
    })
})



dotenv.config()

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

//forget code

router.post('/forget-password',async(req,res)=>{
    try {
        let user = await User.findOne({email:req.body.email});
        if(!user){
            res.status(400).json({message:"User not exists"})
        }
        if(!req.body.email){
            res.status(400).json({message:"Email Required"})
        }
        const secret = user.password + process.env.Secret_key;
        const token = jwt.sign({_id:user.id,email:user.email},secret,{expiresIn:"5m"})
        const link = `http://localhost:3000/reset/${user._id}/${token}`

        const transporter = nodemailer.createTransport({
            service:"gmail",
            secure:false,
            auth:{
                user:process.env.Mail,
                pass:process.env.Mail_Pass
            }
        })
        const details = {
            from:process.env.User,
            to:req.body.email,
            subject:"Password Reset",
            text:link
        }
        transporter.sendMail(details,(err)=>{
            if(err){
                console.log('error occured in Email send')
            }
            console.log("Email send successfully")
        })
        res.json(link)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

//reset password

router.put("/reset-password/:id/:token",async(req,res)=>{
    const {password}=req.body;
    const {token}=req.params;
    try {
        let userDetails = await User.findOne({_id:req.params.id})
        if(!userDetails){
            res.status(400).json({message:'User not Exists'})
        }
        if(!req.body.password){
            res.status(400).json({message:"All credentials are required"})
        }
        const secret = userDetails.password + process.env.Secret_key
        const verify = jwt.verify(token,secret)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        const user = await User.findOneAndUpdate(
            {_id:req.params.id},
            {$set:{
                password:hashedPassword
            }}
        ) 
        res.status(200).json({message:"Password reset successfully",email:user.email,status:"verified",user})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

// get all user code

router.get("/getall",async(req,res)=>{
    try {
        const user = await User.find({})
        if(!user){
            res.status(400).json({message:"Data not Found"})
        }
        res.status(200).json({message:"Data found successfully",user})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

//get single user code

router.get("/get/:id",async(req,res)=>{
    try {
        const user = await User.findOne({_id:req.params.id})
        if(!user){
            res.status(400).json({messsage:"Data not found"})
        }
        res.status(200).json({message:"Data found successfully",user})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

router.put('/edit/:id',upload.single('avatar'),async(req,res)=>{
    try {
        let avatar;
        const BASE_URL = process.env.Backend_Url;
        if(process.env.NODE_ENV==="production"){
            BASE_URL = `${req.protocol}://${req.get("host")}`
        }
        if(req.file){
            avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                avatar
            },
            {new:true}
        );
        if(!user){
            res.status(400).json({message:"Error occured in Update"})
        }
        res.status(200).json({message:"User Update Successfully",user})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error"})
    }
})




const userRouter = router;

module.exports={userRouter}