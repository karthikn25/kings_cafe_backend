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

router.put("/categoryedit/:c_id",upload.single("picture"),async(req,res)=>{
    // try {
    //     let picture;
    //     if(req.file){
    //         picture=req.file.path
    //     }
    //     const category = await Category.findByIdAndUpdate(
    //         req.params.c_id,
    //         {...req.body,picture},
    //         {new:true}
    //     )
    //     if(!category){
    //         res.status(400).json({message:"Category not updated"})
    //     }
    //     res.status(200).json({message:"Data updated successfully",category})
    // } catch (error) {
    //     console.log(error);
    //     res.status(500).json({message:"Internal server error"})
    // }
    try {
        const categoryId = req.params.c_id; // Get category ID from URL parameters
        const category = await Category.findById(categoryId);
    
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }
    
        let pictureUrl;
    
        // If a new picture file is uploaded, upload it to Cloudinary
        if (req.file) {
            pictureUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    resource_type: "image",
                    folder: 'categories', // Specify a folder in Cloudinary
                }, (error, result) => {
                    if (error) {
                        return reject(new Error("Error uploading image to Cloudinary."));
                    }
                    resolve(result.secure_url); // Resolve with the secure URL of the image
                });
    
                // End the stream with the file buffer
                uploadStream.end(req.file.buffer);
            });
        }
    
        // Update the category fields
        category.name = req.body.name || category.name; // Update category name if provided
        category.description = req.body.description || category.description; // Update description if provided
        category.picture = pictureUrl || category.picture; // Update picture if a new one is uploaded
    
        const updatedCategory = await category.save();
    
        res.status(200).json({ message: "Category updated successfully", category: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    
})

const categoryRouter = router;

module.exports = { categoryRouter };
