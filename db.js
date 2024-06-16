const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config()

const dataBaseConnection = async()=>{
    const params = {
        useNewUrlParser:true,
        useUnifiedTopology:true
    }
    try {
       await mongoose.connect(process.env.Mongo_Url,params)
       console.log('mongodb connected successfully') 
    } catch (error) {
        console.log("mongodb connection error",error)
    }
}

const dbConnection = dataBaseConnection();

module.exports={dbConnection}