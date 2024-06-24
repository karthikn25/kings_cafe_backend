const mongoose = require('mongoose');


const { Schema } = mongoose;

const foodSchema = new mongoose.Schema({
    foodName:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    category: 
    { 
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true 
    },
      
    photo:{
        type:String,
        required:true
    },
    details:{
        type:String,
        required:true
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
})



const Food = mongoose.model("Food",foodSchema);

module.exports = {Food}