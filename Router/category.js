const express = require('express');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const { Category } = require('../Model/category');
const { json } = require('body-parser');

dotenv.config();

const router = express.Router();

const upload = multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null,path.join(__dirname,"..","/uploads/category"))
        },
        filename:function(req,file,cb){
            cb(null,file.originalname)
        }
    })
})

router.post("/create",upload.single("picture"),async(req,res)=>{
    try {
     let picture;
     const BASE_URL = process.env.Backend_Url;
     if(process.env.NODE_ENV==='production'){
        BASE_URL = `${req.protocol}://${req.get("host")}`
     }   
     if(req.file){
        picture = `${BASE_URL}/uploads/category/${req.file.originalname}`
     }
     const category = new Category({
        ...req.body,
        picture
     })
     await category.save()
     if(!category){
        res.status(400).json({message:"Category not created"})
     }
     res.status(200).json({message:"Category created successfully",category})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal server error"})
    }
})

router.get('/get',async(req,res)=>{
    try {
        const category = await Category.find({});
        if(!category){
            res.status(400).json({message:"Data not found"})
        }
        res.status(200).json({message:"Data found successfully",category})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal server error"})
    }
})



const categoryRouter  = router;

module.exports = {categoryRouter}