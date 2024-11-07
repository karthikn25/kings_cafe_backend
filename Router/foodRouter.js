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
        allowed_formats: ['jpg', 'png', 'jpeg','webp'],
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
            photo,
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

router.get("/getsingle/:p_id",async(req,res)=>{
    try {
        const food = await Food.findOne({_id:req.params.p_id});
        if(!food){
            res.status(400).json({message:"Data not Found"})
        }
        res.status(200).json({message:"Data found successfully",food})
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
})


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

// router.put("/edit/:id", upload.single("photo"), async (req, res) => {
//     try {
//         let photo;
//         if (req.file) {
//             photo = req.file.path; // Cloudinary URL
//         }

//         const food = await Food.findByIdAndUpdate(
//             req.params.id,
//             { ...req.body, photo, user: req.user },
//             { new: true } // Return the updated document
//         );
        
//         if (!food) {
//             return res.status(400).json({ message: "Error occurred in updating" });
//         }
        
//         res.status(200).json({ message: "Food updated successfully", food });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });



router.put("/edit/:id", upload.single("photo"), async (req, res) => {
    try {
        const foodId = req.params.id;
        const food = await Food.findById(foodId);

        if (!food) {
            return res.status(404).json({ message: "Food not found." });
        }

        let photoUrl = food.photo; // Default to the existing photo URL

        // If a new photo file is uploaded, upload it to Cloudinary
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    resource_type: "image",
                    folder: 'foods', // You can change the folder as per your needs
                });
                photoUrl = result.secure_url; // Get the secure URL of the uploaded image
            } catch (error) {
                console.error("Cloudinary upload error:", error);
                return res.status(500).json({ message: "Error uploading image to Cloudinary." });
            }
        }

        // Update the food details with the new information
        food.foodName = req.body.foodName || food.foodName;
        food.price = req.body.price || food.price;
        food.details = req.body.details || food.details;
        food.photo = photoUrl; // Updated photo URL (or existing if no new photo uploaded)
        food.user = req.user; // Assuming `req.user` is the logged-in user who is updating the food item

        const updatedFood = await food.save();

        res.status(200).json({ message: "Food updated successfully", food: updatedFood });
    } catch (error) {
        console.error("Error updating food:", error);
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
