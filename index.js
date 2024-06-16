const express = require('express');
const dotenv = require('dotenv');
const { dbConnection } = require('./db.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const { userRouter } = require('./Router/userRouter.js');

dotenv.config();

const app = express();

app.use(cors());

dbConnection

app.use(express.json());

app.use(bodyParser.json());

app.use("/user",userRouter)

const PORT = process.env.PORT || 8080;

app.listen(PORT,(()=>console.log(`localhost running under :${PORT}`)))

