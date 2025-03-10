const express = require('express');
const dotenv = require('dotenv');
const { dbConnection } = require('./db.js');
const cors = require('cors');
const path = require('path');
const { foodRouter } = require('./Router/foodRouter.js');
const { categoryRouter } = require('./Router/category.js');
const { userRouter } = require('./Router/userRouter.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads directory

// Connect to the database
dbConnection();

app.get("/ping",(req,res)=>{
    res.status(200).send("Service wake up")
})

// Route handlers
app.use("/user", userRouter);
app.use("/food", foodRouter);
app.use("/category", categoryRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
