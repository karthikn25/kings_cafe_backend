const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const { Category } = require('../Model/category');

dotenv.config();

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
        folder: 'category', // Cloudinary folder name
        allowed_formats: ['jpg', 'png', 'jpeg','webp'],
    },
});

const upload = multer({ storage });

router.post("/create", upload.single("picture"), async (req, res) => {
    try {
        // Check if the category name already exists
        const existingCategory = await Category.findOne({ name: req.body.name });
        
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        // Ensure a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Create a new category
        const category = new Category({
            name: req.body.name,
            picture: req.file.path, // Assuming this is the correct path for the picture
        });

        // Save the new category to the database
        await category.save();
        
        // Respond with success
        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/get', async (req, res) => {
    try {
        const category = await Category.find({});
        if (!category) {
            return res.status(400).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data found successfully", category });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/remove/:id", async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(400).json({ message: "Error occurred in deletion" });
        }
        res.status(200).json({ message: "Category deleted successfully", category });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const categoryRouter = router;

module.exports = { categoryRouter };
