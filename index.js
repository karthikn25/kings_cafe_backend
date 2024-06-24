const express = require('express');
const dotenv = require('dotenv');
const { dbConnection } = require('./db.js');
const cors = require('cors');
const { userRouter } = require('./Router/userRouter.js');
const path = require('path');
const { foodRouter } = require('./Router/foodRouter.js');
const { isAuth } = require('./Controller/auth.js');
const bodyParser = require('body-parser');
const { categoryRouter } = require('./Router/category.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use(cors());

dbConnection()

app.use(bodyParser.json());

app.use("/uploads",express.static(path.join(__dirname,"uploads")));

app.use("/user",userRouter)

app.use("/food",isAuth,foodRouter)

app.use("/category",isAuth,categoryRouter)

app.listen(PORT,(()=>console.log(`localhost running under :${PORT}`)))

