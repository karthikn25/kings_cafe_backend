const express = require('express');
const multer = require('multer');
const path = require('path');
const { Food } = require('../Model/foodModel');
const { Category } = require('../Model/category');


const upload = multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null,path.join(__dirname,"..","uploads/food"))
        },
        filename:function(req,file,cb){
            cb(null,file.originalname)
        }
    })
})


const router = express.Router();

router.post("/create/:id",upload.single("photo"),async(req,res)=>{
    try {
        
      
        const category = await Category.findById({_id:req.params.id});
        if(!category){
            res.status(400).json({message:"Category not found"})
        }
        let photo;
        const BASE_URL = process.env.Backend_Url;
        if(process.env.NODE_ENV==='production'){
            BASE_URL = `${req.protocol}://${req.get("host")}`
        }
        if(req.file){
            photo = `${BASE_URL}/uploads/photo/${req.file.originalname}`
        }
        const food = new Food({
            ...req.body,
            photo,
            user:req.user,
            category:category.id
        })
        await food.save()
        if(!food){
            res.status(400).json({message:"Error occured in creating food"})
        }
        res.status(200).json({message:"food created successfully",food})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server Error"})
    }
})
router.get("/getall/:id",async(req,res)=>{
    try {
        const food = await Food.find({}).where({category:{$eq:req.params.id}}).populate("user","-password").populate("category");
        if(!food){
            res.status(400).json({message:"Data not found"})
        }
        res.status(200).json({message:"Data found successfully",food})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server Error"})
    }
})

router.get("/getall",async(req,res)=>{
    try {
        const data = await Food.find().populate("category").populate("user","-password");
        if(!data){
            res.status(400).json({message:"Data not found"})
        }
        res.status(200).json({message:"Data found successfully",data})
    } catch (error) {
        console.log(error)
        res.status(200).json({message:"Internal server error"})
    }
  
})

router.delete("/remove/:id",async(req,res)=>{
    try {
        const food = await Food.findOne({_id:req.params.id});
        if(!food){
            res.status(400).json({message:"Data not removed"})
        }
        res.status(200).json({message:"Data removed successfully"})
    } catch (error) {
        console.log(error)
        res.status(200).json({message:"Internal server error"})
    }
})

router.put("/edit/:id",upload.single("photo"),async(req,res)=>{
    try {
        let photo;
        const BASE_URL = process.env.Backend_Url;
        if(process.env.NODE_ENV==='production'){
            BASE_URL = `${req.protocol}://${req.get("host")}`
        }
        if(req.file){
            photo=`${BASE_URL}/uploads/food/${req.file.originalname}`
        }
        const food = await Food.findByIdAndUpdate(
            {
                _id:req.params.id,
                ...req.body,
                photo,
                user:req.user 

            }
        )
        if(!food){
            res.status(400).json({message:"Error occured in updation"})
        }
        res.status(200).json({message:"Food updated successfully",status:"verified",food})
        
    } catch (error) {
        console.log(error)
        res.status(200).json({message:"Internal server error"})
    }
})

const foodRouter = router;

module.exports = {foodRouter}