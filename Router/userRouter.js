const express = require('express');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const path = require("path");
const { generateToken } = require('../Model/userModel');
const multer = require('multer');
const { User } = require('../Model/userModel');
const cloudinary = require('cloudinary').v2;

dotenv.config();

const router = express.Router();



// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const uploads = multer({ storage });



// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Routes
const tempOtpStore = {};

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please provide username, email, and password' });
        }

        // Generate OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
        const otpExpires = Date.now() + 300000; // 5 minutes

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP for account verification',
            text: `Your OTP is ${generatedOtp}`
        };

        const hashedPassword = await bcrypt.hash(password, 10);

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ msg: 'Error sending email' });
            } else {
                tempOtpStore[email] = {
                    otp: generatedOtp,
                    otpExpires,
                    username,
                    email,
                    password: hashedPassword,
                };
                return res.status(200).json({ msg: 'OTP sent to email' });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const tempUser = tempOtpStore[email];
        if (!tempUser || tempUser.otp !== otp || tempUser.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        const user = new User({
            username: tempUser.username,
            email: tempUser.email,
            password: tempUser.password,
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        delete tempOtpStore[email];

        res.status(200).json({ msg: 'User registered successfully', token, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All credentials are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        const comparePassword = await bcrypt.compare(password, user.password);
        if (!comparePassword) {
            return res.status(400).json({ message: "Password incorrect" });
        }

        const token = generateToken(user._id);
        return res.status(200).json({ message: "Login successfully", token, user });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/forget", async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(400).json({ message: "User not exists" });
        }
        if (!req.body.email) {
            res.status(400).json({ message: "All credentials are required" });
        }
        const secret = user.password + process.env.JWT_SECRET;
        const token = jwt.sign(
            { _id: user._id, email: user.email },
            secret,
            { expiresIn: "5m" }
        );
        const link = `${process.env.Backend_url}/reset/${user._id}/${token}`;
        const details = {
            from: process.env.USER,
            to: req.body.email,
            subject: "Reset Password",
            text: link
        };
        transporter.sendMail(details, (err) => {
            if (err) {
                console.log("Error occurred in sending Email", err);
            }
            console.log("Email sent successfully");
        });
        res.json(link);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.put("/reset-password/:id/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        let userData = await User.findOne({ _id: req.params.id });
        if (!userData) {
            res.status(400).json({ message: "User doesn't exist" });
        }
        if (!password) {
            res.status(400).json({ message: "All credentials are required" });
        }
        const secret = userData.password + process.env.JWT_SECRET;
        const verify = jwt.verify(token, secret);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: {
                    password: hashedPassword,
                },
            }
        );
        res.status(200).json({ message: "Password Reset Successfully", email: verify.email, status: "verified", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get("/allusers", async (req, res) => {
    try {
        const users = await User.find({});
        if (!users) {
            res.status(400).json({ message: "Error occurred to find data" });
        }
        res.status(200).json({ message: "Data found successfully", users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
});

router.get("/getuser/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('address'); // Ensure 'address' matches your User model
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Data found successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete("/remove/:id", async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id });
        if (!user) {
            res.status(400).json({ message: "Data remove error" });
        }
        res.status(200).json({ message: "Successfully data removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update user avatar using Cloudinary
router.put("/edit/:id", uploads.single("avatar"), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let avatarUrl;

        // If a new avatar file is uploaded, upload it to Cloudinary
        if (req.file) {
            // Create a new Promise to handle the upload
            avatarUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    resource_type: "image",
                    folder: 'users', // Specify a folder in Cloudinary
                }, (error, result) => {
                    if (error) {
                        return reject(new Error("Error uploading image to Cloudinary."));
                    }
                    resolve(result.secure_url); // Resolve with the secure URL
                });

                // End the stream with the buffer
                uploadStream.end(req.file.buffer);
            });
        }

        // Update fields
        user.username = req.body.username || user.username; // Update username if provided
        user.email = req.body.email || user.email; // Update email if provided
        user.avatar = avatarUrl || user.avatar; // Update avatar if a new file is uploaded

        const updatedUser = await user.save();

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});




const userRouter = router;

module.exports = { userRouter };
