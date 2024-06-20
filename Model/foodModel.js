const mongoose = require("mongoose");


const foodModel = mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },
        catagory:{
            type:String,
            required:true,
            trim:true
        },
        photo:{
            type:String,
            required:true
        },
        details:{
            type:String,
            required:true,
            trim:true
        }
    }
)