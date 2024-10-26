const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { Food } = require('../Model/foodModel');
const { Category } = require('../Model/category');
const { User } = require('../Model/userModel');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'food', // Cloudinary folder name for food images
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage });

router.post("/create/:c_id/:id", upload.single("photo"), async (req, res) => {
    try {
        const {foodName,price,details}=req.body;
        if(!foodName || !price || !details){
            return res.status(400).json({message:"All credentials Required"})
        }

        let photo;
        if (req.file) {
            photo = req.file.path; // Cloudinary URL
        }

        const category = await Category.findById(req.params.c_id);
        if (!category) {
            return res.status(400).json({ message: "Category not found" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(403).json({ message: "You are not authorized to create this food item." });
        }
        const existingFood = await Food.findOne({ foodName });
        if (existingFood) {
            return res.status(400).json({ message: "A food item with this name already exists." });
        }

        const foodData = {
            foodName,
            price,
            details,
            user:req.params.id,
            category:category.id
        }

        const food = await Food.create(foodData);
        res.status(201).json({ message: "Food created successfully", food });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server Error" });
    }
});

router.get("/getall/:id", async (req, res) => {
    try {
        const food = await Food.find({ category: req.params.id }).populate("user", "-password").populate("category");
        if (!food) {
            return res.status(400).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data found successfully", food });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server Error" });
    }
});

router.get("/getall", async (req, res) => {
    try {
        const data = await Food.find().populate("category").populate("user", "-password");
        if (!data) {
            return res.status(400).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data found successfully", data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/remove/:id", async (req, res) => {
    try {
        const food = await Food.findByIdAndDelete(req.params.id);
        if (!food) {
            return res.status(400).json({ message: "Data not removed" });
        }
        res.status(200).json({ message: "Data removed successfully", food });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put('/toggle/:id', async (req, res) => {
    const food = await Food.findById(req.params.id);
    if (!food) {
        return res.status(404).json({ message: 'Food item not found' });
    }
    food.status = !food.status;
    await food.save();
    res.json(food);
});

router.put("/edit/:id", upload.single("photo"), async (req, res) => {
    try {
        let photo;
        if (req.file) {
            photo = req.file.path; // Cloudinary URL
        }

        const food = await Food.findByIdAndUpdate(
            req.params.id,
            { ...req.body, photo, user: req.user },
            { new: true } // Return the updated document
        );
        
        if (!food) {
            return res.status(400).json({ message: "Error occurred in updating" });
        }
        
        res.status(200).json({ message: "Food updated successfully", food });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/search/:keyword", async (req, res) => {
    try {
        const { keyword } = req.params;
        const food = await Food.find({
            $or: [{ foodName: { $regex: keyword, $options: "i" } }],
        }).populate("user", "-password").populate("category");
        
        if (!food.length) {
            return res.status(400).json({ message: "Food is not available" });
        }
        
        res.status(200).json({ message: "Food found successfully", food });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const foodRouter = router;

module.exports = { foodRouter };
