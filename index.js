const express = require('express');
const dotenv = require('dotenv');
const { dbConnection } = require('./db.js');
const cors = require('cors');
const { userRouter } = require('./Router/userRouter.js');
const path = require('path');
const { foodRouter } = require('./Router/foodRouter.js');
const { categoryRouter } = require('./Router/category.js');

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

// Route handlers
app.use("/user", userRouter);
app.use("/food", foodRouter);
app.use("/category", categoryRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
